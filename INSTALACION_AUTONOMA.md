# Prototipo digital Dicapri — integración autónoma

Esta versión integra la interfaz Vite con:

- YOLOv8n V2 como línea base visual preliminar.
- Random Forest para riesgo mensual.
- AMEF para criticidad y acción recomendada.
- Cola automática de fotografías de demostración, reales y sintéticas de apoyo.
- Registro local del historial de inferencias.

## 1. Instalación inicial

Desde PowerShell, dentro de esta carpeta:

```powershell
py -3.11 -m venv .venv
& ".\.venv\Scripts\python.exe" -m pip install -r ".\backend\requirements.txt"
npm install
```

Como alternativa, en Windows puedes ejecutar `instalar.bat` con doble clic.

## 2. Ejecución

Abre dos ventanas de PowerShell.

Ventana 1:

```powershell
& ".\iniciar_backend.ps1"
```

Ventana 2:

```powershell
& ".\iniciar_interfaz.ps1"
```

También puedes abrir `iniciar_backend.bat` y `iniciar_interfaz.bat`; esta opción
evita los bloqueos habituales de la política de ejecución de PowerShell.

Abre `http://127.0.0.1:5173`.

## 3. Ciclo autónomo

1. Espera el estado `YOLOv8n conectado`.
2. Selecciona una máquina.
3. Cambia el modo de operación a `Autónomo`.
4. Mantén activada la inspección YOLO automática.
5. Pulsa `Iniciar ciclo autónomo`.

En **Intervención del operario** puedes escoger:

- **Manual:** la máquina permanece bloqueada hasta pulsar `Confirmar intervención y validar`.
- **Simulada automáticamente:** la interfaz representa la corrección del operario
  durante un periodo aleatorio de 5 a 10 segundos, confirma la intervención y
  comienza automáticamente la validación de dos medias consecutivas con YOLO.

Durante ese intervalo, el banco experimental presenta un operario 3D que se
aproxima a la máquina, actúa sobre la zona de trabajo y se retira antes de la
reanudación. El texto del visor identifica la labor simulada según la anomalía:
cambio de aguja, reenhebrado, retiro del atasco, ajuste del elástico, limpieza o
regulación de tensión.

La trayectoria del operario incluye desplazamiento diagonal desde el pasillo,
giro hacia la máquina, aproximación frontal a una posición distinta según la
falla, inclinación corporal durante la intervención y retirada al finalizar.

La intervención automática es una simulación de la actuación humana; no implica
que la máquina física pueda repararse por sí sola. En una implementación real,
la confirmación procedería de una HMI, un pulsador o una señal del PLC.

En una rotura de aguja, la media termina y pasa primero por YOLO. Después, la
máquina queda bloqueada y solicita el cambio de aguja incluso si el modelo visual
no reconoce D01, porque la condición mecánica confirmada no puede darse por
resuelta mediante una ausencia de detección visual.

La cola causal se carga desde `backend/causal_demo_images`; no es necesario
seleccionar fotografías manualmente. Las muestras están organizadas como
`CONFORME`, `D01`, `D03`, `D04`, `D06` y `D09`, de modo que la prenda enviada a
YOLO corresponda con el escenario ocurrido en la máquina.

En **Frecuencia de anomalías** puedes utilizar:

- **Realista (4.12 %):** operación normal predominante.
- **Demostración (15 %):** permite exhibir el flujo sin esperar demasiado.
- **Prueba intensiva (40 %):** facilita comprobar decisiones y paradas.

La interfaz muestra por separado el defecto esperado por el proceso y la
detección real de YOLO. Si no coinciden, se registra una omisión preliminar; la
aplicación no sustituye la inferencia por un resultado simulado.

## 4. Direcciones útiles

- Interfaz: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8000/health`
- Documentación: `http://127.0.0.1:8000/docs`
- Historial de inferencias: `backend/data/inspection_history.jsonl`

Para acceder desde otro equipo de la misma red usa la IPv4 del equipo servidor,
por ejemplo `http://192.168.1.20:5173`, y permite los puertos 5173 y 8000 en el
Firewall de Windows.
