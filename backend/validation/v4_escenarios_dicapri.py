# -*- coding: utf-8 -*-
"""
V4 · Escenarios y datos sintéticos (v1.2) — Prototipo Digital Textil (versión evaluada V20.4, commit cddd62e)
Manual de Validación del Aporte (PIA1). Plan V2 aprobado el 8/11/2026.

Qué hace este script (se ejecuta de una sola vez en Google Colab):
  1. Calcula las ANCLAS desde la base híbrida v3.5 (máquinas M07–M12) y declara su origen.
  2. Define los escenarios del plan (típico, borde, extremo, patológico) con su ancla.
  3. Calibra la probabilidad de defecto durante una anomalía para reproducir la tasa AS-IS,
     usando SOLO semillas de calibración (20260000 + i).
  4. Genera los flujos de eventos aleatorios comunes (50 réplicas por escenario, semillas
     20261025 + i) con dos generadores distintos y guarda las semillas.
  5. Comprueba la bondad de ajuste (KS) y advierte sobre su bajo poder.
  6. Reimplementa el modelo de Markov de Carvalho et al. (2026) y lo compara con su Tabla 3
     (criterio del plan: ±10 %, a la precisión publicada).
  7. Imprime el porcentaje real/sintético y guarda todo en la carpeta de salida.

No ejecuta la comparación de políticas con semillas de evaluación: eso corresponde a V5.
Requisitos (preinstalados en Colab): numpy, pandas, scipy, openpyxl.
"""
import json, math, os, platform, sys
import numpy as np
import pandas as pd
from scipy import stats

# ------------------------------------------------------------------ configuración
BASE_XLSX = os.environ.get("BASE_XLSX", "/content/BASE_DE_DATOS_DICAPRI_2025_HIBRIDA_v3.5.xlsx")
OUT_DIR = os.environ.get("OUT_DIR", "/content/salida_v4")
MAQUINAS = [f"M{i:02d}" for i in range(7, 13)]          # alcance del prototipo: tobilleras blancas con diseño
N_MEDIAS = 1200                                          # medias por réplica (50 docenas comerciales)
N_REPLICAS = 50                                          # manual: 50 réplicas por escenario en simulación
SEED_EVAL0, SEED_CAL0 = 20261025, 20260000               # evaluación (V5) y calibración (V4), nunca mezcladas
os.makedirs(OUT_DIR, exist_ok=True)

# ------------------------------------------------------------------ 1. anclas
def leer(hoja):
    return pd.read_excel(BASE_XLSX, sheet_name=hoja, header=2)

prod = leer("06_HIST_PRODUCCION_2025"); fall = leer("08_HIST_FALLAS_PARADAS_2025")
defe = leer("07_HIST_DEFECTOS_2025"); amef = leer("05_CAT_FALLAS_AMEF")
P = prod[prod["ID_Máquina"].isin(MAQUINAS)]; Fh = fall[fall["ID_Máquina"].isin(MAQUINAS)]; Dh = defe[defe["ID_Máquina"].isin(MAQUINAS)]

horas_op = P["Tiempo_operativo_h"].sum()
CICLO_S = 3600 * horas_op / P["Producción_total"].sum()                      # s por media
ALFA_TIPICO = P["Rechazadas_total"].sum() / P["Producción_total"].sum()      # tasa AS-IS de M07–M12
FCOLS = [c for c in fall.columns if isinstance(c, str) and len(c) == 3 and c.startswith("F")]
TASA_FALLA_H = (Fh[FCOLS].sum() / horas_op).to_dict()                        # eventos por hora de operación
DCOLS = [c for c in defe.columns if isinstance(c, str) and len(c) == 3 and c.startswith("D")]
MEZCLA_DEF = (Dh[DCOLS].sum() / Dh[DCOLS].sum().sum()).to_dict()
TASAS_MM = (P["Rechazadas_total"] / P["Producción_total"]).values          # 72 valores máquina-mes (para KS)

def punto_medio(txt):
    try:
        a, b = str(txt).replace(",", ".").split("–"); return (float(a) + float(b)) / 2
    except ValueError:
        return float("nan")
DUR_REP_MIN = {r.ID_Falla: punto_medio(r["Duración_ref_min"]) for _, r in amef.iterrows()}
NPR = {r.ID_Falla: int(r.S * r.O * r.D) for _, r in amef.iterrows()}   # S×O×D: no depende de la caché de fórmulas del Excel

AUTO_STOP = {"F03"}                         # rotura de hilo: parada automática (14_METODOLOGIA)
FALLA_A_CLASE = {"F01": "D01", "F02": "D01", "F03": "D03", "F04": "D03", "F05": "D03", "F06": "D03",
                 "F07": "D09", "F08": "D04", "F09": "D04", "F10": "OTRO", "F11": "OTRO", "F14": "OTRO"}
CLASE_A_FALLA_API = {"D01": "F01", "D03": "F03", "D04": "F09", "D06": "F12", "D09": "F07"}   # DEFECT_RULES de api.py
CLASES_FONDO = ["D05", "D06", "D07"]       # defectos no ligados a fallas monitoreadas
FRAC_FONDO = sum(MEZCLA_DEF[c] for c in CLASES_FONDO)

ANCLAS = pd.DataFrame([
    ("Ciclo por media (s)", round(CICLO_S, 1), "Base v3.5, hoja 06 (M07–M12)", "Generado mediante IA (F4)"),
    ("Tasa AS-IS típica", round(ALFA_TIPICO, 5), "Base v3.5, hojas 06–07 (M07–M12)", "Generado mediante IA (F4)"),
    ("Tasa por falla (eventos/h)", json.dumps({k: round(v, 4) for k, v in TASA_FALLA_H.items()}), "Base v3.5, hoja 08", "Generado mediante IA (F4)"),
    ("Mezcla de defectos", json.dumps({k: round(v, 4) for k, v in MEZCLA_DEF.items()}), "Base v3.5, hoja 07", "Generado mediante IA (F4)"),
    ("Fracción de defectos de fondo (D05+D06+D07)", round(FRAC_FONDO, 4), "Base v3.5, hoja 07", "Generado mediante IA (F4)"),
    ("Duración de reparación por falla (min)", json.dumps(DUR_REP_MIN), "AMEF, hoja 05 (punto medio)", "Información de planta (verbal)"),
    ("NPR por falla", json.dumps(NPR), "AMEF, hoja 05", "Información de planta (verbal)"),
    ("Falla con parada automática", "F03", "14_METODOLOGIA (operación reportada)", "Información de planta (verbal)"),
    ("Tiempo del operario para notar un defecto (min)", "60 (30 y 120 en borde)", "Carvalho et al. (2026), Tabla 3", "Publicado"),
    ("Retardo de respuesta a una alarma (min)", 2, "Carvalho et al. (2026), Tabla 1", "Publicado"),
    ("Tiempo de inspección por falsa alarma (min)", 5, "Carvalho et al. (2026), Tabla 1", "Publicado"),
    ("Eficacia del operario / jefe de planta", "0,55 / 0,83", "Motor de V20.4", "Supuesto sin fuente (se barre en E3)"),
    ("Ventana de recurrencia", "6 defectos en 24 medias", "recurrence.js de V20.4", "Diseño del artefacto"),
], columns=["Parámetro", "Valor", "Fuente", "Tipo de origen"])

# ------------------------------------------------------------------ 2. escenarios
BASE_ESC = dict(alfa=ALFA_TIPICO, t_op_min=60.0, mult_fallas=1.0, ef_op=0.55, ef_jefe=0.83,
                tpr=None, fpr=None, ventana=6, rf_alto=False, k_rf=0.75)
ESCENARIOS = {
    "tipico":            dict(BASE_ESC, ancla="Tasa M07–M12 de la base v3.5; tiempo del operario 60 min (Carvalho et al.)"),
    "borde_bajo":        dict(BASE_ESC, alfa=0.0190, t_op_min=30.0, ventana=5, ancla="Tasa mínima por máquina (1,90 %); 30 min; ventana 5/24"),
    "borde_alto":        dict(BASE_ESC, alfa=0.0464, t_op_min=120.0, ventana=7, ancla="Tasa máxima por máquina (4,64 %); 120 min; ventana 7/24"),
    "extremo":           dict(BASE_ESC, mult_fallas=4.0, ef_op=0.30, ancla="Incidentes ×4 (estrés crítico de V20.4); eficacia del operario 30 %; q del típico (sin recalibrar)"),
    "patologico_ciego":  dict(BASE_ESC, tpr=0.0, fpr=0.0, ancla="API caída o detector ciego: debe volver a la práctica actual"),
    "patologico_ruido":  dict(BASE_ESC, fpr=0.50, ancla="Imágenes inválidas: 50 % de falsas alarmas; debe fallar de forma segura"),
}

# ------------------------------------------------------------------ 3. generadores de eventos (números aleatorios comunes)
MODOS = [f for f in FCOLS if TASA_FALLA_H.get(f, 0) > 0]
PESOS = np.array([TASA_FALLA_H[m] for m in MODOS]); PESOS = PESOS / PESOS.sum()
TASA_TOTAL_H = sum(TASA_FALLA_H[m] for m in MODOS)
COLS = ["u_inicio", "u_modo", "u_defecto", "u_fondo", "u_detec", "u_falsa", "u_operario", "u_reparacion", "u_eficacia"]

def generador_A(seed, n=N_MEDIAS):
    """Bernoulli por media: un número uniforme por media y por proceso."""
    rng = np.random.default_rng(seed)
    return rng.random((n, len(COLS)), dtype=np.float64)

def generador_B(seed, n=N_MEDIAS, mult=1.0):
    """Proceso de Poisson en tiempo continuo: tiempos entre fallas exponenciales,
    convertidos a índice de media; el resto de flujos igual que A."""
    rng = np.random.default_rng(seed + 7_000_000)
    U = rng.random((n, len(COLS)))
    horas = n * CICLO_S / 3600
    t, marcas = 0.0, np.ones(n)
    while True:
        t += rng.exponential(1 / (TASA_TOTAL_H * mult))
        if t >= horas:
            break
        marcas[min(int(t * 3600 / CICLO_S), n - 1)] = 0.0       # 0 fuerza inicio de falla
    U[:, 0] = np.where(marcas == 0.0, 0.0, 1.0)                  # u_inicio binario: 0 = inicia falla
    return U

# ------------------------------------------------------------------ 4. lógica de decisión de V20.4 (espejo del código, commit cddd62e)
# Riesgo y falla dominante que devuelve /risk/{máquina} con random_forest_riesgo.joblib (última fila de cada máquina).
RIESGO_RF = {"M07": ("bajo", 126), "M08": ("alto", 126), "M09": ("medio", 126),
             "M10": ("medio", 126), "M11": ("alto", 126), "M12": ("bajo", 126)}
VIS_FALLA = {"D01": "F01", "D03": "F03", "D04": "F09", "D06": "F12", "D09": "F07"}   # visualDefectCatalog de main.js
PARADA_SENSORES = {"F03", "F04", "F10", "F09"}   # main.js: brokenThread, jam (F04/F10) y elasticTrigger (F09) detienen al instante

def decision_integrada(clase_vista, riesgo, npr_rf):
    """Espejo de updateIntegratedDecision() de main.js. clase_vista = None si YOLO no detecta defecto."""
    hay = clase_vista is not None
    npr_vis = NPR.get(VIS_FALLA.get(clase_vista, ""), 0) if hay else 0
    npr_max = max(npr_vis, npr_rf)
    nivel, estado = "normal", "Continuar operación"
    if not hay and riesgo == "medio":
        nivel, estado = "preventive", "Inspección preventiva"
    elif not hay and riesgo == "alto":
        nivel, estado = "warning", "Intervención prioritaria"
    elif hay and riesgo == "bajo":
        nivel, estado = "warning", "Segregar prenda"
    elif hay and riesgo == "medio":
        nivel, estado = "high", "Segregar y ajustar"
    elif hay and riesgo == "alto":
        nivel, estado = "critical", "Parada preventiva"
    if hay and clase_vista == "D01":
        nivel, estado = "critical", "Parada por posible rotura de aguja"
    if npr_max >= 300 and nivel == "normal":
        nivel, estado = "preventive", "Inspección por criticidad AMEF"
    elif npr_max >= 300 and hay and nivel != "critical":
        nivel, estado = "critical", "Parada por criticidad AMEF"
    return nivel, estado

class Control:
    """Ciclo híbrido de main.js (applyHybridDecision + registerRecurrenceInspection), por media inspeccionada."""
    def __init__(self, politica, esc, maquina):
        self.p, self.esc = politica, esc
        self.riesgo, self.npr_rf = RIESGO_RF.get(maquina, ("bajo", 0)) if politica == "integrada" else ("bajo", 0)
        self.consec, self.ventana, self.validar = 0, [], 0
        self.parada_por_recurrencia = False
    def _tras_intervencion(self):
        # main.js 4079–4086: tras CUALQUIER intervención se exige validar 2 medias y se reinicia el conteo
        # de defectos seguidos; la ventana 6/24 solo se vacía si la parada fue por recurrencia (línea 4081).
        self.consec = 0
        if self.parada_por_recurrencia:
            self.ventana = []
        self.parada_por_recurrencia = False
        self.validar = 2 if self.p in ("solo_yolo", "integrada") else 0
    def tras_reparacion(self):
        self._tras_intervencion()
    def tras_parada(self):
        self._tras_intervencion()
    def inspeccion(self, detectado, clase_vista):
        """Devuelve 'detener' o 'continuar'."""
        if self.p == "carvalho":
            return "detener" if detectado else "continuar"
        if self.validar > 0:                           # validación posterior: dos medias conformes seguidas
            if detectado:
                self.validar = 0
                return "detener"
            self.validar -= 1
            return "continuar"
        if detectado:
            self.consec += 1
            if self.p in ("solo_yolo", "integrada"):
                nivel, _ = decision_integrada(clase_vista, self.riesgo, self.npr_rf)
                if nivel == "critical" or self.consec >= 2:
                    return "detener"           # main.js 4553: si la máquina quedó detenida, esta media no entra a la ventana
        else:
            self.consec = 0
        if self.p in ("solo_recurrencia", "integrada"):
            self.ventana = (self.ventana + [1 if detectado else 0])[-24:]
            if len(self.ventana) == 24 and sum(self.ventana) >= self.esc["ventana"]:
                self.parada_por_recurrencia = True
                return "detener"
        return "continuar"

# ------------------------------------------------------------------ 5. motor de simulación (se reutiliza en V5)
def simular(U, esc, politica, q, p_inicio=None, maquina="M07"):
    """Simula una réplica de N_MEDIAS medias. Políticas: asis, carvalho, solo_yolo, solo_rf, solo_recurrencia, integrada."""
    c_min = CICLO_S / 60
    p_inicio = TASA_TOTAL_H * esc["mult_fallas"] * CICLO_S / 3600 if p_inicio is None else p_inicio
    p0 = FRAC_FONDO * esc["alfa"]
    camara = politica in ("carvalho", "solo_yolo", "solo_recurrencia", "integrada")
    tpr = esc["tpr"] if esc["tpr"] is not None else 0.0
    fpr = esc["fpr"] if esc["fpr"] is not None else 0.0
    riesgo_alto = RIESGO_RF.get(maquina, ("bajo", 0))[0] == "alto"
    t_op = esc["t_op_min"] * (esc["k_rf"] if politica in ("solo_rf", "integrada") and riesgo_alto else 1.0)
    paro_inmediato = PARADA_SENSORES if politica == "integrada" else AUTO_STOP
    ctl = Control(politica, esc, maquina)
    defect = parada = falsas = sin_falla = 0.0; respuestas = []
    activa = None; escalar = False; pend_resp = None; ultimo_fp = False
    for i in range(U.shape[0]):
        u = U[i]
        if activa is None and u[0] < p_inicio:
            modo = MODOS[int(np.searchsorted(np.cumsum(PESOS), u[1]))]
            if modo in paro_inmediato:                  # parada inmediata (máquina o sensores): la media en curso se segrega
                defect += 1; parada += DUR_REP_MIN.get(modo, 1.0) * (0.7 + 0.6 * u[7]); respuestas.append(c_min)
                ctl.tras_reparacion()
                continue
            activa = dict(modo=modo, clase=FALLA_A_CLASE[modo], inicio=i, t_op=-math.log(max(u[6], 1e-12)) * t_op)
        es_def = False; clase = None
        if activa is not None and u[2] < q:
            es_def, clase = True, activa["clase"]
        elif u[3] < p0:
            es_def, clase = True, "FONDO"
        defect += es_def
        detener = None
        if activa is not None and (i - activa["inicio"] + 1) * c_min >= activa["t_op"]:
            detener = "real"                            # el operario lo nota (todas las políticas)
        if camara and detener is None:
            detectado = (es_def and clase != "OTRO" and u[4] < tpr) or ((not es_def) and u[5] < fpr)
            if detectado:
                ultimo_fp = not es_def
            clase_vista = None if not detectado else (clase if es_def and clase in VIS_FALLA else ("D06" if clase == "FONDO" else "D09"))
            if politica == "carvalho":
                if detectado and pend_resp is None:
                    pend_resp = max(1, round(2 / c_min))   # 2 min de respuesta (Carvalho et al., Tabla 1)
                if pend_resp is not None:
                    pend_resp -= 1
                    if pend_resp <= 0:
                        detener = "real" if activa is not None else ("falsa" if ultimo_fp else "sin_falla"); pend_resp = None
            elif ctl.inspeccion(detectado, clase_vista) == "detener":
                detener = "real" if activa is not None else ("falsa" if ultimo_fp else "sin_falla")
        if detener in ("falsa", "sin_falla"):
            falsas += detener == "falsa"; sin_falla += detener == "sin_falla"
            parada += 5.0; ctl.tras_parada(); pend_resp = None
        elif detener == "real":
            respuestas.append((i - activa["inicio"] + 1) * c_min)
            eficacia = esc["ef_jefe"] if escalar else esc["ef_op"]
            parada += DUR_REP_MIN.get(activa["modo"], 2.0) * (0.7 + 0.6 * u[7]); pend_resp = None
            if u[8] < eficacia:
                activa = None; escalar = False; ctl.tras_reparacion()
            else:                                        # la intervención no resolvió: la anomalía sigue y se escala
                escalar = True; activa["inicio"] = i + 1; ctl.tras_parada()
                activa["t_op"] = -math.log(max(1 - u[6], 1e-12)) * t_op
    horas = U.shape[0] * CICLO_S / 3600
    return dict(medias=U.shape[0], defectuosas=int(defect), tasa=defect / U.shape[0],
                respuesta_min=float(np.mean(respuestas)) if respuestas else float("nan"),
                falsas_alarmas=int(falsas), falsas_por_turno=falsas / (horas / 5.0),
                inspecciones_sin_falla=int(sin_falla), parada_min=parada, episodios=len(respuestas))

def maquina_de_replica(r):
    """Las réplicas recorren M07–M12 en orden, para cubrir los tres niveles de riesgo de Random Forest."""
    return MAQUINAS[r % len(MAQUINAS)]


def casos_equivalencia():
    """24 combinaciones (4 estados visuales × 3 riesgos × NPR de la falla dominante 126 o 392): superconjunto de las 18 del plan."""
    filas, k = [], 0
    for visual in ("Conforme", "D09", "D04", "D01"):
        for riesgo in ("bajo", "medio", "alto"):
            for npr_rf in (126, 392):
                k += 1
                nivel, estado = decision_integrada(None if visual == "Conforme" else visual, riesgo, npr_rf)
                filas.append(dict(id=f"C{k:02d}", visual=visual, riesgo=riesgo, npr_rf=npr_rf, nivel_esperado=nivel, estado_esperado=estado))
    return pd.DataFrame(filas)

SECUENCIAS = {   # observaciones por media: "C" conforme, código de clase detectada, "R" reparación terminada
    "S1 D01 aislada (M07, riesgo bajo)": ("M07", ["D01"]),
    "S2 defecto aislado y luego conforme (M07)": ("M07", ["D09", "C"]),
    "S3 dos defectos seguidos (M07)": ("M07", ["D09", "D09"]),
    "S4 defecto con riesgo alto (M08)": ("M08", ["D09"]),
    "S5 D04 con NPR 360 (M07)": ("M07", ["D04"]),
    "S6 validación fallida tras reparar (M07)": ("M07", ["D09", "D09", "R", "D09"]),
    "S7 validación superada y defecto aislado (M07)": ("M07", ["D09", "D09", "R", "C", "C", "D09"]),
    "S8 recurrencia 6 en 24 sin defectos seguidos (M07)": ("M07", ["D09", "C", "C", "C"] * 6),
    "S9 recurrencia 5 en 24 (M07)": ("M07", ["D09", "C", "C", "C"] * 5 + ["C"] * 4),
    "S10 la ventana 6/24 se conserva tras una parada por 2 defectos seguidos (M07)":
        ("M07", ["D09", "C", "C", "C"] * 3 + ["D09", "D09", "R", "C", "C"] + ["C", "C", "D09", "C", "C", "C", "D09", "C", "C", "C", "C"]),
}

def secuencias_esperadas():
    filas = []
    for nombre, (maq, obs) in SECUENCIAS.items():
        ctl = Control("integrada", dict(ESCENARIOS["tipico"]), maq); paso = 0
        for o in obs:
            if o == "R":
                ctl.tras_reparacion(); filas.append(dict(secuencia=nombre, paso="—", observacion="reparación", accion_esperada="iniciar validación de 2 medias")); continue
            paso += 1
            acc = ctl.inspeccion(o != "C", None if o == "C" else o)
            filas.append(dict(secuencia=nombre, paso=paso, observacion=o, accion_esperada=acc))
            if acc == "detener":
                ctl.tras_parada()
    return pd.DataFrame(filas)

REGLAS_CODIGO = pd.DataFrame([
    ("Decisión integrada (24 casos)", "updateIntegratedDecision()", "src/main.js 3062–3188", "decision_integrada()", "Prueba automática con Playwright"),
    ("Parada por 2 defectos seguidos", "applyHybridDecision()", "src/main.js 4206 y 4227", "Control.inspeccion()", "Inspección de código + secuencias S2, S3"),
    ("Validación de 2 medias conformes", "applyHybridDecision()", "src/main.js 4079–4100 (tras cualquier intervención) y 4209–4222", "Control._tras_intervencion()", "Inspección de código + secuencias S6, S7, S10"),
    ("Recurrencia 6 en 24 con ventana completa", "registerRecurrenceInspection() y recurrence.js", "src/main.js 4268–4290, 4079–4083 (vaciado solo tras parada por recurrencia) y 4553 (no registra si la máquina quedó detenida o en validación); src/recurrence.js 6–20", "Control.inspeccion() y Control._tras_intervencion()", "Inspección de código + secuencias S8, S9, S10"),
    ("Parada inmediata por sensores (F03, F04/F10, F09)", "runAutonomousCycle()", "src/main.js 4483–4514", "PARADA_SENSORES", "Inspección de código"),
    ("Riesgo y NPR por máquina", "/risk/{máquina} en api.py", "backend/api.py 145–189", "RIESGO_RF", "Reproducido con el .joblib (M07–M12)"),
], columns=["Regla", "Función en el prototipo", "Ubicación (commit cddd62e)", "Equivalente en el script", "Cómo se verifica"])

# ------------------------------------------------------------------ 6. calibración (solo semillas de calibración)
def tasa_asis(q, esc, n_rep=N_REPLICAS, gen=generador_A):
    return np.mean([simular(gen(SEED_CAL0 + r), esc, "asis", q, maquina=maquina_de_replica(r))["tasa"] for r in range(n_rep)])

def calibrar_q(esc):
    lo, hi = 0.0, 1.0
    if tasa_asis(hi, esc) < esc["alfa"]:
        return 1.0, tasa_asis(1.0, esc), False
    for _ in range(16):
        mid = (lo + hi) / 2
        if tasa_asis(mid, esc) < esc["alfa"]:
            lo = mid
        else:
            hi = mid
    q = (lo + hi) / 2
    return q, tasa_asis(q, esc), True

# ------------------------------------------------------------------ 7. Carvalho et al. (2026): cadena de Markov y Tabla 3
def carvalho(t_det_min, alfa=0.014, mu_r=60 / 15, mu_i=60 / 5, tpr=1.0, fpr=0.001, fpm=1.0, thr_real=1000.0, resp_min=2.0):
    g = 60 / t_det_min                                  # tasa de detección y parada actual (por hora)
    lam_d = g * alfa / (1 - alfa)                       # de α = P_D / (P_O + P_D)
    pO, pD, pS = 1.0, lam_d / g, lam_d / mu_r          # AS-IS: balance de flujos, se normaliza
    z = pO + pD + pS; pO, pD, pS = pO / z, pD / z, pS / z
    theo = thr_real / pO                               # la producción real (conforme) = teórica × P_O
    t_auto = (1 / tpr - 0.5) / fpm + resp_min           # minutos hasta detener con el detector
    g2 = 60 / t_auto; lam_fa = fpr * fpm * 60
    qO, qD, qS, qF = 1.0, lam_d / g2, lam_d / mu_r, lam_fa / mu_i
    z2 = qO + qD + qS + qF; qO, qD, qS, qF = qO / z2, qD / z2, qS / z2, qF / z2
    alfa2 = qD / (qO + qD + qF)
    return dict(t_det_min=t_det_min, gamma=g, lambda_d=lam_d, parada_asis=pS, thr_teorico=theo,
                alfa_tobe=alfa2, parada_tobe=qS + qF, thr_real_tobe=theo * qO,
                reduccion_desperdicio=1 - (theo * qD) / (theo * pD), falsas_por_turno8h=lam_fa * 8 * qO)

TABLA3 = {  # Carvalho et al. (2026), Tabla 3 (valores publicados)
    2.5: dict(gamma=24, lambda_d=0.34, parada_asis=0.077, thr_teorico=1099, alfa_tobe=0.014, reduccion_desperdicio=None),
    30: dict(gamma=2, lambda_d=0.03, parada_asis=0.007, thr_teorico=1021, alfa_tobe=0.0012, reduccion_desperdicio=0.92),
    60: dict(gamma=1, lambda_d=0.014, parada_asis=0.003, thr_teorico=1018, alfa_tobe=0.0006, reduccion_desperdicio=0.96),
    90: dict(gamma=0.67, lambda_d=0.009, parada_asis=0.002, thr_teorico=1016, alfa_tobe=0.0004, reduccion_desperdicio=0.97),
    120: dict(gamma=0.5, lambda_d=0.007, parada_asis=0.002, thr_teorico=1016, alfa_tobe=0.0003, reduccion_desperdicio=0.98),
}
DECIMALES = dict(gamma=2, lambda_d=3, parada_asis=3, thr_teorico=0, alfa_tobe=4, reduccion_desperdicio=2)

def reproducir_carvalho():
    filas = []
    for t, pub in TABLA3.items():
        rep = carvalho(t)
        for k, v_pub in pub.items():
            if v_pub is None:
                continue
            v_rep = round(rep[k], DECIMALES[k])
            dif = abs(v_rep - v_pub) / abs(v_pub) if v_pub else 0.0
            filas.append(dict(t_det_min=t, indicador=k, publicado=v_pub, reproducido=v_rep,
                              diferencia_rel=round(dif, 4), cumple_10pct=dif <= 0.10))
    df = pd.DataFrame(filas)
    fa = pd.DataFrame([dict(fpr=f, falsas_por_turno8h=round(carvalho(60, fpr=f)["falsas_por_turno8h"], 3))
                       for f in (0.001, 0.00058)])
    return df, fa

# ------------------------------------------------------------------ 8. equivalencia con el prototipo y ejecución
if __name__ == "__main__":
    print("=== V4 · Escenarios y datos sintéticos ===")
    print("Python", platform.python_version(), "| numpy", np.__version__, "| pandas", pd.__version__, "| scipy", __import__("scipy").__version__)
    print("\n1) Anclas (origen declarado):"); print(ANCLAS.to_string(index=False))
    ANCLAS.to_csv(f"{OUT_DIR}/anclas.csv", index=False)

    print("\n2–3) Calibración de q (probabilidad de defecto durante una anomalía), semillas 20260000+i:")
    filas_esc = []
    for nombre, esc in ESCENARIOS.items():
        if nombre.startswith("patologico"):
            q, logrado, ok = None, None, None
        elif nombre == "extremo":                       # el estrés no se recalibra: usa el q del típico y deja subir la tasa
            q = ESCENARIOS["tipico"]["q"]; esc["q"] = q
            logrado, ok = tasa_asis(q, esc), None
        else:
            q, logrado, ok = calibrar_q(esc)
            esc["q"] = q
        filas_esc.append(dict(escenario=nombre, alfa_objetivo=esc["alfa"], q=q, tasa_calibrada=logrado,
                              alcanzable=ok, t_op_min=esc["t_op_min"], mult_fallas=esc["mult_fallas"],
                              ef_operario=esc["ef_op"], ef_jefe=esc["ef_jefe"], ventana=esc["ventana"],
                              tpr=esc["tpr"], fpr=esc["fpr"], ancla=esc["ancla"]))
        print(f"   {nombre:18s} objetivo {esc['alfa']:.4f}  q = {q if q is None else round(q, 4)}  tasa lograda = {logrado if logrado is None else round(logrado, 4)}")
    for nombre in ("patologico_ciego", "patologico_ruido"):
        ESCENARIOS[nombre]["q"] = ESCENARIOS["tipico"]["q"]
    for f in filas_esc:
        if f["escenario"].startswith("patologico"):
            f["q"] = ESCENARIOS["tipico"]["q"]
    pd.DataFrame(filas_esc).to_csv(f"{OUT_DIR}/ficha_escenarios.csv", index=False)

    print("\n4) Generación de flujos (generador A), 50 réplicas por escenario, semillas 20261025+i:")
    semillas = pd.DataFrame([dict(escenario=n, replica=r + 1, semilla=SEED_EVAL0 + r) for n in ESCENARIOS for r in range(N_REPLICAS)])
    semillas.to_csv(f"{OUT_DIR}/semillas.csv", index=False)
    flujos = {f"{n}_r{r + 1:02d}": generador_A(SEED_EVAL0 + r).astype(np.float32) for n in ESCENARIOS for r in range(N_REPLICAS)}
    np.savez_compressed(f"{OUT_DIR}/flujos_eventos.npz", columnas=np.array(COLS), **flujos)
    print(f"   {len(flujos)} flujos de {N_MEDIAS} medias × {len(COLS)} variables guardados en flujos_eventos.npz")

    print("\n5) Bondad de ajuste (solo semillas de calibración):")
    esc = ESCENARIOS["tipico"]
    tA = [simular(generador_A(SEED_CAL0 + r), esc, "asis", esc["q"])["tasa"] for r in range(N_REPLICAS)]
    tB = [simular(generador_B(SEED_CAL0 + r), esc, "asis", esc["q"], p_inicio=0.5)["tasa"] for r in range(N_REPLICAS)]
    eA = [int((generador_A(SEED_CAL0 + r)[:, 0] < TASA_TOTAL_H * CICLO_S / 3600).sum()) for r in range(N_REPLICAS)]
    eB = [int((generador_B(SEED_CAL0 + r)[:, 0] == 0).sum()) for r in range(N_REPLICAS)]
    ks_ab = stats.ks_2samp(tA, tB); ks_ev = stats.ks_2samp(eA, eB); ks_base = stats.ks_2samp(tA, TASAS_MM)
    gof = pd.DataFrame([
        dict(prueba="Tasa AS-IS: generador A vs B", n1=len(tA), n2=len(tB), estadistico=ks_ab.statistic, p_valor=ks_ab.pvalue),
        dict(prueba="Eventos de falla por réplica: A vs B", n1=len(eA), n2=len(eB), estadistico=ks_ev.statistic, p_valor=ks_ev.pvalue),
        dict(prueba="Tasa AS-IS simulada vs tasas máquina-mes de la base (M07–M12)", n1=len(tA), n2=len(TASAS_MM), estadistico=ks_base.statistic, p_valor=ks_base.pvalue),
    ])
    print(gof.round(4).to_string(index=False))
    print("   Advertencia: con n = 50 y 72 la prueba KS tiene poco poder; además, la base de referencia es generada (F4),")
    print("   así que un p > 0,05 solo indica coherencia con el escenario, no con la realidad. Las unidades también difieren")
    print("   (réplica de 1 200 medias frente a máquina-mes), por eso la dispersión no es comparable.")
    gof.to_csv(f"{OUT_DIR}/bondad_ajuste.csv", index=False)

    print("\n6) Reproducción de Carvalho et al. (2026), Tabla 3 (criterio del plan: ±10 %):")
    rep, fa = reproducir_carvalho()
    print(rep.to_string(index=False))
    print(f"   Cumple ±10 % en {int(rep.cumple_10pct.sum())} de {len(rep)} valores comparados.")
    print("   Falsas alarmas por turno de 8 h (publicado: 0,26–0,28):"); print(fa.to_string(index=False))
    print("   Con FPR = 0,1 % (especificidad 0,999 redondeada) no se reproducen; con 0,058 % sí: la especificidad publicada está redondeada.")
    rep.to_csv(f"{OUT_DIR}/carvalho_reproduccion.csv", index=False); fa.to_csv(f"{OUT_DIR}/carvalho_falsas_alarmas.csv", index=False)

    print("\n7) Porcentaje real y sintético:")
    origen = ANCLAS["Tipo de origen"].value_counts()
    print("   Eventos generados: 100 % sintéticos (no hay registros reales en este paso).")
    print("   Origen de las anclas:"); print(origen.to_string())
    print("   El AS-IS real de la semana 12 se incorporará en V7a; aquí ningún dato es medición real.")
    with open(f"{OUT_DIR}/version.json", "w", encoding="utf-8") as fh:
        json.dump(dict(script="v4_escenarios_dicapri.py", artefacto="V20.4 commit cddd62e", base=os.path.basename(BASE_XLSX),
                       python=platform.python_version(), numpy=np.__version__, pandas=pd.__version__,
                       semillas_evaluacion=f"{SEED_EVAL0}+i (i=0..{N_REPLICAS-1})", semillas_calibracion=f"{SEED_CAL0}+i"), fh, ensure_ascii=False, indent=2)

    print("\n8) Casos de equivalencia con el prototipo:")
    os.makedirs(f"{OUT_DIR}/equivalencia", exist_ok=True)
    ce = casos_equivalencia(); ce.to_csv(f"{OUT_DIR}/equivalencia/casos_equivalencia.csv", index=False, sep=";")
    se = secuencias_esperadas(); se.to_csv(f"{OUT_DIR}/equivalencia/secuencias_esperadas.csv", index=False, sep=";")
    REGLAS_CODIGO.to_csv(f"{OUT_DIR}/equivalencia/reglas_y_codigo.csv", index=False, sep=";")
    print(ce.to_string(index=False))
    print(se.groupby("secuencia")["accion_esperada"].apply(lambda x: " → ".join(x)).to_string())
    print(f"\nArchivos guardados en {OUT_DIR}")