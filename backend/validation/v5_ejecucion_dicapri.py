"""
V5 · Ejecución de escenarios con barrido del desempeño del detector — Prototipo Digital Textil
(versión evaluada V20.4, commit cddd62e). Usa el motor de v4_escenarios_dicapri.py (v1.2) sin cambios.

Decisión del investigador con su asesor (9 nov. 2026): por el plazo, no se toman fotos nuevas ni registro
AS-IS en planta. Por eso el recall (TPR) y la tasa de falsas alarmas (FPR) de YOLO NO se miden: se barren
en una rejilla fijada antes de ejecutar. Los resultados son condicionales al desempeño del detector.

Requisitos del manual (V5) que cumple:
 (1) mismas semillas y mismos eventos para todas las políticas: flujos sellados de V4 (semillas 20261025+i);
 (2) mismo equipo y mismos límites para todas;
 (3) orden de ejecución de las políticas aleatorizado por réplica (semilla de orden registrada);
 (4) versiones de Python y librerías registradas;
 (5) resultados brutos de TODAS las réplicas en CSV;
 (6) aviso si se supera el umbral de tiempo de contingencia (doble de lo estimado);
 (7) no hay parámetros por ajustar en esta etapa (q se calibró en V4 con semillas de calibración).
"""
import os, sys, json, time, platform, hashlib, io, contextlib, importlib.util
import numpy as np
import pandas as pd

AQUI = os.path.dirname(os.path.abspath(__file__))
V4_PATH = os.environ.get("V4_SCRIPT", os.path.join(AQUI, "v4_escenarios_dicapri.py"))
V4_SALIDA = os.environ.get("V4_SALIDA", os.path.join(AQUI, "salida"))
OUT_DIR = os.environ.get("OUT_DIR", os.path.join(AQUI, "salida_v5"))
os.makedirs(OUT_DIR, exist_ok=True)

# ---------------------------------------------------------------- rejilla fijada antes de ejecutar
# Rejilla inicial: TPR 0,50–0,95 y FPR 0,005–0,05. El recall de equilibrio quedó en el borde inferior (0,50),
# así que, como pide el manual, se amplió una sola vez antes de analizar: TPR desde 0,10 y FPR desde 0,001.
TPR_GRID = [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 0.95]
FPR_GRID = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05]
POL_CAMARA = ["carvalho", "solo_yolo", "solo_recurrencia", "integrada"]
POL_SIN_CAMARA = ["asis", "solo_rf"]
ESC_NORMALES = ["tipico", "borde_bajo", "borde_alto", "extremo"]
TIEMPO_ESTIMADO_S = 900                     # estimación previa; contingencia = el doble
SEED_ORDEN = 20261109

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()

def cargar_v4():
    spec = importlib.util.spec_from_file_location("v4", V4_PATH)
    m = importlib.util.module_from_spec(spec)
    with contextlib.redirect_stdout(io.StringIO()):
        spec.loader.exec_module(m)
    return m

if __name__ == "__main__":
    t0 = time.time()
    v4 = cargar_v4()
    ficha = pd.read_csv(os.path.join(V4_SALIDA, "ficha_escenarios.csv")).set_index("escenario")
    npz = np.load(os.path.join(V4_SALIDA, "flujos_eventos.npz"))
    rng_orden = np.random.default_rng(SEED_ORDEN)

    print("=== V5 · Ejecución con barrido del detector ===")
    print("Python", platform.python_version(), "| numpy", np.__version__, "| pandas", pd.__version__)
    print("Motor V4:", V4_PATH, "| SHA256", sha256(V4_PATH)[:16])
    print("Flujos:", os.path.join(V4_SALIDA, "flujos_eventos.npz"), "| SHA256", sha256(os.path.join(V4_SALIDA, "flujos_eventos.npz"))[:16])

    filas, orden_log = [], []
    def correr(esc_nombre, r, politicas, tpr, fpr):
        esc = dict(v4.ESCENARIOS[esc_nombre]); q = float(ficha.loc[esc_nombre, "q"])
        if tpr is not None: esc["tpr"] = tpr
        if fpr is not None: esc["fpr"] = fpr
        U = npz[f"{esc_nombre}_r{r + 1:02d}"].astype(np.float64)
        maq = v4.maquina_de_replica(r)
        orden = list(rng_orden.permutation(politicas))
        orden_log.append(dict(escenario=esc_nombre, replica=r + 1, tpr=tpr, fpr=fpr, orden=" > ".join(orden)))
        for pol in orden:
            o = v4.simular(U, esc, pol, q, maquina=maq)
            filas.append(dict(escenario=esc_nombre, replica=r + 1, semilla=v4.SEED_EVAL0 + r, maquina=maq,
                              riesgo_rf=v4.RIESGO_RF[maq][0], politica=pol, tpr=tpr, fpr=fpr,
                              tasa_pct=100 * o["tasa"], defectuosas=o["defectuosas"], medias=o["medias"],
                              respuesta_min=o["respuesta_min"], episodios=o["episodios"],
                              falsas_alarmas=o["falsas_alarmas"], inspecciones_sin_falla=o["inspecciones_sin_falla"],
                              falsas_por_turno=o["falsas_por_turno"], parada_min=o["parada_min"]))

    for esc_nombre in ESC_NORMALES:
        for r in range(v4.N_REPLICAS):
            correr(esc_nombre, r, POL_SIN_CAMARA, None, None)
            correr(esc_nombre, r, ["integrada"], 0.0, 0.0)             # integrada sin cámara: aísla el aporte de YOLO
            for tpr in TPR_GRID:
                for fpr in FPR_GRID:
                    correr(esc_nombre, r, POL_CAMARA, tpr, fpr)
        print(f"   {esc_nombre:18s} listo · {time.time() - t0:6.0f} s")
    for r in range(v4.N_REPLICAS):                                    # detector ciego: debe volver a la práctica actual
        correr("patologico_ciego", r, POL_SIN_CAMARA + POL_CAMARA, 0.0, 0.0)
        for tpr in TPR_GRID:                                          # ruido: 50 % de falsas alarmas
            correr("patologico_ruido", r, POL_CAMARA, tpr, 0.50)
        correr("patologico_ruido", r, POL_SIN_CAMARA, None, None)
    print(f"   patológicos         listo · {time.time() - t0:6.0f} s")

    dur = time.time() - t0
    if dur > 2 * TIEMPO_ESTIMADO_S:
        print(f"!! CONTINGENCIA: la corrida tardó {dur:.0f} s, más del doble de lo estimado ({TIEMPO_ESTIMADO_S} s).")

    bruto = pd.DataFrame(filas)
    bruto.to_csv(os.path.join(OUT_DIR, "resultados_brutos_v5.csv"), index=False)
    pd.DataFrame(orden_log).to_csv(os.path.join(OUT_DIR, "orden_ejecucion.csv"), index=False)

    # ---------------- resumen descriptivo (las pruebas formales van en V6)
    clave = ["escenario", "politica", "tpr", "fpr"]
    res = (bruto.fillna({"tpr": -1, "fpr": -1}).groupby(clave)
           .agg(n=("tasa_pct", "size"), tasa_media=("tasa_pct", "mean"), tasa_de=("tasa_pct", "std"),
                respuesta_media=("respuesta_min", "mean"), falsas_turno=("falsas_por_turno", "mean"),
                sin_falla=("inspecciones_sin_falla", "mean"), parada_min=("parada_min", "mean"))
           .reset_index().replace({"tpr": {-1: np.nan}, "fpr": {-1: np.nan}}))
    res.to_csv(os.path.join(OUT_DIR, "resumen_v5.csv"), index=False)

    # ---------------- recall de equilibrio (E3) y límite de falsas alarmas
    # (a) frente a la práctica actual (criterio primario del plan V2);
    # (b) frente a la misma política integrada sin cámara (TPR = FPR = 0): aísla el aporte de YOLO,
    #     porque las paradas por sensores y la vigilancia por riesgo RF ya reducen defectos sin cámara.
    def dif(esc_nombre, ref, tpr, fpr):
        integ = bruto[(bruto.escenario == esc_nombre) & (bruto.politica == "integrada") &
                      (bruto.tpr == tpr) & (bruto.fpr == fpr)].set_index("replica")
        d = (integ["tasa_pct"] - ref.loc[integ.index]).values
        m, se = d.mean(), d.std(ddof=1) / np.sqrt(len(d))
        return m, m - 2.0096 * se, m + 2.0096 * se, integ["falsas_por_turno"].mean()   # t(0,975; 49)
    eq = []
    for esc_nombre in ESC_NORMALES:
        b = bruto[bruto.escenario == esc_nombre]
        asis = b[b.politica == "asis"].set_index("replica")["tasa_pct"]
        ciega = b[(b.politica == "integrada") & (b.tpr == 0.0) & (b.fpr == 0.0)].set_index("replica")["tasa_pct"]
        for fpr in FPR_GRID:
            min_asis = min_meta = min_cam = None; ft = []
            for tpr in TPR_GRID:
                m1, lo1, hi1, falsas = dif(esc_nombre, asis, tpr, fpr)
                m2, lo2, hi2, _ = dif(esc_nombre, ciega, tpr, fpr)
                red = -m1 / asis.mean()
                if hi1 < 0 and min_asis is None: min_asis = tpr
                if hi1 < 0 and red >= 0.10 and min_meta is None: min_meta = tpr
                if hi2 < 0 and min_cam is None: min_cam = tpr
                ft.append(falsas)
                eq.append(dict(escenario=esc_nombre, fpr=fpr, tpr=tpr, dif_vs_actual_pp=m1, ic95_inf_actual=lo1, ic95_sup_actual=hi1,
                               reduccion_relativa_vs_actual=red, dif_vs_integrada_sin_camara_pp=m2,
                               ic95_inf_sin_camara=lo2, ic95_sup_sin_camara=hi2, falsas_por_turno=falsas))
            print(f"   {esc_nombre:11s} FPR {fpr:<5}: supera a la práctica actual desde TPR {min_asis} (meta 10 % desde {min_meta}) · "
                  f"la cámara aporta desde TPR {min_cam} · falsas/turno {min(ft):.2f}–{max(ft):.2f}")
    pd.DataFrame(eq).to_csv(os.path.join(OUT_DIR, "recall_equilibrio.csv"), index=False)

    meta = dict(fecha=time.strftime("%Y-%m-%d %H:%M"), duracion_s=round(dur, 1), python=platform.python_version(),
                numpy=np.__version__, pandas=pd.__version__, motor_v4=os.path.basename(V4_PATH),
                sha256_motor_v4=sha256(V4_PATH), sha256_flujos=sha256(os.path.join(V4_SALIDA, "flujos_eventos.npz")),
                semillas_evaluacion="20261025+i (i=0..49)", semilla_orden=SEED_ORDEN,
                rejilla=dict(tpr=TPR_GRID, fpr=FPR_GRID), filas=len(bruto),
                nota="TPR y FPR barridos, no medidos: decisión del investigador con su asesor (9 nov. 2026).")
    json.dump(meta, open(os.path.join(OUT_DIR, "version_v5.json"), "w"), ensure_ascii=False, indent=2)
    print(f"\n{len(bruto)} filas guardadas en {OUT_DIR} · {dur:.0f} s")