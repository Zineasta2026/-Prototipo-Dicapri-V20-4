"""V5 · E3 disconfirmación: barrido unifactorial de los supuestos sin fuente (eficacia del operario, del jefe
de planta y factor de vigilancia por riesgo RF alto). Detector de referencia fijado antes de ejecutar:
TPR 0,80 y FPR 0,005 (máximo FPR que cumple el criterio terciario en V5). Flujos sellados de V4."""
import os, io, contextlib, importlib.util, numpy as np, pandas as pd
AQUI = os.path.dirname(os.path.abspath(__file__)); OUT = os.environ.get("OUT_DIR", os.path.join(AQUI, "salida_v5"))
V4_PATH = os.environ.get("V4_SCRIPT", os.path.join(AQUI, "v4_escenarios_dicapri.py"))
V4_SALIDA = os.environ.get("V4_SALIDA", os.path.join(AQUI, "salida"))
spec = importlib.util.spec_from_file_location("v4", V4_PATH); v4 = importlib.util.module_from_spec(spec)
with contextlib.redirect_stdout(io.StringIO()): spec.loader.exec_module(v4)
ficha = pd.read_csv(os.path.join(V4_SALIDA, "ficha_escenarios.csv")).set_index("escenario")
npz = np.load(os.path.join(V4_SALIDA, "flujos_eventos.npz"))
TPR, FPR = 0.80, 0.005
BARRIDO = {"ef_op": [0.30, 0.45, 0.55, 0.70, 0.85], "ef_jefe": [0.60, 0.83, 0.95], "k_rf": [0.50, 0.75, 1.00]}
POL = ["asis", "carvalho", "solo_yolo", "integrada"]
filas = []
for escn in ["tipico", "extremo"]:
    q = float(ficha.loc[escn, "q"])
    for par, valores in BARRIDO.items():
        for val in valores:
            esc = dict(v4.ESCENARIOS[escn], tpr=TPR, fpr=FPR); esc[par] = val
            for r in range(v4.N_REPLICAS):
                U = npz[f"{escn}_r{r + 1:02d}"].astype(np.float64); maq = v4.maquina_de_replica(r)
                for pol in POL:
                    o = v4.simular(U, esc, pol, q, maquina=maq)
                    filas.append(dict(escenario=escn, parametro=par, valor=val, replica=r + 1, politica=pol,
                                      tasa_pct=100 * o["tasa"], falsas_por_turno=o["falsas_por_turno"], parada_min=o["parada_min"]))
b = pd.DataFrame(filas); b.to_csv(os.path.join(OUT, "sensibilidad_supuestos_bruto.csv"), index=False)
res = []
for (escn, par, val), g in b.groupby(["escenario", "parametro", "valor"]):
    w = g.pivot(index="replica", columns="politica", values="tasa_pct")
    fila = dict(escenario=escn, parametro=par, valor=val, **{f"tasa_{p}": w[p].mean() for p in POL})
    for ref in ["asis", "carvalho"]:
        d = (w["integrada"] - w[ref]).values; m, se = d.mean(), d.std(ddof=1) / np.sqrt(len(d))
        fila[f"dif_vs_{ref}"] = m; fila[f"ic95_vs_{ref}"] = f"[{m - 2.0096 * se:.3f}; {m + 2.0096 * se:.3f}]"
    fila["mejor_politica"] = min(POL, key=lambda p: w[p].mean())
    res.append(fila)
res = pd.DataFrame(res); res.to_csv(os.path.join(OUT, "sensibilidad_supuestos.csv"), index=False)
pd.set_option("display.width", 250); print(res.round(3).to_string(index=False))