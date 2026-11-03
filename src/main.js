import { runExperiment, DEFAULT_PARAMS, calibrateIncidentRate, sensitivitySweep } from './validation-engine.js'
import './style.css'
import Chart from 'chart.js/auto'
import { initMachine3D } from './machine3d.js'
import { WINDOW_SIZE, recurrenceSummary, recommendedMaintenance } from './recurrence.js'

const THEME_STORAGE_KEY = 'dicapri-ui-theme-v1'
const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
const initialTheme = storedTheme === 'dark' || storedTheme === 'light'
  ? storedTheme
  : window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

document.documentElement.dataset.theme = initialTheme

document.querySelector('#app').innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">TEXTILES DICAPRI E.I.R.L.</p>
        <h1>Prototipo digital de supervisión y control</h1>
        <p class="subtitle">
          Simulación del proceso de alimentación y tensión del hilo
        </p>
      </div>

      <div class="topbar-actions">
        <button
          class="theme-toggle"
          id="themeToggle"
          type="button"
          aria-label="Activar modo oscuro"
          aria-pressed="false"
        >
          <span class="theme-toggle-icon" id="themeToggleIcon" aria-hidden="true">☾</span>
          <span id="themeToggleText">Modo oscuro</span>
        </button>

        <div class="system-status normal" id="systemStatus">
          <span class="status-light"></span>
          <div>
            <small>ESTADO GENERAL</small>
            <strong id="systemStatusText">Sistema preparado</strong>
          </div>
        </div>
      </div>
    </header>

        <section class="data-context-panel panel">
      <div class="data-context-header">
        <div class="panel-heading">
          <span>00</span>
          <div>
            <h2>Contexto operativo Dicapri</h2>
            <p>Parámetros cargados desde la base reconstruida de 2025</p>
          </div>
        </div>

        <div class="data-origin-badge" id="dataOriginBadge">
          Cargando datos...
        </div>
      </div>

      <div class="data-context-grid">
        <div class="machine-selector-card">
          <label class="field-label" for="machineSelect">
            Máquina analizada
          </label>

          <select id="machineSelect">
            <option value="">Cargando máquinas...</option>
          </select>

          <div class="machine-description">
            <div>
              <small>MODELO</small>
              <strong id="machineModel">—</strong>
            </div>

            <div>
              <small>PRODUCTO HABITUAL</small>
              <strong id="machineProduct">—</strong>
            </div>

            <div>
              <small>ESTADO</small>
              <strong id="machineOperationalStatus">—</strong>
            </div>
          </div>
        </div>

        <div class="historical-kpi-card">
          <small>PRODUCCIÓN ANUAL</small>
          <strong id="machineProduction">—</strong>
          <p>Piezas reconstruidas</p>
        </div>

        <div class="historical-kpi-card critical">
          <small>PORCENTAJE DE DEFECTOS</small>
          <strong id="machineDefectRate">—</strong>
          <p>Línea base de la máquina</p>
        </div>

        <div class="historical-kpi-card">
          <small>EVENTOS DE FALLA</small>
          <strong id="machineFailureEvents">—</strong>
          <p>Eventos reconstruidos</p>
        </div>

        <div class="historical-kpi-card">
          <small>DISPONIBILIDAD</small>
          <strong id="machineAvailability">—</strong>
          <p>Indicador anual</p>
        </div>

        <div class="historical-kpi-card">
          <small>MTBF</small>
          <strong id="machineMtbf">—</strong>
          <p>Horas por evento</p>
        </div>
      </div>

      <div class="baseline-strip">
        <div>
          <small>LÍNEA BASE GLOBAL</small>
          <strong>
            <span id="globalDefectRate">—</span> defectuosas
          </strong>
        </div>

        <div>
          <small>OEE RECONSTRUIDO</small>
          <strong id="globalOee">—</strong>
        </div>

        <div>
          <small>DEFECTO PRIORITARIO</small>
          <strong id="priorityDefect">—</strong>
        </div>

        <div>
          <small>PARTICIPACIÓN</small>
          <strong id="priorityDefectShare">—</strong>
        </div>
      </div>

      <p class="synthetic-warning">
        Línea base reconstruida y sintética. Se utiliza para calibrar y
        demostrar el prototipo digital; no representa registros históricos
        reales ni resultados industriales alcanzados.
      </p>
    </section>
    <main class="dashboard">
      <aside class="control-panel panel">
        <div class="panel-heading">
          <span>01</span>
          <div>
            <h2>Control de simulación</h2>
            <p>Selecciona una condición operativa</p>
          </div>
        </div>

        <div class="main-controls">
          <button class="button primary" id="startButton">
            Iniciar operación
          </button>

          <button class="button secondary" id="pauseButton">
            Pausar
          </button>

          <button class="button outline" id="resetButton">
            Restablecer
          </button>
        </div>

        <div class="autonomous-control-card">
          <label class="field-label" for="operationMode">Modo de operación</label>
          <select id="operationMode">
            <option value="manual">Manual</option>
            <option value="autonomous">Autónomo</option>
          </select>
          <div class="autonomous-options" id="autonomousOptions">
            <label class="field-label" for="autonomousInterval">Intervalo entre ciclos</label>
            <select id="autonomousInterval">
              <option value="8">8 s — criticidad acelerada</option>
              <option value="15">15 s — demostración</option>
              <option value="25" selected>25 s — recomendado</option>
              <option value="40">40 s — pausado</option>
            </select>
            <label class="field-label" for="anomalyFrequency">Frecuencia de anomalías</label>
            <select id="anomalyFrequency">
              <option value="0.0412" selected>Realista — 4.12 %</option>
              <option value="0.15">Demostración — 15 %</option>
              <option value="0.40">Prueba intensiva — 40 %</option>
              <option value="criticality">Criticidad — degradación controlada</option>
            </select>
            <p class="criticality-notice" id="criticalityNotice" hidden>
              Escenario controlado para demostrar degradación y mantenimiento.
            </p>
            <label class="autonomous-check">
              <input type="checkbox" id="autonomousYolo" checked>
              <span>Analizar automáticamente cada media producida</span>
            </label>
            <label class="field-label" for="interventionMode">Intervención del operario</label>
            <select id="interventionMode">
              <option value="manual">Manual — confirmar mediante el botón</option>
              <option value="automatic" selected>Simulada automáticamente — 5 a 10 s</option>
            </select>
            <div class="autonomous-status-row">
              <span id="autonomousState">Detenido</span>
              <strong id="autonomousCycles">0 ciclos</strong>
            </div>
            <div class="maintenance-health-card" id="maintenanceHealthCard">
              <div class="maintenance-health-heading">
                <small>SALUD DE LA MÁQUINA</small>
                <strong id="machineHealthValue">100 %</strong>
              </div>
              <div class="maintenance-health-track"><span id="machineHealthBar"></span></div>
              <div class="maintenance-health-summary">
                <span id="maintenanceStatus">Condición estable</span>
                <small id="maintenanceEventCount">0 severos · 0 críticos</small>
              </div>
              <p id="maintenanceRecommendation">Continuar operación y supervisión rutinaria.</p>
            </div>
            <div class="recurrence-card recurrence-compact" id="recurrenceCard" data-level="insufficient">
              <div class="recurrence-heading"><strong>RECURRENCIA · V18</strong><span id="recurrenceLevel">Sin muestra</span></div>
              <div class="recurrence-numbers"><strong id="recurrenceCount">0 defectos / 0 inspecciones</strong><span id="recurrenceRate">—</span></div>
              <div class="recurrence-track" role="progressbar" aria-label="Inspecciones de la ventana móvil"><span id="recurrenceProgress"></span></div>
              <div class="recurrence-thresholds">24 inspecciones · alerta 3/24 · crítico 6/24</div>
              <div class="recurrence-actions">
                <button type="button" class="button outline" id="recurrenceDemo">Ensayar 8/24</button>
                <button type="button" class="button outline" id="recurrenceClear">Limpiar</button>
              </div>
              <details class="recurrence-more">
                <summary>Ver diagnóstico y detalles</summary>
                <p id="recurrenceDetail">Esperando inspecciones válidas. No se contabilizan ciclos sin YOLO.</p>
                <p id="recurrenceAction">Umbrales experimentales: advertencia ≥3 y parada ≥6 defectos por 24 inspecciones.</p>
                <small>Ensayo sintético separado de las inspecciones YOLO; no representa evidencia industrial.</small>
              </details>
            </div>
          </div>
        </div>



                <div class="lab-v19-config">
          <h3>Escenarios automáticos · V20</h3><p class="lab-v20-hint">Mismo banco 3D y estados de máquina. Ensayo sintético; no altera registros YOLO.</p>
          <label class="field-label" for="labScenario">Escenario productivo</label>
          <select id="labScenario">
            <option value="needles">Desgaste progresivo de agujas</option>
            <option value="tension">Desajuste progresivo de tensión</option>
            <option value="thread">Rotura recurrente de hilo</option>
            <option value="oil">Contaminación por lubricante</option>
            <option value="recurrent" selected>6 a 9 defectos por 24 medias</option>
            <option value="mechanical">Deterioro mecánico / vibración</option>
            <option value="relapse">Reaparición después del mantenimiento</option>
          </select>
          <label class="field-label" for="labEscalation">Resultado de intervención de primer nivel</label>
          <select id="labEscalation">
            <option value="success">Operario resuelve la anomalía</option>
            <option value="failed" selected>Operario no resuelve → jefe de planta</option>
          </select>
          <label class="field-label" for="labMode">Ejecución</label>
          <select id="labMode"><option value="auto" selected>Automática completa</option><option value="guided">Supervisada por etapas</option></select>
          <div class="lab-v19-actions"><button class="button" id="labStart" type="button">Iniciar escenario</button><button class="button outline" id="labNext" type="button" disabled>Siguiente etapa</button><button class="button outline" id="labStop" type="button">Detener</button><button class="button outline" id="labExport" type="button">Exportar CSV</button></div>
          <small class="lab-v19-note">Ensayo didáctico sintético. No modifica las inspecciones YOLO ni controla maquinaria física.</small>
        </div>

        <label class="field-label" for="scenarioSelect">
          Escenario experimental
        </label>

        <select id="scenarioSelect">
  <option value="normal">Operación normal</option>
  <option value="lowTension">F07 — Tensión insuficiente</option>
  <option value="highTension">F07 — Sobretensión</option>
  <option value="brokenThread">F03 — Rotura de hilo</option>
  <option value="jam">F04/F10 — Atascamiento</option>
  <option value="brokenNeedle">F01 — Rotura de aguja</option>
  <option value="elasticTrigger">
    F09 — Falla del disparador elástico
  </option>
  <option value="oilStain">
    F12 — Lubricante sobre la prenda
  </option>
</select>

        <button class="button danger" id="applyScenarioButton">
          Inducir escenario
        </button>
<div class="amef-scenario-card">
  <div class="amef-title">
    <span>AMEF</span>
    <strong id="amefFailureCode">Sin falla</strong>
  </div>

  <div class="amef-data-grid">
    <div>
      <small>MODO DE FALLA</small>
      <strong id="amefFailureMode">Operación normal</strong>
    </div>

    <div>
      <small>DEFECTO POTENCIAL</small>
      <strong id="amefPotentialDefect">Ninguno</strong>
    </div>

    <div>
      <small>NPR</small>
      <strong id="amefNpr">0</strong>
    </div>

    <div>
      <small>DURACIÓN REFERENCIAL</small>
      <strong id="amefDuration">—</strong>
    </div>
  </div>

  <div class="amef-action">
    <small>RESPUESTA PROPUESTA</small>
    <strong id="amefRecommendedAction">
      Mantener supervisión
    </strong>
  </div>
</div>
        <div class="automatic-control">
          <div>
            <strong>Control automático</strong>
            <small>Permite ejecutar acciones correctivas</small>
          </div>

          <label class="switch">
            <input type="checkbox" id="automaticControl" checked>
            <span class="slider"></span>
          </label>
        </div>

        <div class="simulation-time">
          <small>TIEMPO DE OPERACIÓN</small>
          <strong id="simulationTime">00:00</strong>
        </div>
      </aside>

      <section class="process-panel panel">
        <div class="panel-heading">
          <span>02</span>
          <div>
            <h2>Banco experimental virtual</h2>
            <p>Representación funcional del recorrido del hilo</p>
          </div>
        </div>

        <div class="process-stage" id="processStage">
          <div class="machine-label">ALIMENTACIÓN</div>
          <div class="machine-label weaving-label">ZONA DE TEJIDO</div>

          <div class="spool machine-part" id="spool">
            <div class="spool-core"></div>
          </div>

          <div class="thread thread-one"></div>

          <div class="roller machine-part" id="rollerOne">
            <div class="roller-center"></div>
          </div>

          <div class="thread thread-two"></div>

          <div class="tension-sensor machine-part" id="tensionSensor">
            <span>T</span>
            <small>Sensor</small>
          </div>

          <div class="thread thread-three"></div>

          <div class="servo machine-part" id="servo">
            <div class="servo-arm"></div>
            <small>Servotensor</small>
          </div>

          <div class="thread thread-four" id="threadFour"></div>

          <div class="optical-sensor machine-part" id="opticalSensor">
            <span></span>
            <small>Sensor óptico</small>
          </div>

          <div class="thread thread-five" id="threadFive"></div>

          <div class="weaving-unit machine-part" id="weavingUnit">
            <div class="weaving-wheel"></div>
            <small>Módulo representativo</small>
          </div>

          <div class="flow-arrow arrow-one">→</div>
          <div class="flow-arrow arrow-two">→</div>
          <div class="flow-arrow arrow-three">→</div>
        </div>

        <div class="decision-strip">
          <div>
            <small>ANOMALÍA</small>
            <strong id="anomalyText">Ninguna</strong>
          </div>

          <div>
            <small>DIAGNÓSTICO</small>
            <strong id="diagnosisText">Operación sin evaluar</strong>
          </div>

          <div>
            <small>ACCIÓN</small>
            <strong id="actionText">Esperando inicio</strong>
          </div>
        </div>
      </section>

      <aside class="sensor-panel panel">
        <div class="panel-heading">
          <span>03</span>
          <div>
            <h2>Sensores virtuales</h2>
            <p>Lecturas en tiempo real</p>
          </div>
        </div>

        <div class="sensor-grid">
          <article class="sensor-card" id="tensionCard">
            <div class="sensor-icon">T</div>
            <div>
              <small>TENSIÓN</small>
              <strong><span id="tensionValue">42.0</span> cN</strong>
              <p>Rango: 35–50 cN</p>
            </div>
          </article>

          <article class="sensor-card" id="speedCard">
  <div class="sensor-icon">↻</div>

  <div>
    <small>VELOCIDAD DEL CILINDRO</small>

    <strong>
      <span id="speedValue">105</span> RPM
    </strong>

    <p>Encoder del eje · Rango: 90–120 RPM</p>
  </div>
</article>

          <article class="sensor-card" id="vibrationCard">
            <div class="sensor-icon">R</div>
            <div>
              <small>VIBRACIÓN RMS</small>
              <strong><span id="vibrationValue">1.8</span> mm/s</strong>
              <p>Límite: 5 mm/s</p>
            </div>
          </article>

          <article class="sensor-card" id="temperatureCard">
            <div class="sensor-icon">°</div>
            <div>
              <small>TEMPERATURA</small>
              <strong><span id="temperatureValue">38.0</span> °C</strong>
              <p>Límite: 65 °C</p>
            </div>
          </article>

          <article class="sensor-card" id="currentCard">
            <div class="sensor-icon">I</div>
            <div>
              <small>CORRIENTE</small>
              <strong><span id="currentValue">1.1</span> A</strong>
              <p>Límite: 2 A</p>
            </div>
          </article>

          <article class="sensor-card" id="threadCard">
            <div class="sensor-icon">H</div>
            <div>
              <small>PRESENCIA DE HILO</small>
              <strong id="threadValue">Detectado</strong>
              <p>Sensor óptico</p>
            </div>
          </article>
        </div>
      </aside>
    </main>
    <section class="machine-3d-panel panel">
      <div class="machine-3d-heading">
        <div class="panel-heading">
          <span>02B</span>
          <div>
            <h2>Banco experimental tridimensional</h2>
            <p>Gemelo visual referencial de la máquina circular UNIPLET ANGE 12.2</p>
          </div>
        </div>

        <div class="machine-3d-live" id="machine3dLive">
          <span></span>
          <div>
            <small>ESTADO DEL MODELO</small>
            <strong id="machine3dState">Preparado</strong>
          </div>
        </div>
      </div>

      <div class="machine-3d-layout">
        <div class="machine-3d-viewport" id="machine3dCanvas">
          <div class="machine-3d-overlay">
            <span>ARRASTRAR PARA GIRAR</span>
            <span>RUEDA PARA ACERCAR</span>
          </div>
        </div>

        <aside class="machine-3d-legend">
          <div class="machine-3d-model">
            <small>MODELO REPRESENTADO</small>
            <strong>UNIPLET ANGE 12.2</strong>
            <p>Reconstrucción visual referencial basada en fotografías de la máquina real.</p>
          </div>

          <div class="machine-3d-parts">
            <div><span class="part-dot cyan"></span><strong>Cabezal circular</strong></div>
            <div><span class="part-dot amber"></span><strong>Alimentadores de hilo</strong></div>
            <div><span class="part-dot blue"></span><strong>Panel de control</strong></div>
            <div><span class="part-dot green"></span><strong>Sensores virtuales</strong></div>
          </div>

          <div class="machine-3d-reading">
            <small>VELOCIDAD SINCRONIZADA</small>
            <strong><span id="machine3dRpm">105</span> RPM</strong>
          </div>
        </aside>
      </div>
    </section>
    <section class="lab-v20-monitor panel" aria-label="Seguimiento integrado de escenarios"><div class="lab-v20-heading"><h3>Seguimiento de escenarios en el banco 3D</h3><span>SIMULACIÓN SINTÉTICA · V20</span></div>        <div class="lab-v19-monitor" aria-label="Seguimiento del escenario">
          <div class="lab-v19-monitor-title"><h3>Seguimiento de la ejecución</h3><a href="#machine3dCanvas" class="lab-v19-3d-link">Ver banco 3D ↓</a></div>
          <div class="lab-v19-status" role="status"><strong id="labPhase">Listo para iniciar</strong><span id="labActor">Sin intervención</span></div>
          <p id="labNarrative" class="lab-v19-narrative">El escenario no altera el historial de inspecciones YOLO ni los KPI reales del prototipo.</p>
          <div class="lab-v19-kpis"><div><small>Producidas (sim.)</small><strong id="labUnits">0</strong></div><div><small>Defectuosas (sim.)</small><strong id="labDefects">0</strong></div><div><small>Escalamientos</small><strong id="labEscalations">0</strong></div><div><small>Paradas (sim.)</small><strong id="labStops">0</strong></div></div>
          <div class="lab-v19-results" id="labResults">AS-IS / TO-BE: pendientes. Los resultados serán ilustrativos y dependerán de supuestos configurados, no de mediciones industriales.</div>
          <small class="lab-v19-note">El mantenimiento especializado requiere personal autorizado y verificación antes del reinicio.</small>
        </div>
</section>
    <section class="charts-panel panel">
      <div class="panel-heading">
        <span>04</span>
        <div>
          <h2>Comportamiento de las variables</h2>
          <p>Evolución de los sensores durante los últimos 30 segundos</p>
        </div>
      </div>

      <div class="charts-grid">
        <article class="chart-card">
          <div class="chart-header">
            <h3>Condición del hilo</h3>
            <small>Tensión y velocidad</small>
          </div>
          <div class="chart-container">
            <canvas id="threadConditionChart"></canvas>
          </div>
        </article>

        <article class="chart-card">
          <div class="chart-header">
            <h3>Condición mecánica</h3>
            <small>Vibración y corriente</small>
          </div>
          <div class="chart-container">
            <canvas id="mechanicalChart"></canvas>
          </div>
        </article>

        <article class="chart-card">
          <div class="chart-header">
            <h3>Condición térmica</h3>
            <small>Temperatura del sistema</small>
          </div>
          <div class="chart-container">
            <canvas id="temperatureChart"></canvas>
          </div>
        </article>
      </div>
    </section>
    <section class="visual-inspection-panel panel">
      <div class="panel-heading">
        <span>05</span>
        <div>
          <h2>Inspección visual de la media</h2>
          <p>Evaluación asistida desde el elástico hasta antes de la puntera abierta</p>
        </div>
      </div>

      <div class="visual-inspection-grid">
        <div class="visual-viewer">
          <div class="visual-preview" id="visualPreview">
            <div class="visual-placeholder" id="visualPlaceholder">
              <strong>Cargar fotografía de una media</strong>
              <span>Formatos admitidos: JPG, JPEG y PNG</span>
            </div>
            <img id="visualImage" alt="Media seleccionada para inspección">
            <div class="inspection-roi" id="inspectionRoi">
              <span>REGIÓN INSPECCIONABLE</span>
            </div>
            <div class="yolo-detection-layer" id="yoloDetectionLayer"></div>
          </div>

          <p class="visual-scope-note">
            La puntera abierta y los hilos del borde se excluyen porque corresponden
            al estado normal de la prenda antes del remallado.
          </p>
        </div>

        <div class="visual-controls">
          <label class="file-button" for="visualImageInput">
            Seleccionar fotografía(s)
          </label>
          <input id="visualImageInput" type="file" accept="image/jpeg,image/png" multiple>

          <div class="api-status checking" id="yoloApiStatus">
            <span></span>
            <strong>Comprobando conexión con YOLOv8n...</strong>
          </div>

          <label for="visualConfidence">
            Umbral mínimo de confianza:
            <strong><span id="visualConfidenceValue">50</span> %</strong>
          </label>
          <input id="visualConfidence" type="range" min="10" max="90" value="50">

          <button class="button visual-analyze-button" id="visualAnalyzeButton" disabled>
            Analizar con YOLOv8n
          </button>

          <div class="visual-batch-card">
            <div class="visual-batch-heading">
              <div>
                <small>INSPECCIÓN CONSECUTIVA</small>
                <strong id="visualBatchStatus">Lote no seleccionado</strong>
              </div>
              <span id="visualBatchProgress">0 / 0</span>
            </div>

            <label for="visualBatchInterval">Tiempo entre medias</label>
            <select id="visualBatchInterval">
              <option value="2">2 s — demostración rápida</option>
              <option value="5" selected>5 s — recomendado</option>
              <option value="10">10 s — observación detallada</option>
            </select>

            <div class="visual-batch-actions">
              <button class="button" id="visualBatchStart" disabled>Iniciar lote</button>
              <button class="button outline" id="visualBatchStop" disabled>Pausar lote</button>
            </div>

            <div class="visual-batch-counters">
              <span>Conformes <strong id="visualBatchOk">0</strong></span>
              <span>No conformes <strong id="visualBatchNg">0</strong></span>
            </div>
          </div>

          <div class="visual-result" id="visualResult">
            <small>RESULTADO DE INSPECCIÓN</small>
            <strong id="visualResultStatus">Esperando imagen</strong>
            <p id="visualResultDetail">
              Selecciona una fotografía para ejecutar la inferencia local.
            </p>
            <div class="causal-result">
              <span>DEFECTO ESPERADO POR EL PROCESO</span>
              <strong id="expectedDefect">Sin ciclo asociado</strong>
              <small id="causalMatch">Esperando comparación con YOLO</small>
            </div>
          </div>

          <p class="visual-disclaimer">
            Inferencia local con YOLOv8n preliminar. Clases implementadas:
            D01, D03, D04, D06 y D09. La puntera abierta se mantiene excluida.
          </p>
        </div>
      </div>
    </section>

    <section class="risk-panel panel">
      <div class="panel-heading">
        <span>06</span>
        <div>
          <h2>Predicción de riesgo operacional</h2>
          <p>Evaluación histórica mensual mediante Random Forest</p>
        </div>
      </div>

      <div class="risk-grid">
        <article class="risk-summary-card" id="riskSummaryCard">
          <small>RIESGO DEL SIGUIENTE PERIODO</small>
          <strong id="riskLevel">Sin evaluar</strong>
          <p id="riskScope">Selecciona una máquina y ejecuta la predicción.</p>
          <button class="button risk-analyze-button" id="riskAnalyzeButton">
            Evaluar con Random Forest
          </button>
        </article>

        <article class="risk-detail-card">
          <div><span>Modelo</span><strong id="riskModel">Random Forest</strong></div>
          <div><span>Periodo analizado</span><strong id="riskSourceMonth">—</strong></div>
          <div><span>Periodo objetivo</span><strong id="riskTargetMonth">—</strong></div>
          <div><span>Confianza</span><strong id="riskConfidence">—</strong></div>
        </article>

        <article class="risk-probability-card">
          <small>PROBABILIDAD POR NIVEL</small>
          <div class="risk-probability-row">
            <span>Bajo</span><progress id="riskProbLow" max="100" value="0"></progress><strong id="riskProbLowValue">0 %</strong>
          </div>
          <div class="risk-probability-row">
            <span>Medio</span><progress id="riskProbMedium" max="100" value="0"></progress><strong id="riskProbMediumValue">0 %</strong>
          </div>
          <div class="risk-probability-row">
            <span>Alto</span><progress id="riskProbHigh" max="100" value="0"></progress><strong id="riskProbHighValue">0 %</strong>
          </div>
        </article>

        <article class="risk-action-card">
          <small>INTERPRETACIÓN OPERATIVA</small>
          <strong id="riskFailure">Sin diagnóstico</strong>
          <p id="riskAction">La recomendación aparecerá después de la evaluación.</p>
          <span id="riskNotice">Base reconstruida/sintética 2025.</span>
        </article>
      </div>

      <div class="model-validation-summary">
        <div>
          <small>MODELO PREDICTIVO ACTIVO</small>
          <strong id="selectedModelName">Cargando comparación...</strong>
          <span>Selección sustentada mediante comparación equivalente con XGBoost.</span>
        </div>
        <button class="button outline" id="openModelComparisonButton">
          Ver validación de modelos
        </button>
      </div>

      <dialog class="model-comparison-dialog" id="modelComparisonDialog">
        <div class="model-dialog-header">
          <div>
            <small>VALIDACIÓN DEL MODELO PREDICTIVO</small>
            <h3>Random Forest vs. XGBoost</h3>
            <span id="modelComparisonScope">Base reconstruida/sintética 2025</span>
          </div>
          <button class="model-dialog-close" id="closeModelComparisonButton" aria-label="Cerrar comparación">×</button>
        </div>
        <div class="model-comparison-grid">
          <article>
            <small>RANDOM FOREST · PRUEBA FINAL</small>
            <strong id="rfTestF1">—</strong>
            <p id="rfTestMetrics">Accuracy — · Precision — · Recall —</p>
          </article>
          <article>
            <small>XGBOOST · PRUEBA FINAL</small>
            <strong id="xgbTestF1">—</strong>
            <p id="xgbTestMetrics">Accuracy — · Precision — · Recall —</p>
          </article>
          <article>
            <small>VALIDACIÓN TEMPORAL</small>
            <strong id="temporalComparison">—</strong>
            <p>F1 macro promedio mediante ventanas temporales expansivas.</p>
          </article>
          <article class="model-selection-reason">
            <small>JUSTIFICACIÓN</small>
            <strong id="modelSelectionReason">Esperando resultados</strong>
            <p>El modelo de la interfaz se conserva únicamente si supera la comparación equivalente.</p>
          </article>
        </div>
        <p class="model-dialog-note">
          Comparación preliminar con partición temporal. Estos resultados justifican la selección técnica dentro del prototipo, pero no constituyen validación industrial real.
        </p>
        <div class="model-dialog-actions">
          <button class="button" id="closeModelComparisonFooterButton">Cerrar</button>
        </div>
      </dialog>
    </section>

    <section class="decision-panel panel">
      <div class="panel-heading">
        <span>07</span>
        <div>
          <h2>Módulo inteligente de decisión</h2>
          <p>Integración de YOLOv8n, Random Forest y criticidad AMEF</p>
        </div>
      </div>

      <div class="decision-grid">
        <article class="decision-evidence-card">
          <small>EVIDENCIA DE VISIÓN</small>
          <strong id="decisionVisualEvidence">Pendiente</strong>
          <p id="decisionVisualDetail">Analiza primero una fotografía con YOLOv8n.</p>
        </article>

        <article class="decision-evidence-card">
          <small>EVIDENCIA HISTÓRICA</small>
          <strong id="decisionRiskEvidence">Pendiente</strong>
          <p id="decisionRiskDetail">Evalúa primero la máquina con Random Forest.</p>
        </article>

        <article class="decision-evidence-card">
          <small>CRITICIDAD AMEF</small>
          <strong id="decisionAmefEvidence">Pendiente</strong>
          <p id="decisionAmefDetail">Se calculará con las fallas asociadas.</p>
        </article>

        <article class="decision-output-card" id="decisionOutputCard">
          <small>DECISIÓN INTEGRADA</small>
          <strong id="integratedDecisionStatus">Esperando evidencias</strong>
          <p id="integratedDecisionAction">
            Ejecuta la inspección visual y la predicción histórica.
          </p>
          <span id="integratedDecisionReason">
            El sistema requiere ambos resultados antes de decidir.
          </span>
          <button class="button" id="registerDecisionButton" disabled>
            Registrar decisión conjunta
          </button>
        </article>
      </div>

      <div class="hybrid-cycle-card" id="hybridCycleCard">
        <div class="hybrid-cycle-header">
          <div>
            <small>CICLO AUTOMÁTICO HÍBRIDO</small>
            <strong id="hybridCycleStatus">En espera</strong>
            <p id="hybridCycleDetail">Inicia el modo autónomo para coordinar sensores, ML, YOLO y AMEF.</p>
          </div>
          <span class="hybrid-lock-badge" id="hybridLockBadge">MÁQUINA LIBERADA</span>
        </div>

        <div class="hybrid-timeline">
          <div class="hybrid-step" data-hybrid-step="weaving"><span>1</span><strong>Tejido</strong></div>
          <div class="hybrid-step" data-hybrid-step="risk"><span>2</span><strong>Riesgo ML</strong></div>
          <div class="hybrid-step" data-hybrid-step="yolo"><span>3</span><strong>YOLO</strong></div>
          <div class="hybrid-step" data-hybrid-step="decision"><span>4</span><strong>Decisión AMEF</strong></div>
          <div class="hybrid-step" data-hybrid-step="action"><span>5</span><strong>Acción</strong></div>
        </div>

        <div class="hybrid-cycle-footer">
          <div>
            <small>VALIDACIÓN POSTERIOR</small>
            <strong id="hybridValidationStatus">No requerida</strong>
          </div>
          <div>
            <small>DEFECTOS CONSECUTIVOS</small>
            <strong id="hybridConsecutiveDefects">0</strong>
          </div>
          <div>
            <small>INTERVENCIÓN</small>
            <strong id="interventionStatus">No requerida</strong>
          </div>
          <button class="button" id="confirmInterventionButton" disabled>
            Confirmar intervención y validar
          </button>
        </div>
      </div>
    </section>

        <section class="metrics-panel panel">
      <div class="panel-heading">
        <span>08</span>
        <div>
          <h2>Resultados experimentales</h2>
          <p>Indicadores calculados durante la simulación</p>
        </div>
      </div>

      <div class="metrics-grid">
        <article class="metric-card">
          <small>ANOMALÍAS DETECTADAS</small>
          <strong id="totalAnomalies">0</strong>
          <p>Eventos diferentes de operación normal</p>
        </article>

        <article class="metric-card success">
          <small>EVENTOS CONTROLADOS</small>
          <strong id="controlledEvents">0</strong>
          <p>Recuperaciones verificadas</p>
        </article>

        <article class="metric-card critical">
          <small>PARADAS CRÍTICAS</small>
          <strong id="criticalStops">0</strong>
          <p>Roturas y atascamientos</p>
        </article>

        <article class="metric-card">
          <small>PORCENTAJE DE RECUPERACIÓN</small>
          <strong><span id="recoveryPercentage">0.0</span> %</strong>
          <p>Eventos controlados sobre recuperables</p>
        </article>

        <article class="metric-card">
          <small>TIEMPO MEDIO DE DIAGNÓSTICO</small>
          <strong><span id="averageResponseTime">0.0</span> s</strong>
          <p>Desde inducción hasta diagnóstico</p>
        </article>

        <article class="metric-card">
          <small>TIEMPO MEDIO DE RECUPERACIÓN</small>
          <strong><span id="averageRecoveryTime">0.0</span> s</strong>
          <p>Desde anomalía hasta normalización</p>
        </article>
      </div>

      <div class="metrics-actions">
        <p>
          Los resultados corresponden a escenarios simulados del prototipo digital.
        </p>

        <button class="button export-button" id="exportButton">
          Exportar registros CSV
        </button>

        <button class="button export-button" id="exportTraceButton">
          Exportar trazabilidad por ciclo
        </button>

        <button class="button" id="clearHistoryButton">
          Limpiar historial
        </button>
      </div>
    </section>
    <section class="event-panel panel">
      <div class="panel-heading">
        <span>09</span>
        <div>
          <h2>Registro de eventos</h2>
          <p>Historial de detecciones y actuaciones</p>
        </div>
      </div>

      <div class="event-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha / tiempo</th>
              <th>Máquina</th>
              <th>Escenario</th>
              <th>AMEF / NPR</th>
              <th>Defecto / confianza</th>
              <th>Diagnóstico</th>
              <th>Acción</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody id="eventTable">
            <tr class="empty-row">
              <td colspan="8">Todavía no se han registrado eventos.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="traceability-panel panel">
      <div class="panel-heading">
        <span>10</span>
        <div>
          <h2>Trazabilidad integral por ciclo</h2>
          <p>Expediente de cada media: sensores, ML, YOLO, AMEF, intervención y decisión final</p>
        </div>
      </div>

      <div class="traceability-summary">
        <article>
          <small>CICLOS REGISTRADOS</small>
          <strong id="traceCycleCount">0</strong>
        </article>
        <article>
          <small>MEDIAS CONFORMES</small>
          <strong id="traceOkCount">0</strong>
        </article>
        <article>
          <small>MEDIAS NO CONFORMES</small>
          <strong id="traceNgCount">0</strong>
        </article>
        <article>
          <small>INTERVENCIONES</small>
          <strong id="traceInterventionCount">0</strong>
        </article>
      </div>

      <div class="event-table-wrapper traceability-table-wrapper">
        <table class="traceability-table">
          <thead>
            <tr>
              <th>ID / periodo</th>
              <th>Máquina / escenario</th>
              <th>Sensores</th>
              <th>Random Forest</th>
              <th>YOLO</th>
              <th>AMEF</th>
              <th>Decisión e intervención</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody id="traceabilityTable">
            <tr class="empty-trace-row">
              <td colspan="8">Inicia el modo autónomo para registrar el primer ciclo trazable.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="traceability-note">
        Cada fila representa una media o ciclo productivo completo. El registro se conserva localmente en este navegador.
      </p>
    </section>

    <section class="impact-panel panel">
      <div class="panel-heading impact-heading">
        <span>11</span>
        <div>
          <h2>Comparación de indicadores</h2>
          <p>Línea base reconstruida 2025 frente a resultados de la corrida simulada</p>
        </div>
        <strong class="impact-validation-badge" id="impactValidationBadge">SIN CICLOS INSPECCIONADOS</strong>
      </div>

      <div class="impact-grid">
        <article class="impact-card">
          <small>TASA DE DEFECTOS</small>
          <div class="impact-values">
            <div><span>Antes</span><strong id="impactDefectBefore">—</strong></div>
            <div><span>Prototipo</span><strong id="impactDefectAfter">—</strong></div>
          </div>
          <p id="impactDefectDelta">Esperando ciclos con inspección YOLO.</p>
        </article>

        <article class="impact-card">
          <small>FPY — CALIDAD A LA PRIMERA</small>
          <div class="impact-values">
            <div><span>Antes</span><strong id="impactFpyBefore">—</strong></div>
            <div><span>Prototipo</span><strong id="impactFpyAfter">—</strong></div>
          </div>
          <p id="impactFpyDelta">Calculado con medias conformes en la primera inspección.</p>
        </article>

        <article class="impact-card">
          <small>OEE RECONSTRUIDO / SIMULADO</small>
          <div class="impact-values">
            <div><span>Antes</span><strong id="impactOeeBefore">—</strong></div>
            <div><span>Prototipo</span><strong id="impactOeeAfter">—</strong></div>
          </div>
          <p id="impactOeeDelta">Disponibilidad simulada × rendimiento base × calidad de la corrida.</p>
        </article>

        <article class="impact-card">
          <small>PARADAS POR 100 CICLOS</small>
          <div class="impact-values">
            <div><span>Antes</span><strong id="impactStopsBefore">—</strong></div>
            <div><span>Prototipo</span><strong id="impactStopsAfter">—</strong></div>
          </div>
          <p id="impactStopsDelta">La línea base usa eventos por 100 piezas como referencia.</p>
        </article>

        <article class="impact-card">
          <small>RESPUESTA A LA ANOMALÍA</small>
          <div class="impact-values">
            <div><span>Antes</span><strong id="impactResponseBefore">N/D</strong></div>
            <div><span>Prototipo</span><strong id="impactResponseAfter">—</strong></div>
          </div>
          <p>El valor histórico no está disponible; se reporta el tiempo simulado.</p>
        </article>

        <article class="impact-card">
          <small>RECUPERACIÓN DE LA MÁQUINA</small>
          <div class="impact-values">
            <div><span>Antes</span><strong id="impactRecoveryBefore">N/D</strong></div>
            <div><span>Prototipo</span><strong id="impactRecoveryAfter">—</strong></div>
          </div>
          <p>Se actualiza con intervenciones terminadas.</p>
        </article>

        <article class="impact-card impact-card-highlight">
          <small>NO CONFORMES SEGREGADAS</small>
          <strong class="impact-main-value" id="impactSegregated">0</strong>
          <p>Prendas detectadas antes de continuar al siguiente proceso.</p>
        </article>

        <article class="impact-card impact-card-highlight">
          <small>COINCIDENCIA ANOMALÍA–DEFECTO</small>
          <strong class="impact-main-value" id="impactCausalMatch">—</strong>
          <p>Porcentaje de inspecciones coherentes con el defecto esperado.</p>
        </article>
      </div>

      <div class="impact-footer">
        <p id="impactMethodNote">
          Resultados preliminares de simulación. No constituyen evidencia de mejora industrial hasta validarlos con una muestra suficiente y datos reales.
        </p>
        <button class="button export-button" id="exportImpactButton">Exportar comparación CSV</button>
      </div>
    </section>
  </div>
`

let running = false
let seconds = 0
let timer = null
let currentScenario = 'normal'
let correctionTimers = []
let correctionInProgress = false
let autonomousTimer = null
let autonomousCycleInProgress = false
let autonomousCycleCount = 0
let hybridMachineLocked = false
let hybridPhase = 'idle'
let hybridConsecutiveDefects = 0
let hybridValidationRemaining = 0
let automaticImageIndex = 0
let machineHealth = 100
let severeMaintenanceEvents = 0
let criticalMaintenanceEvents = 0
let recentMaintenanceEvents = []
let criticalitySequenceIndex = 0
let maintenanceRequired = false
let recurrenceWindow = []
let recurrenceMaintenance = null
let recurrenceInterventions = []
const criticalitySequence = [
  'normal', 'normal', 'brokenThread', 'normal', 'jam', 'normal',
  'brokenNeedle', 'normal', 'elasticTrigger', 'normal', 'jam', 'brokenNeedle'
]
const maintenanceSeverityPoints = {
  normal: 0, lowTension: 2, highTension: 3, oilStain: 3,
  brokenThread: 6, elasticTrigger: 6, jam: 8, brokenNeedle: 10
}
let hybridStopReason = ''
let simulatedInterventionTimer = null
let simulatedInterventionRemaining = 0

function scheduleCorrection(callback, delay) {
  const timerId = setTimeout(callback, delay)
  correctionTimers.push(timerId)
}

function cancelScheduledCorrections() {
  correctionTimers.forEach(timerId => clearTimeout(timerId))
  correctionTimers = []
  correctionInProgress = false
}

const values = {
  tension: 42,
  speed: 105,
  vibration: 1.8,
  temperature: 38,
  current: 1.1,
  threadPresent: true
}
const metrics = {
  totalAnomalies: 0,
  recoverableEvents: 0,
  controlledEvents: 0,
  criticalStops: 0,
  responseTimes: [],
  recoveryTimes: []
}

const EVENT_STORAGE_KEY = 'dicapri-event-records-v1'
const TRACE_STORAGE_KEY = 'dicapri-cycle-trace-v1'

let eventRecords = loadStoredEvents()
let cycleTraceRecords = loadStoredCycleTraces()
let activeCycleTrace = null
let interventionCycleId = null
let interventionStartedAt = null

function loadStoredCycleTraces() {
  try {
    const storedTraces = JSON.parse(
      localStorage.getItem(TRACE_STORAGE_KEY) || '[]'
    )
    return Array.isArray(storedTraces) ? storedTraces : []
  } catch (error) {
    console.warn('No se pudo recuperar la trazabilidad:', error)
    return []
  }
}

function saveCycleTraces() {
  localStorage.setItem(TRACE_STORAGE_KEY, JSON.stringify(cycleTraceRecords))
}

function loadStoredEvents() {
  try {
    const storedEvents = JSON.parse(
      localStorage.getItem(EVENT_STORAGE_KEY) || '[]'
    )

    return Array.isArray(storedEvents) ? storedEvents : []
  } catch (error) {
    console.warn('No se pudo recuperar el historial:', error)
    return []
  }
}

function saveEventRecords() {
  localStorage.setItem(
    EVENT_STORAGE_KEY,
    JSON.stringify(eventRecords)
  )
}

function calculateAverage(numbers) {
  if (numbers.length === 0) return 0

  const total = numbers.reduce((sum, value) => sum + value, 0)
  return total / numbers.length
}

function updateMetrics() {
  const recoveryPercentage =
    metrics.recoverableEvents === 0
      ? 0
      : (metrics.controlledEvents / metrics.recoverableEvents) * 100

  elements.totalAnomalies.textContent = metrics.totalAnomalies
  elements.controlledEvents.textContent = metrics.controlledEvents
  elements.criticalStops.textContent = metrics.criticalStops

  elements.recoveryPercentage.textContent =
    recoveryPercentage.toFixed(1)

  elements.averageResponseTime.textContent =
    calculateAverage(metrics.responseTimes).toFixed(1)

  elements.averageRecoveryTime.textContent =
    calculateAverage(metrics.recoveryTimes).toFixed(1)

  renderImpactComparison()
}
const elements = {
  themeToggle: document.querySelector('#themeToggle'),
  themeToggleIcon: document.querySelector('#themeToggleIcon'),
  themeToggleText: document.querySelector('#themeToggleText'),
  startButton: document.querySelector('#startButton'),
  pauseButton: document.querySelector('#pauseButton'),
  resetButton: document.querySelector('#resetButton'),
  applyScenarioButton: document.querySelector('#applyScenarioButton'),
  scenarioSelect: document.querySelector('#scenarioSelect'),
  automaticControl: document.querySelector('#automaticControl'),
  operationMode: document.querySelector('#operationMode'),
  autonomousOptions: document.querySelector('#autonomousOptions'),
  autonomousInterval: document.querySelector('#autonomousInterval'),
  anomalyFrequency: document.querySelector('#anomalyFrequency'),
  criticalityNotice: document.querySelector('#criticalityNotice'),
  maintenanceHealthCard: document.querySelector('#maintenanceHealthCard'),
  machineHealthValue: document.querySelector('#machineHealthValue'),
  machineHealthBar: document.querySelector('#machineHealthBar'),
  maintenanceStatus: document.querySelector('#maintenanceStatus'),
  maintenanceEventCount: document.querySelector('#maintenanceEventCount'),
  maintenanceRecommendation: document.querySelector('#maintenanceRecommendation'),
  recurrenceCard: document.querySelector('#recurrenceCard'),
  recurrenceLevel: document.querySelector('#recurrenceLevel'),
  recurrenceCount: document.querySelector('#recurrenceCount'),
  recurrenceRate: document.querySelector('#recurrenceRate'),
  recurrenceProgress: document.querySelector('#recurrenceProgress'),
  recurrenceDetail: document.querySelector('#recurrenceDetail'),
  recurrenceAction: document.querySelector('#recurrenceAction'),
  recurrenceDemo: document.querySelector('#recurrenceDemo'),
  recurrenceClear: document.querySelector('#recurrenceClear'),
  autonomousYolo: document.querySelector('#autonomousYolo'),
  interventionMode: document.querySelector('#interventionMode'),
  autonomousState: document.querySelector('#autonomousState'),
  autonomousCycles: document.querySelector('#autonomousCycles'),
  simulationTime: document.querySelector('#simulationTime'),
  systemStatus: document.querySelector('#systemStatus'),
  systemStatusText: document.querySelector('#systemStatusText'),
  anomalyText: document.querySelector('#anomalyText'),
  diagnosisText: document.querySelector('#diagnosisText'),
  actionText: document.querySelector('#actionText'),
  eventTable: document.querySelector('#eventTable'),
  spool: document.querySelector('#spool'),
  weavingUnit: document.querySelector('#weavingUnit'),
  servo: document.querySelector('#servo'),
  threadFour: document.querySelector('#threadFour'),
  threadFive: document.querySelector('#threadFive'),  
  totalAnomalies: document.querySelector('#totalAnomalies'),
  controlledEvents: document.querySelector('#controlledEvents'),
  criticalStops: document.querySelector('#criticalStops'),
  recoveryPercentage: document.querySelector('#recoveryPercentage'),
  averageResponseTime: document.querySelector('#averageResponseTime'),
  averageRecoveryTime: document.querySelector('#averageRecoveryTime'),
  exportButton: document.querySelector('#exportButton'),
  exportTraceButton: document.querySelector('#exportTraceButton'),
  clearHistoryButton: document.querySelector('#clearHistoryButton'),
  traceabilityTable: document.querySelector('#traceabilityTable'),
  traceCycleCount: document.querySelector('#traceCycleCount'),
  traceOkCount: document.querySelector('#traceOkCount'),
  traceNgCount: document.querySelector('#traceNgCount'),
  traceInterventionCount: document.querySelector('#traceInterventionCount'),
  impactValidationBadge: document.querySelector('#impactValidationBadge'),
  impactDefectBefore: document.querySelector('#impactDefectBefore'),
  impactDefectAfter: document.querySelector('#impactDefectAfter'),
  impactDefectDelta: document.querySelector('#impactDefectDelta'),
  impactFpyBefore: document.querySelector('#impactFpyBefore'),
  impactFpyAfter: document.querySelector('#impactFpyAfter'),
  impactFpyDelta: document.querySelector('#impactFpyDelta'),
  impactOeeBefore: document.querySelector('#impactOeeBefore'),
  impactOeeAfter: document.querySelector('#impactOeeAfter'),
  impactOeeDelta: document.querySelector('#impactOeeDelta'),
  impactStopsBefore: document.querySelector('#impactStopsBefore'),
  impactStopsAfter: document.querySelector('#impactStopsAfter'),
  impactStopsDelta: document.querySelector('#impactStopsDelta'),
  impactResponseBefore: document.querySelector('#impactResponseBefore'),
  impactResponseAfter: document.querySelector('#impactResponseAfter'),
  impactRecoveryBefore: document.querySelector('#impactRecoveryBefore'),
  impactRecoveryAfter: document.querySelector('#impactRecoveryAfter'),
  impactSegregated: document.querySelector('#impactSegregated'),
  impactCausalMatch: document.querySelector('#impactCausalMatch'),
  impactMethodNote: document.querySelector('#impactMethodNote'),
  exportImpactButton: document.querySelector('#exportImpactButton'),
  machineSelect: document.querySelector('#machineSelect'),
  machineModel: document.querySelector('#machineModel'),
  machineProduct: document.querySelector('#machineProduct'),
  machineOperationalStatus: document.querySelector(
    '#machineOperationalStatus'
  ),
  machineProduction: document.querySelector('#machineProduction'),
  machineDefectRate: document.querySelector('#machineDefectRate'),
  machineFailureEvents: document.querySelector('#machineFailureEvents'),
  machineAvailability: document.querySelector('#machineAvailability'),
  machineMtbf: document.querySelector('#machineMtbf'),
  globalDefectRate: document.querySelector('#globalDefectRate'),
  globalOee: document.querySelector('#globalOee'),
  priorityDefect: document.querySelector('#priorityDefect'),
  priorityDefectShare: document.querySelector('#priorityDefectShare'),
  dataOriginBadge: document.querySelector('#dataOriginBadge'),
    amefFailureCode: document.querySelector('#amefFailureCode'),
  amefFailureMode: document.querySelector('#amefFailureMode'),
  amefPotentialDefect: document.querySelector(
    '#amefPotentialDefect'
  ),
  amefNpr: document.querySelector('#amefNpr'),
  amefDuration: document.querySelector('#amefDuration'),
  amefRecommendedAction: document.querySelector(
    '#amefRecommendedAction'
  ),
  visualImageInput: document.querySelector('#visualImageInput'),
  visualImage: document.querySelector('#visualImage'),
  visualPlaceholder: document.querySelector('#visualPlaceholder'),
  inspectionRoi: document.querySelector('#inspectionRoi'),
  yoloDetectionLayer: document.querySelector('#yoloDetectionLayer'),
  expectedDefect: document.querySelector('#expectedDefect'),
  causalMatch: document.querySelector('#causalMatch'),
  yoloApiStatus: document.querySelector('#yoloApiStatus'),
  visualConfidence: document.querySelector('#visualConfidence'),
  visualConfidenceValue: document.querySelector('#visualConfidenceValue'),
  visualAnalyzeButton: document.querySelector('#visualAnalyzeButton'),
  visualBatchStatus: document.querySelector('#visualBatchStatus'),
  visualBatchProgress: document.querySelector('#visualBatchProgress'),
  visualBatchInterval: document.querySelector('#visualBatchInterval'),
  visualBatchStart: document.querySelector('#visualBatchStart'),
  visualBatchStop: document.querySelector('#visualBatchStop'),
  visualBatchOk: document.querySelector('#visualBatchOk'),
  visualBatchNg: document.querySelector('#visualBatchNg'),
  visualResult: document.querySelector('#visualResult'),
  visualResultStatus: document.querySelector('#visualResultStatus'),
  visualResultDetail: document.querySelector('#visualResultDetail'),
  riskSummaryCard: document.querySelector('#riskSummaryCard'),
  riskLevel: document.querySelector('#riskLevel'),
  riskScope: document.querySelector('#riskScope'),
  riskAnalyzeButton: document.querySelector('#riskAnalyzeButton'),
  riskModel: document.querySelector('#riskModel'),
  riskSourceMonth: document.querySelector('#riskSourceMonth'),
  riskTargetMonth: document.querySelector('#riskTargetMonth'),
  riskConfidence: document.querySelector('#riskConfidence'),
  riskProbLow: document.querySelector('#riskProbLow'),
  riskProbMedium: document.querySelector('#riskProbMedium'),
  riskProbHigh: document.querySelector('#riskProbHigh'),
  riskProbLowValue: document.querySelector('#riskProbLowValue'),
  riskProbMediumValue: document.querySelector('#riskProbMediumValue'),
  riskProbHighValue: document.querySelector('#riskProbHighValue'),
  riskFailure: document.querySelector('#riskFailure'),
  riskAction: document.querySelector('#riskAction'),
  riskNotice: document.querySelector('#riskNotice'),
  selectedModelName: document.querySelector('#selectedModelName'),
  openModelComparisonButton: document.querySelector('#openModelComparisonButton'),
  modelComparisonDialog: document.querySelector('#modelComparisonDialog'),
  closeModelComparisonButton: document.querySelector('#closeModelComparisonButton'),
  closeModelComparisonFooterButton: document.querySelector('#closeModelComparisonFooterButton'),
  modelComparisonScope: document.querySelector('#modelComparisonScope'),
  rfTestF1: document.querySelector('#rfTestF1'),
  rfTestMetrics: document.querySelector('#rfTestMetrics'),
  xgbTestF1: document.querySelector('#xgbTestF1'),
  xgbTestMetrics: document.querySelector('#xgbTestMetrics'),
  temporalComparison: document.querySelector('#temporalComparison'),
  modelSelectionReason: document.querySelector('#modelSelectionReason'),
  decisionVisualEvidence: document.querySelector('#decisionVisualEvidence'),
  decisionVisualDetail: document.querySelector('#decisionVisualDetail'),
  decisionRiskEvidence: document.querySelector('#decisionRiskEvidence'),
  decisionRiskDetail: document.querySelector('#decisionRiskDetail'),
  decisionAmefEvidence: document.querySelector('#decisionAmefEvidence'),
  decisionAmefDetail: document.querySelector('#decisionAmefDetail'),
  decisionOutputCard: document.querySelector('#decisionOutputCard'),
  integratedDecisionStatus: document.querySelector('#integratedDecisionStatus'),
  integratedDecisionAction: document.querySelector('#integratedDecisionAction'),
  integratedDecisionReason: document.querySelector('#integratedDecisionReason'),
  registerDecisionButton: document.querySelector('#registerDecisionButton'),
  hybridCycleCard: document.querySelector('#hybridCycleCard'),
  hybridCycleStatus: document.querySelector('#hybridCycleStatus'),
  hybridCycleDetail: document.querySelector('#hybridCycleDetail'),
  hybridLockBadge: document.querySelector('#hybridLockBadge'),
  hybridValidationStatus: document.querySelector('#hybridValidationStatus'),
  hybridConsecutiveDefects: document.querySelector('#hybridConsecutiveDefects'),
  confirmInterventionButton: document.querySelector('#confirmInterventionButton'),
  interventionStatus: document.querySelector('#interventionStatus'),
}
let dicapriData = {
  machines: [],
  machineKpis: [],
  baseline: null,
  defectPareto: [],
  failures: [],
  defectCauses: []
}

function formatInteger(value) {
  return new Intl.NumberFormat('es-PE', {
    maximumFractionDigits: 0
  }).format(value ?? 0)
}

function formatPercentage(value) {
  return new Intl.NumberFormat('es-PE', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value ?? 0)
}

function formatDecimal(value, decimals = 2) {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value ?? 0)
}

async function loadDicapriData() {
  try {
const responses = await Promise.all([
  fetch(`${import.meta.env.BASE_URL}data/maquinas.json`),
  fetch(`${import.meta.env.BASE_URL}data/kpi_maquinas.json`)
,
  fetch(`${import.meta.env.BASE_URL}data/linea_base.json`),
  fetch(`${import.meta.env.BASE_URL}data/pareto_defectos_ordenado.json`),
  fetch(`${import.meta.env.BASE_URL}data/fallas_amef.json`),
  fetch(`${import.meta.env.BASE_URL}data/defectos_causas.json`)
])

    if (responses.some(response => !response.ok)) {
      throw new Error('No se pudieron leer uno o más archivos JSON.')
    }

    const [
  machines,
  machineKpis,
  baseline,
  defectPareto,
  failures,
  defectCauses
] = await Promise.all(
  responses.map(response => response.json())
)
    dicapriData = {
      machines,
      machineKpis,
      baseline,
      defectPareto,
      failures,
      defectCauses
    }

    populateMachineSelector()
    renderGlobalBaseline()
    renderImpactComparison()
    renderAmefScenarioInfo(elements.scenarioSelect.value)
    elements.dataOriginBadge.textContent =
      'Base reconstruida 2025'

    elements.dataOriginBadge.classList.add('loaded')
  } catch (error) {
    console.error('Error al cargar la base Dicapri:', error)

    elements.dataOriginBadge.textContent =
      'Error al cargar datos'

    elements.dataOriginBadge.classList.add('error')
  }
}

async function loadModelComparison() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/comparacion_modelos.json`)
    if (!response.ok) throw new Error('Comparación no disponible')
    const comparison = await response.json()
    const rf = comparison.modelos?.['Random Forest']
    const xgb = comparison.modelos?.XGBoost
    if (!rf || !xgb) throw new Error('Resultados incompletos')

    const formatMetric = value => `${((Number(value) || 0) * 100).toFixed(1)} %`
    elements.selectedModelName.textContent =
      `${comparison.modelo_seleccionado} seleccionado`
    elements.modelComparisonScope.textContent = comparison.alcance
    elements.rfTestF1.textContent = `F1 macro ${formatMetric(rf.prueba_final.f1_macro)}`
    elements.rfTestMetrics.textContent =
      `Accuracy ${formatMetric(rf.prueba_final.accuracy)} · ` +
      `Precision ${formatMetric(rf.prueba_final.precision_macro)} · ` +
      `Recall ${formatMetric(rf.prueba_final.recall_macro)}`
    elements.xgbTestF1.textContent = `F1 macro ${formatMetric(xgb.prueba_final.f1_macro)}`
    elements.xgbTestMetrics.textContent =
      `Accuracy ${formatMetric(xgb.prueba_final.accuracy)} · ` +
      `Precision ${formatMetric(xgb.prueba_final.precision_macro)} · ` +
      `Recall ${formatMetric(xgb.prueba_final.recall_macro)}`
    elements.temporalComparison.textContent =
      `RF ${formatMetric(rf.validacion_cruzada_temporal.f1_macro_promedio)} · ` +
      `XGB ${formatMetric(xgb.validacion_cruzada_temporal.f1_macro_promedio)}`
    elements.modelSelectionReason.textContent =
      'Random Forest logra mayor F1 macro, accuracy y estabilidad temporal.'
  } catch (error) {
    console.warn('No se cargó la comparación de modelos:', error)
    elements.selectedModelName.textContent = 'Comparación no disponible'
    elements.modelSelectionReason.textContent =
      'Ejecuta ml_comparison/comparar_rf_xgboost.py para regenerarla.'
  }
}
const scenarioAmefMap = {
  normal: {
    failureIds: [],
    defect: 'Ninguno',
    action: 'Mantener supervisión de variables'
  },
  lowTension: {
    failureIds: ['F07'],
    defect: 'D09 — Tejido incorrecto parcial',
    action: 'Aumentar tensión mediante servotensor'
  },
  highTension: {
    failureIds: ['F07'],
    defect: 'D09 — Tejido incorrecto parcial',
    action: 'Liberar tensor y reducir velocidad'
  },
  brokenThread: {
    failureIds: ['F03'],
    defect: 'D03 — Vacío o falta de tejido',
    action: 'Detener máquina y reponer el hilo'
  },
  jam: {
    failureIds: ['F04', 'F10'],
    defect: 'D02/D03 — Zona sin tejer o vacío',
    action: 'Ejecutar parada y revisar el mecanismo'
  },
  brokenNeedle: {
    failureIds: ['F01'],
    defect: 'D01 — Raya vertical',
    action: 'Detener máquina y sustituir la aguja'
  },
  elasticTrigger: {
    failureIds: ['F09'],
    defect: 'D04/D07 — Defecto en el elástico',
    action: 'Detener y ajustar el disparador elástico'
  },
  oilStain: {
    failureIds: ['F12'],
    defect: 'D06 — Mancha',
    action: 'Segregar prenda y revisar lubricación'
  }
}

function renderAmefScenarioInfo(scenario) {
  const map = scenarioAmefMap[scenario]

  if (!map) return

  if (map.failureIds.length === 0) {
    elements.amefFailureCode.textContent = 'Sin falla'
    elements.amefFailureMode.textContent = 'Operación normal'
    elements.amefPotentialDefect.textContent = map.defect
    elements.amefNpr.textContent = '0'
    elements.amefDuration.textContent = '—'
    elements.amefRecommendedAction.textContent = map.action
    return
  }

  const failures = map.failureIds
    .map(id =>
      dicapriData.failures.find(
        failure => failure['ID_Falla'] === id
      )
    )
    .filter(Boolean)

  if (failures.length === 0) {
    elements.amefFailureCode.textContent =
      map.failureIds.join(' / ')

    elements.amefFailureMode.textContent =
      'Información AMEF no disponible'

    elements.amefPotentialDefect.textContent = map.defect
    elements.amefNpr.textContent = '—'
    elements.amefDuration.textContent = '—'
    elements.amefRecommendedAction.textContent = map.action
    return
  }

  elements.amefFailureCode.textContent =
    failures.map(failure => failure['ID_Falla']).join(' / ')

  elements.amefFailureMode.textContent =
    failures
      .map(failure => failure['Modo_falla'])
      .join(' / ')

  elements.amefPotentialDefect.textContent = map.defect

  elements.amefNpr.textContent = Math.max(
    ...failures.map(failure => Number(failure['NPR']) || 0)
  )

  elements.amefDuration.textContent =
    failures
      .map(failure => failure['Duración_ref_min'])
      .filter(Boolean)
      .join(' / ') || 'Sin parada'

  elements.amefRecommendedAction.textContent = map.action
}
function populateMachineSelector() {
  const productoObjetivo = 'Tobilleras blancas con diseño';

  const maquinasCompatibles = dicapriData.machines.filter(machine =>
    machine['Producto_habitual']
      ?.trim()
      .toLowerCase() === productoObjetivo.toLowerCase()
  );

  elements.machineSelect.innerHTML = maquinasCompatibles
    .map(machine => {
      const id = machine['ID_Máquina'];
      const model = machine['Modelo'];

      return `
        <option value="${id}">
          ${id} — ${model}
        </option>
      `;
    })
    .join('');

  const maquinaPredeterminada = 'M07';

  const initialMachine = maquinasCompatibles.some(
    machine => machine['ID_Máquina'] === maquinaPredeterminada
  )
    ? maquinaPredeterminada
    : maquinasCompatibles[0]?.['ID_Máquina'];

  if (initialMachine) {
    elements.machineSelect.value = initialMachine;
    renderMachineData(initialMachine);
  }
}

function renderMachineData(machineId) {
  const machine = dicapriData.machines.find(
    item => item['ID_Máquina'] === machineId
  )

  const kpi = dicapriData.machineKpis.find(
    item => item['ID_Máquina'] === machineId
  )

  if (!machine || !kpi) return

  elements.machineModel.textContent =
    `${machine['Marca']} ${machine['Modelo']}`

  elements.machineProduct.textContent =
    machine['Producto_habitual'] || 'Sin producto asignado'

  elements.machineOperationalStatus.textContent =
    machine['Estado'] || 'Sin información'

  elements.machineProduction.textContent =
    formatInteger(kpi['Producción'])

  elements.machineDefectRate.textContent =
    formatPercentage(kpi['% Defectos'])

  elements.machineFailureEvents.textContent =
    formatInteger(kpi['Eventos_falla'])

  elements.machineAvailability.textContent =
    formatPercentage(kpi['Disponibilidad'])

  elements.machineMtbf.textContent =
    `${formatDecimal(kpi['MTBF_h'], 2)} h`
}

function renderGlobalBaseline() {
  const baseline = dicapriData.baseline
  const priorityDefect = dicapriData.defectPareto[0]

  if (!baseline || !priorityDefect) return

  elements.globalDefectRate.textContent =
    formatPercentage(baseline['% defectuosas']?.valor)

  elements.globalOee.textContent =
    formatPercentage(baseline['OEE reconstruido']?.valor)

  elements.priorityDefect.textContent =
    priorityDefect['Defecto']

  elements.priorityDefectShare.textContent =
    formatPercentage(priorityDefect['Porcentaje'])
}

const chartLabels = []

const chartConfiguration = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    legend: {
      labels: {
        color: '#334e68',
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        font: {
          size: 10
        }
      }
    },
    tooltip: {
      backgroundColor: '#172033',
      borderColor: '#52677d',
      borderWidth: 1,
      titleColor: '#ffffff',
      bodyColor: '#e2e8f0'
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#52677d',
        maxTicksLimit: 6,
        font: {
          size: 9
        }
      },
      grid: {
        color: 'rgba(72, 104, 135, 0.18)'
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#52677d',
        font: {
          size: 9
        }
      },
      grid: {
        color: 'rgba(72, 104, 135, 0.18)'
      }
    }
  }
}

const threadConditionChart = new Chart(
  document.querySelector('#threadConditionChart'),
  {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: 'Tensión (cN)',
          data: [],
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35
        },
        {
          label: 'Velocidad (rpm)',
          data: [],
          borderColor: '#a78bfa',
          backgroundColor: 'rgba(167, 139, 250, 0.12)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35
        }
      ]
    },
    options: chartConfiguration
  }
)

const mechanicalChart = new Chart(
  document.querySelector('#mechanicalChart'),
  {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: 'Vibración (mm/s)',
          data: [],
          borderColor: '#fbbf24',
          backgroundColor: 'rgba(251, 191, 36, 0.12)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35
        },
        {
          label: 'Corriente (A)',
          data: [],
          borderColor: '#fb7185',
          backgroundColor: 'rgba(251, 113, 133, 0.12)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35
        }
      ]
    },
    options: chartConfiguration
  }
)

const temperatureChart = new Chart(
  document.querySelector('#temperatureChart'),
  {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: 'Temperatura (°C)',
          data: [],
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.13)',
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35
        }
      ]
    },
    options: chartConfiguration
  }
)

function updateChartTheme(theme) {
  const dark = theme === 'dark'
  const textColor = dark ? '#b9c8dc' : '#52677d'
  const legendColor = dark ? '#dbeafe' : '#334e68'
  const gridColor = dark
    ? 'rgba(148, 163, 184, 0.18)'
    : 'rgba(72, 104, 135, 0.18)'

  ;[threadConditionChart, mechanicalChart, temperatureChart].forEach(chart => {
    chart.options.plugins.legend.labels.color = legendColor
    chart.options.plugins.tooltip.backgroundColor = dark ? '#07111f' : '#172033'
    chart.options.plugins.tooltip.borderColor = dark ? '#38bdf8' : '#52677d'
    chart.options.scales.x.ticks.color = textColor
    chart.options.scales.y.ticks.color = textColor
    chart.options.scales.x.grid.color = gridColor
    chart.options.scales.y.grid.color = gridColor
    chart.update('none')
  })
}

function applyTheme(theme, persist = true) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light'
  const dark = nextTheme === 'dark'

  document.documentElement.dataset.theme = nextTheme
  elements.themeToggleText.textContent = dark ? 'Modo claro' : 'Modo oscuro'
  elements.themeToggleIcon.textContent = dark ? '☀' : '☾'
  elements.themeToggle.setAttribute(
    'aria-label',
    dark ? 'Activar modo claro' : 'Activar modo oscuro'
  )
  elements.themeToggle.setAttribute('aria-pressed', String(dark))

  if (persist) localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  updateChartTheme(nextTheme)
  machine3D?.setTheme(nextTheme)
}

function updateCharts() {
  const timeLabel = elements.simulationTime.textContent

  chartLabels.push(timeLabel)

  threadConditionChart.data.datasets[0].data.push(
    Number(values.tension.toFixed(1))
  )

  threadConditionChart.data.datasets[1].data.push(
    Math.round(values.speed)
  )

  mechanicalChart.data.datasets[0].data.push(
    Number(values.vibration.toFixed(1))
  )

  mechanicalChart.data.datasets[1].data.push(
    Number(values.current.toFixed(1))
  )

  temperatureChart.data.datasets[0].data.push(
    Number(values.temperature.toFixed(1))
  )

  if (chartLabels.length > 30) {
    chartLabels.shift()

    threadConditionChart.data.datasets.forEach(dataset => {
      dataset.data.shift()
    })

    mechanicalChart.data.datasets.forEach(dataset => {
      dataset.data.shift()
    })

    temperatureChart.data.datasets.forEach(dataset => {
      dataset.data.shift()
    })
  }

  threadConditionChart.update('none')
  mechanicalChart.update('none')
  temperatureChart.update('none')
}

function clearCharts() {
  chartLabels.length = 0

  threadConditionChart.data.datasets.forEach(dataset => {
    dataset.data.length = 0
  })

  mechanicalChart.data.datasets.forEach(dataset => {
    dataset.data.length = 0
  })

  temperatureChart.data.datasets.forEach(dataset => {
    dataset.data.length = 0
  })

  threadConditionChart.update('none')
  mechanicalChart.update('none')
  temperatureChart.update('none')
}

function randomNoise(amount) {
  return (Math.random() - 0.5) * amount
}

function approach(current, target, rate) {
  return current + (target - current) * rate
}

function updateTimer() {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const remainingSeconds = String(seconds % 60).padStart(2, '0')
  elements.simulationTime.textContent = `${minutes}:${remainingSeconds}`
}

function updateValues() {
  if (!running) return

  const targets = {
    normal: {
      tension: 42,
      speed: 105,
      vibration: 1.8,
      temperature: 40,
      current: 1.1,
      threadPresent: true
    },
    lowTension: {
      tension: 20,
      speed: 102,
      vibration: 2.2,
      temperature: 42,
      current: 1.0,
      threadPresent: true
    },
    highTension: {
      tension: 68,
      speed: 108,
      vibration: 3.2,
      temperature: 47,
      current: 1.6,
      threadPresent: true
    },
    brokenThread: {
      tension: 0.5,
      speed: 0,
      vibration: 0.2,
      temperature: 37,
      current: 0.1,
      threadPresent: false
    },
    jam: {
      tension: 72,
      speed: 35,
      vibration: 6.8,
      temperature: 61,
      current: 2.6,
      threadPresent: true
    },
        brokenNeedle: {
      tension: 46,
      speed: 55,
      vibration: 5.8,
      temperature: 48,
      current: 1.8,
      threadPresent: true
    },
    elasticTrigger: {
      tension: 29,
      speed: 88,
      vibration: 2.7,
      temperature: 43,
      current: 1.3,
      threadPresent: true
    },
    oilStain: {
      tension: 42,
      speed: 103,
      vibration: 1.9,
      temperature: 44,
      current: 1.1,
      threadPresent: true
    },
    correctingLowTension: {
      tension: 42,
      speed: 90,
      vibration: 2.0,
      temperature: 41,
      current: 1.1,
      threadPresent: true
    },
    correctingHighTension: {
      tension: 45,
      speed: 80,
      vibration: 2.3,
      temperature: 43,
      current: 1.2,
      threadPresent: true
    }
  }

  const target = targets[currentScenario]

  values.tension = approach(values.tension, target.tension, 0.18)
  values.speed = approach(values.speed, target.speed, 0.18)
  values.vibration = approach(values.vibration, target.vibration, 0.18)
  values.temperature = approach(values.temperature, target.temperature, 0.08)
  values.current = approach(values.current, target.current, 0.18)
  values.threadPresent = target.threadPresent

  renderValues()
}

function renderValues() {
  document.querySelector('#tensionValue').textContent =
    Math.max(0, values.tension + randomNoise(0.7)).toFixed(1)

const displayedRpm = Math.max(
  0,
  Math.round(values.speed + randomNoise(2))
)

document.querySelector('#speedValue').textContent = displayedRpm

machine3D?.setRPM(displayedRpm)
machine3D?.setProcessState({
  scenario: currentScenario,
  running,
  threadPresent: values.threadPresent,
  vibration: values.vibration
})

const machine3dRpm = document.querySelector('#machine3dRpm')
if (machine3dRpm) machine3dRpm.textContent = displayedRpm

  document.querySelector('#vibrationValue').textContent =
    Math.max(0, values.vibration + randomNoise(0.15)).toFixed(1)

  document.querySelector('#temperatureValue').textContent =
    Math.max(0, values.temperature + randomNoise(0.3)).toFixed(1)

  document.querySelector('#currentValue').textContent =
    Math.max(0, values.current + randomNoise(0.08)).toFixed(1)

  document.querySelector('#threadValue').textContent =
    values.threadPresent ? 'Detectado' : 'No detectado'

  setCardStatus('tensionCard',
    values.tension < 25 || values.tension > 60
      ? 'critical'
      : values.tension < 35 || values.tension > 50
        ? 'warning'
        : 'normal'
  )
  setCardStatus(
  'speedCard',
  values.speed === 0 ||
  values.speed < 60 ||
  values.speed > 140
    ? 'critical'
    : values.speed < 90 || values.speed > 120
      ? 'warning'
      : 'normal'
)

  setCardStatus('vibrationCard',
    values.vibration > 5 ? 'critical' : values.vibration > 3 ? 'warning' : 'normal'
  )

  setCardStatus('temperatureCard',
    values.temperature > 65
      ? 'critical'
      : values.temperature > 55
        ? 'warning'
        : 'normal'
  )

  setCardStatus('currentCard',
    values.current > 2
      ? 'critical'
      : values.current > 1.5
        ? 'warning'
        : 'normal'
  )

  setCardStatus('threadCard', values.threadPresent ? 'normal' : 'critical')
}

function setCardStatus(id, status) {
  const card = document.querySelector(`#${id}`)
  card.classList.remove('normal', 'warning', 'critical')
  card.classList.add(status)
}

function setSystemStatus(status, text) {
  elements.systemStatus.className = `system-status ${status}`
  elements.systemStatusText.textContent = text
}

function applyScenario() {
  cancelScheduledCorrections()

  currentScenario = elements.scenarioSelect.value
  renderAmefScenarioInfo(currentScenario)

  correctionInProgress = false

  const scenarioData = {
    normal: {
      anomaly: 'Ninguna',
      diagnosis: 'Operación dentro de parámetros',
      action: 'Mantener condiciones actuales',
      status: 'normal',
      statusText: 'Operación normal',
      recoverable: false
    },
    lowTension: {
      anomaly: 'Tensión por debajo del límite',
      diagnosis: 'Tensión insuficiente',
      action: 'Incrementar posición del servotensor',
      status: 'warning',
      statusText: 'Advertencia de tensión',
      recoverable: true
    },
    highTension: {
      anomaly: 'Tensión por encima del límite',
      diagnosis: 'Sobretensión del hilo',
      action: 'Liberar tensor y reducir velocidad',
      status: 'warning',
      statusText: 'Sobretensión detectada',
      recoverable: true
    },
    brokenThread: {
      anomaly: 'Ausencia de hilo',
      diagnosis: 'Rotura de hilo',
      action: 'Detener máquina y solicitar intervención',
      status: 'critical',
      statusText: 'Parada por rotura',
      recoverable: false
    },
    jam: {
      anomaly: 'Corriente y vibración elevadas',
      diagnosis: 'Posible atascamiento',
      action: 'Ejecutar parada de protección',
      status: 'critical',
      statusText: 'Atascamiento detectado',
      recoverable: false
    },
    brokenNeedle: {
      anomaly: 'Vibración elevada y pérdida de estabilidad',
      diagnosis: 'Posible rotura de aguja no confirmada por la máquina',
      action: 'Continuar hasta finalizar la media y ejecutar inspección YOLO',
      status: 'warning',
      statusText: 'Anomalía mecánica bajo evaluación',
      recoverable: false
    },
    elasticTrigger: {
      anomaly: 'Comportamiento irregular del elástico',
      diagnosis: 'Falla del disparador automático',
      action: 'Detener y ajustar el disparador elástico',
      status: 'critical',
      statusText: 'Falla del elástico detectada',
      recoverable: false
    },
    oilStain: {
      anomaly: 'Anomalía visual en la superficie',
      diagnosis: 'Posible mancha de lubricante',
      action: 'Segregar prenda y revisar lubricación',
      status: 'warning',
      statusText: 'Mancha detectada',
      recoverable: false
    }
  }

  const data = scenarioData[currentScenario]
  const eventStartSeconds = seconds
  const inducedScenario = currentScenario

  if (inducedScenario !== 'normal') {
    metrics.totalAnomalies += 1

    if (data.recoverable) {
      metrics.recoverableEvents += 1
    }

if (
  inducedScenario === 'brokenThread' ||
  inducedScenario === 'jam' ||
  inducedScenario === 'elasticTrigger'
) {
      metrics.criticalStops += 1
    }

    updateMetrics()
  }
  elements.anomalyText.textContent = data.anomaly
  elements.diagnosisText.textContent = 'Analizando variables...'
  elements.actionText.textContent = 'Esperando decisión'
  setSystemStatus(data.status, data.statusText)
  updateMachineAnimation()

  scheduleCorrection(() => {
    elements.diagnosisText.textContent = data.diagnosis
        if (inducedScenario !== 'normal') {
      const responseTime = Math.max(1, seconds - eventStartSeconds)
      metrics.responseTimes.push(responseTime)
      updateMetrics()
    }

    if (elements.automaticControl.checked) {
      elements.actionText.textContent = data.action
    } else {
      elements.actionText.textContent = 'Control automático desactivado'
    }

    addEvent(inducedScenario, data)
  }, 1500)

  if (
    data.recoverable &&
    elements.automaticControl.checked &&
    currentScenario !== 'normal'
  ) {
    scheduleCorrection(() => {
      correctionInProgress = true

      if (currentScenario === 'lowTension') {
        currentScenario = 'correctingLowTension'
        elements.actionText.textContent =
          'Aumentando tensión mediante servotensor'
      } else if (currentScenario === 'highTension') {
        currentScenario = 'correctingHighTension'
        elements.actionText.textContent =
          'Liberando tensor y reduciendo velocidad'
      }

      elements.diagnosisText.textContent =
        'Corrección automática en ejecución'

      setSystemStatus('correcting', 'Aplicando corrección')
      updateMachineAnimation()
    }, 4500)

    scheduleCorrection(() => {
      currentScenario = 'normal'
      correctionInProgress = false

      elements.anomalyText.textContent = 'Condición controlada'
      elements.diagnosisText.textContent =
        'Variables nuevamente dentro del rango'

      elements.actionText.textContent =
        'Recuperación verificada; velocidad normalizada'

      setSystemStatus('normal', 'Anomalía controlada')
      updateMachineAnimation()

            const recoveryTime = Math.max(1, seconds - eventStartSeconds)

      metrics.controlledEvents += 1
      metrics.recoveryTimes.push(recoveryTime)
      updateMetrics()

      addRecoveryEvent(inducedScenario, data, recoveryTime)
    }, 10000)
  }
}

function updateMachineAnimation() {
  const moving =
  running &&
  currentScenario !== 'brokenThread' &&
  currentScenario !== 'jam' &&
  currentScenario !== 'elasticTrigger'

  elements.spool.classList.toggle('rotating', moving)
  elements.weavingUnit.classList.toggle('rotating', moving)

  const broken = currentScenario === 'brokenThread'

  elements.threadFour.classList.toggle('broken', broken)
  elements.threadFive.classList.toggle('broken', broken)

  const servoOperating =
    currentScenario === 'lowTension' ||
    currentScenario === 'highTension' ||
    currentScenario === 'correctingLowTension' ||
    currentScenario === 'correctingHighTension'

  elements.servo.classList.toggle('adjusting', servoOperating)
}

const scenarioLabels = {
  normal: 'Operación normal',
  lowTension: 'Tensión insuficiente',
  highTension: 'Sobretensión',
  brokenThread: 'Rotura de hilo',
  jam: 'Atascamiento',
  brokenNeedle: 'Rotura de aguja',
  elasticTrigger: 'Falla del disparador elástico',
  oilStain: 'Lubricante sobre la prenda'
}

function getAmefEventData(scenario) {
  const map = scenarioAmefMap[scenario] || {
    failureIds: [],
    defect: 'No determinado'
  }

  const failures = map.failureIds
    .map(id =>
      dicapriData.failures.find(
        failure => failure['ID_Falla'] === id
      )
    )
    .filter(Boolean)

  return {
    codigoAmef: map.failureIds.join(' / ') || 'Sin falla',
    modoFalla:
      failures.map(failure => failure['Modo_falla']).join(' / ') ||
      'Operación normal',
    npr:
      failures.length > 0
        ? Math.max(...failures.map(failure => Number(failure.NPR) || 0))
        : 0,
    defectoPotencial: map.defect
  }
}

function formatEventDate(value) {
  if (!value) return 'Fecha y hora no registradas'

  const parsedDate = new Date(value)

  // Los eventos nuevos se guardan en ISO y pueden convertirse normalmente.
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleString('es-PE', {
      dateStyle: 'short',
      timeStyle: 'medium'
    })
  }

  // Compatibilidad con eventos antiguos guardados directamente en formato es-PE.
  return String(value)
}

function renderEventRow(record, prepend = true) {
  const emptyRow = elements.eventTable.querySelector('.empty-row')
  if (emptyRow) emptyRow.remove()

  const row = document.createElement('tr')
  const resultText = String(record.resultado || 'Pendiente')
  const resultClass = resultText.includes('Recuperación') ||
    record.resultado === 'Acción iniciada' ||
    record.resultado === 'Conforme' ||
    resultText === 'Riesgo Bajo' ||
    resultText === 'Continuar operación'
    ? 'success'
    : record.resultado === 'Parada crítica' ||
        record.resultado === 'No conforme' ||
        resultText === 'Riesgo Alto' ||
        resultText.includes('Parada')
      ? 'critical'
      : 'pending'

  const fecha = formatEventDate(record.fechaHora)
  const npr = record.npr === 0 || record.npr ? record.npr : '—'
  const confidence = record.confianzaVisual || '—'

  row.innerHTML = `
    <td>
      <span class="event-main">${fecha}</span>
      <span class="event-sub">Tiempo simulado: ${record.tiempo || '—'}</span>
    </td>
    <td><span class="event-main">${record.maquina || '—'}</span></td>
    <td><span class="event-main">${record.escenario || '—'}</span></td>
    <td>
      <span class="event-main event-code">${record.codigoAmef || '—'}</span>
      <span class="event-sub">NPR: ${npr}</span>
    </td>
    <td>
      <span class="event-main">${record.defectoPotencial || '—'}</span>
      <span class="event-sub">Confianza: ${confidence}</span>
    </td>
    <td>${record.diagnostico || '—'}</td>
    <td>${record.accion || '—'}</td>
    <td>
      <span class="result-tag ${resultClass}">
        ${resultText}
      </span>
    </td>
  `

  if (prepend) {
    elements.eventTable.prepend(row)
  } else {
    elements.eventTable.append(row)
  }
}

function renderStoredEvents() {
  if (eventRecords.length === 0) return

  elements.eventTable.innerHTML = ''
  eventRecords
    .slice()
    .reverse()
    .forEach(record => renderEventRow(record, false))
}

function createCycleId() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replaceAll('-', '')
  const sequence = String(cycleTraceRecords.length + 1).padStart(4, '0')
  return `MED-${date}-${sequence}`
}

function sensorSnapshot() {
  return {
    tension: Number(values.tension.toFixed(1)),
    velocidad: Math.round(values.speed),
    vibracion: Number(values.vibration.toFixed(1)),
    temperatura: Number(values.temperature.toFixed(1)),
    corriente: Number(values.current.toFixed(1)),
    presenciaHilo: values.threadPresent ? 'Detectado' : 'No detectado'
  }
}

function startCycleTrace() {
  activeCycleTrace = {
    idCiclo: createCycleId(),
    inicio: new Date().toISOString(),
    fin: null,
    tiempoSimuladoInicio: elements.simulationTime.textContent,
    tiempoSimuladoFin: null,
    duracionSegundos: 0,
    maquina: elements.machineSelect.value || 'Sin máquina',
    escenario: 'En evaluación',
    sensores: sensorSnapshot(),
    riesgoRF: 'Pendiente',
    confianzaRF: null,
    defectoEsperado: 'Pendiente',
    resultadoYolo: 'Pendiente',
    clasesYolo: [],
    confianzaYolo: null,
    coincidenciaCausal: 'Pendiente',
    codigoAmef: 'Pendiente',
    npr: null,
    decision: 'Pendiente',
    accion: 'Pendiente',
    intervencion: 'No requerida',
    tiempoIntervencionSegundos: null,
    resultadoFinal: 'En proceso',
    recurrenciaVentana: null,
    recurrenciaDefectos: null,
    recurrenciaNivel: 'Sin evaluar',
    mantenimientoRecurrente: 'No requerido'
  }
}

function updateActiveCycleTrace(patch) {
  if (!activeCycleTrace) return
  Object.assign(activeCycleTrace, patch)
}

function finalizeCycleTrace(result = 'Ciclo completado') {
  if (!activeCycleTrace) return null

  const end = new Date()
  const start = new Date(activeCycleTrace.inicio)
  activeCycleTrace.fin = end.toISOString()
  activeCycleTrace.tiempoSimuladoFin = elements.simulationTime.textContent
  activeCycleTrace.duracionSegundos = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 1000)
  )
  activeCycleTrace.sensores = sensorSnapshot()
  activeCycleTrace.resultadoFinal = result

  const completedTrace = { ...activeCycleTrace }
  cycleTraceRecords.push(completedTrace)
  saveCycleTraces()
  renderCycleTraceRow(completedTrace)
  updateTraceabilitySummary()
  activeCycleTrace = null
  return completedTrace
}

function updateStoredCycleTrace(cycleId, patch) {
  const index = cycleTraceRecords.findIndex(item => item.idCiclo === cycleId)
  if (index < 0) return
  cycleTraceRecords[index] = { ...cycleTraceRecords[index], ...patch }
  saveCycleTraces()
  renderStoredCycleTraces()
}

function formatTracePeriod(record) {
  const start = formatEventDate(record.inicio)
  const end = record.fin ? formatEventDate(record.fin) : 'En curso'
  return `${start} → ${end}`
}

function renderCycleTraceRow(record, prepend = true) {
  const emptyRow = elements.traceabilityTable.querySelector('.empty-trace-row')
  if (emptyRow) emptyRow.remove()

  const row = document.createElement('tr')
  row.dataset.cycleId = record.idCiclo
  const sensors = record.sensores || {}
  const yoloClass = record.resultadoYolo === 'Conforme'
    ? 'success'
    : record.resultadoYolo === 'No conforme'
      ? 'critical'
      : 'pending'
  const resultClass = String(record.resultadoFinal).includes('Liberada') ||
    String(record.resultadoFinal).includes('Conforme') ||
    String(record.resultadoFinal).includes('Autorizada')
    ? 'success'
    : String(record.resultadoFinal).includes('Deten') ||
        String(record.resultadoFinal).includes('No conforme')
      ? 'critical'
      : 'pending'

  row.innerHTML = `
    <td>
      <span class="event-main event-code">${record.idCiclo}</span>
      <span class="event-sub">${formatTracePeriod(record)}</span>
      <span class="event-sub">Duración: ${record.duracionSegundos ?? 0} s</span>
    </td>
    <td>
      <span class="event-main">${record.maquina}</span>
      <span class="event-sub">${record.escenario}</span>
    </td>
    <td>
      <span class="event-main">${sensors.tension ?? '—'} cN · ${sensors.velocidad ?? '—'} RPM</span>
      <span class="event-sub">Vib. ${sensors.vibracion ?? '—'} mm/s · ${sensors.temperatura ?? '—'} °C</span>
      <span class="event-sub">${sensors.corriente ?? '—'} A · Hilo: ${sensors.presenciaHilo ?? '—'}</span>
    </td>
    <td>
      <span class="event-main">Riesgo ${record.riesgoRF}</span>
      <span class="event-sub">Confianza: ${record.confianzaRF == null ? '—' : `${record.confianzaRF.toFixed(1)} %`}</span>
    </td>
    <td>
      <span class="result-tag ${yoloClass}">${record.resultadoYolo}</span>
      <span class="event-sub">${record.clasesYolo?.join(' / ') || 'Sin clases'}</span>
      <span class="event-sub">Esperado: ${record.defectoEsperado}</span>
      <span class="event-sub">Causalidad: ${record.coincidenciaCausal}</span>
    </td>
    <td>
      <span class="event-main event-code">${record.codigoAmef}</span>
      <span class="event-sub">NPR: ${record.npr ?? '—'}</span>
    </td>
    <td>
      <span class="event-main">${record.decision}</span>
      <span class="event-sub">${record.accion}</span>
      <span class="event-sub">Intervención: ${record.intervencion}</span>
    </td>
    <td>
      <span class="result-tag ${resultClass}">${record.resultadoFinal}</span>
      <span class="event-sub">Tiempo operario: ${record.tiempoIntervencionSegundos == null ? '—' : `${record.tiempoIntervencionSegundos} s`}</span>
    </td>
  `

  if (prepend) elements.traceabilityTable.prepend(row)
  else elements.traceabilityTable.append(row)
}

function updateTraceabilitySummary() {
  const ok = cycleTraceRecords.filter(item => item.resultadoYolo === 'Conforme').length
  const ng = cycleTraceRecords.filter(item => item.resultadoYolo === 'No conforme').length
  const interventions = cycleTraceRecords.filter(
    item => item.intervencion && item.intervencion !== 'No requerida'
  ).length
  elements.traceCycleCount.textContent = String(cycleTraceRecords.length)
  elements.traceOkCount.textContent = String(ok)
  elements.traceNgCount.textContent = String(ng)
  elements.traceInterventionCount.textContent = String(interventions)
  renderImpactComparison()
}

function calculateImpactIndicators() {
  const baseline = dicapriData.baseline
  const baselineProduction = Number(baseline?.['Producción total']?.valor) || 0
  const baselineFailures = Number(baseline?.['Eventos de falla']?.valor) || 0
  const baselineDefectRate = Number(baseline?.['% defectuosas']?.valor) || 0
  const baselineAvailability = Number(baseline?.['Disponibilidad']?.valor) || 0
  const baselinePerformance = Number(baseline?.['Rendimiento']?.valor) || 0
  const baselineOee = Number(baseline?.['OEE reconstruido']?.valor) || 0

  const inspected = cycleTraceRecords.filter(item =>
    ['Conforme', 'No conforme'].includes(item.resultadoYolo)
  )
  const ok = inspected.filter(item => item.resultadoYolo === 'Conforme').length
  const ng = inspected.filter(item => item.resultadoYolo === 'No conforme').length
  const defectRate = inspected.length ? ng / inspected.length : null
  const fpy = inspected.length ? ok / inspected.length : null

  const totalCycleSeconds = cycleTraceRecords.reduce(
    (sum, item) => sum + (Number(item.duracionSegundos) || 0), 0
  )
  const interventionSeconds = cycleTraceRecords.reduce(
    (sum, item) => sum + (Number(item.tiempoIntervencionSegundos) || 0), 0
  )
  const simulatedAvailability = totalCycleSeconds + interventionSeconds > 0
    ? totalCycleSeconds / (totalCycleSeconds + interventionSeconds)
    : null
  const simulatedOee = simulatedAvailability != null && fpy != null
    ? simulatedAvailability * baselinePerformance * fpy
    : null

  const interventions = cycleTraceRecords.filter(
    item => item.intervencion && item.intervencion !== 'No requerida'
  )
  const stopsPer100 = cycleTraceRecords.length
    ? (interventions.length / cycleTraceRecords.length) * 100
    : null
  const baselineStopsPer100 = baselineProduction
    ? (baselineFailures / baselineProduction) * 100
    : null

  const completedInterventions = cycleTraceRecords
    .map(item => Number(item.tiempoIntervencionSegundos))
    .filter(value => Number.isFinite(value) && value > 0)
  const recoveryTime = completedInterventions.length
    ? calculateAverage(completedInterventions)
    : null
  const responseTime = metrics.responseTimes.length
    ? calculateAverage(metrics.responseTimes)
    : null

  const causalRecords = inspected.filter(item =>
    ['Coincide', 'No coincide'].includes(item.coincidenciaCausal)
  )
  const causalMatches = causalRecords.filter(
    item => item.coincidenciaCausal === 'Coincide'
  ).length
  const causalRate = causalRecords.length
    ? causalMatches / causalRecords.length
    : null

  return {
    sampleSize: inspected.length,
    baselineDefectRate,
    defectRate,
    baselineFpy: 1 - baselineDefectRate,
    fpy,
    baselineOee,
    simulatedOee,
    baselineAvailability,
    simulatedAvailability,
    baselineStopsPer100,
    stopsPer100,
    responseTime,
    recoveryTime,
    segregated: ng,
    causalRate
  }
}

function percentageOrDash(value) {
  return value == null || !Number.isFinite(value)
    ? '—'
    : formatPercentage(value)
}

function numericOrDash(value, suffix = '') {
  return value == null || !Number.isFinite(value)
    ? '—'
    : `${formatDecimal(value, 2)}${suffix}`
}

function renderImpactComparison() {
  if (!elements.impactValidationBadge) return
  const impact = calculateImpactIndicators()
  const deltaDefects = impact.defectRate == null
    ? null
    : impact.defectRate - impact.baselineDefectRate
  const deltaFpy = impact.fpy == null
    ? null
    : impact.fpy - impact.baselineFpy
  const deltaOee = impact.simulatedOee == null
    ? null
    : impact.simulatedOee - impact.baselineOee

  elements.impactDefectBefore.textContent = percentageOrDash(impact.baselineDefectRate)
  elements.impactDefectAfter.textContent = percentageOrDash(impact.defectRate)
  elements.impactDefectDelta.textContent = deltaDefects == null
    ? 'Esperando ciclos con inspección YOLO.'
    : `${deltaDefects <= 0 ? 'Reducción' : 'Incremento'} observado en la corrida: ${formatPercentage(Math.abs(deltaDefects))} puntos.`

  elements.impactFpyBefore.textContent = percentageOrDash(impact.baselineFpy)
  elements.impactFpyAfter.textContent = percentageOrDash(impact.fpy)
  elements.impactFpyDelta.textContent = deltaFpy == null
    ? 'Calculado con medias conformes en la primera inspección.'
    : `Variación de la corrida: ${deltaFpy >= 0 ? '+' : '−'}${formatPercentage(Math.abs(deltaFpy))} puntos.`

  elements.impactOeeBefore.textContent = percentageOrDash(impact.baselineOee)
  elements.impactOeeAfter.textContent = percentageOrDash(impact.simulatedOee)
  elements.impactOeeDelta.textContent = deltaOee == null
    ? 'Disponibilidad simulada × rendimiento base × calidad de la corrida.'
    : `Variación simulada: ${deltaOee >= 0 ? '+' : '−'}${formatPercentage(Math.abs(deltaOee))} puntos.`

  elements.impactStopsBefore.textContent = numericOrDash(impact.baselineStopsPer100)
  elements.impactStopsAfter.textContent = numericOrDash(impact.stopsPer100)
  elements.impactStopsDelta.textContent =
    'Antes: eventos históricos reconstruidos; prototipo: paradas de la corrida.'
  elements.impactResponseAfter.textContent = numericOrDash(impact.responseTime, ' s')
  elements.impactRecoveryAfter.textContent = numericOrDash(impact.recoveryTime, ' s')
  elements.impactSegregated.textContent = String(impact.segregated)
  elements.impactCausalMatch.textContent = percentageOrDash(impact.causalRate)

  const badgeClass = impact.sampleSize >= 100
    ? 'validated'
    : impact.sampleSize >= 30
      ? 'preliminary'
      : impact.sampleSize > 0
        ? 'insufficient'
        : 'empty'
  elements.impactValidationBadge.className =
    `impact-validation-badge ${badgeClass}`
  elements.impactValidationBadge.textContent = impact.sampleSize >= 100
    ? `${impact.sampleSize} INSPECCIONES · MUESTRA DE VALIDACIÓN`
    : impact.sampleSize >= 30
      ? `${impact.sampleSize} INSPECCIONES · RESULTADO PRELIMINAR`
      : impact.sampleSize > 0
        ? `${impact.sampleSize} INSPECCIONES · MUESTRA INSUFICIENTE`
        : 'SIN CICLOS INSPECCIONADOS'

  elements.impactMethodNote.textContent = impact.sampleSize < 30
    ? 'Resultado demostrativo de simulación. Se requieren al menos 30 ciclos inspeccionados para una lectura preliminar y datos reales para demostrar impacto industrial.'
    : 'Resultado preliminar de simulación. Debe contrastarse posteriormente con una prueba piloto y datos reales de producción.'
}

function renderStoredCycleTraces() {
  elements.traceabilityTable.innerHTML = ''
  if (!cycleTraceRecords.length) {
    elements.traceabilityTable.innerHTML = `
      <tr class="empty-trace-row">
        <td colspan="8">Inicia el modo autónomo para registrar el primer ciclo trazable.</td>
      </tr>
    `
    updateTraceabilitySummary()
    return
  }
  cycleTraceRecords.slice().reverse().forEach(item => renderCycleTraceRow(item, false))
  updateTraceabilitySummary()
}

function addEvent(scenario, data) {
  const action = elements.automaticControl.checked
    ? data.action
    : 'Sin actuación'

  const criticalScenarios = [
    'brokenThread',
    'jam',
    'brokenNeedle',
    'elasticTrigger'
  ]

  const result = criticalScenarios.includes(scenario)
    ? 'Parada crítica'
    : elements.automaticControl.checked
      ? 'Acción iniciada'
      : 'Pendiente'

  const amef = getAmefEventData(scenario)
  const record = {
    fechaHora: new Date().toISOString(),
    tiempo: elements.simulationTime.textContent,
    maquina: elements.machineSelect.value,
    escenario: scenarioLabels[scenario] || scenario,
    ...amef,
    tension: values.tension.toFixed(1),
    velocidad: Math.round(values.speed),
    vibracion: values.vibration.toFixed(1),
    temperatura: values.temperature.toFixed(1),
    corriente: values.current.toFixed(1),
    presenciaHilo: values.threadPresent ? 'Detectado' : 'No detectado',
    diagnostico: data.diagnosis,
    accion: action,
    resultado: result
  }

  eventRecords.push(record)
  saveEventRecords()
  renderEventRow(record)
}

function addRecoveryEvent(originalScenario, originalData, recoveryTime) {
  const amef = getAmefEventData(originalScenario)
  const record = {
    fechaHora: new Date().toISOString(),
    tiempo: elements.simulationTime.textContent,
    maquina: elements.machineSelect.value,
    escenario: 'Recuperación automática',
    ...amef,
    tension: values.tension.toFixed(1),
    velocidad: Math.round(values.speed),
    vibracion: values.vibration.toFixed(1),
    temperatura: values.temperature.toFixed(1),
    corriente: values.current.toFixed(1),
    presenciaHilo: values.threadPresent ? 'Detectado' : 'No detectado',
    diagnostico: `${originalData.diagnosis} controlada`,
    accion: originalData.action,
    resultado: `Recuperación verificada en ${recoveryTime} s`
  }

  eventRecords.push(record)
  saveEventRecords()
  renderEventRow(record)
}

const visualDefectCatalog = {
  OK: {
    label: 'Sin defecto visible',
    failureId: null,
    action: 'Autorizar el pase de la prenda al área de remallado'
  },
  D01: {
    label: 'Raya vertical',
    failureId: 'F01',
    action: 'Segregar la prenda y revisar el estado de las agujas'
  },
  D03: {
    label: 'Vacío o falta de tejido',
    failureId: 'F03',
    action: 'Segregar la prenda y revisar alimentación y rotura de hilo'
  },
  D04: {
    label: 'Defecto en el elástico',
    failureId: 'F09',
    action: 'Segregar la prenda y revisar el disparador del elástico'
  },
  D06: {
    label: 'Mancha de aceite',
    failureId: 'F12',
    action: 'Segregar la prenda y revisar puntos de lubricación'
  },
  D09: {
    label: 'Tejido incorrecto parcial',
    failureId: 'F07',
    action: 'Segregar la prenda y verificar la tensión del hilo'
  }
}

const YOLO_API_URL = '/api'
let visualImageUrl = null
let visualImageName = ''
let visualImageFile = null
let yoloApiAvailable = false
let riskModelAvailable = false
let latestVisualAssessment = null
let latestRiskAssessment = null
let latestIntegratedDecision = null
let visualBatchFiles = []
let visualBatchIndex = 0
let visualBatchTimer = null
let visualBatchRunning = false
let visualBatchOk = 0
let visualBatchNg = 0
let visualInferenceInProgress = false
let automaticQueueLoaded = false
const automaticImageQueues = {}
const automaticQueuePositions = {}
let currentExpectedClass = null
let currentCausalScenario = null
// Conserva la consecuencia de calidad aunque la avería mecánica ya haya sido
// reparada. Se libera únicamente después de inspeccionar y segregar la media
// que estaba en proceso cuando ocurrió la parada.
let pendingAffectedPiece = null

const expectedDefectLabels = {
  CONFORME: 'Media conforme',
  D01: 'D01 — Raya vertical por posible rotura de aguja',
  D03: 'D03 — Vacío o falta de tejido',
  D04: 'D04 — Defecto en el elástico',
  D06: 'D06 — Mancha de aceite',
  D09: 'D09 — Tejido incorrecto parcial'
}

const scenarioProductMap = {
  normal: { classCode: 'CONFORME', damageProbability: 0 },
  lowTension: { classCode: 'D09', damageProbability: 0.7 },
  highTension: { classCode: 'D09', damageProbability: 0.75 },
  // Una rotura de hilo durante el tejido casi siempre compromete la media que
  // estaba en proceso, aunque el operario restablezca después la máquina.
  brokenThread: { classCode: 'D03', damageProbability: 0.9 },
  jam: { classCode: 'D09', damageProbability: 0.35 },
  brokenNeedle: { classCode: 'D01', damageProbability: 0.95 },
  elasticTrigger: { classCode: 'D04', damageProbability: 0.55 },
  oilStain: { classCode: 'D06', damageProbability: 0.9 }
}

async function loadAutomaticInspectionQueue() {
  if (automaticQueueLoaded || visualBatchFiles.length) return

  try {
    const response = await fetch(`${YOLO_API_URL}/demo/images`)
    if (!response.ok) throw new Error('No se pudo consultar la cola automática')

    const items = await response.json()
    if (!Array.isArray(items) || !items.length) return

    const queueItems = await Promise.all(
      items.map(async item => {
        const imageResponse = await fetch(`${YOLO_API_URL}${item.url}`)
        if (!imageResponse.ok) {
          throw new Error(`No se pudo cargar ${item.filename}`)
        }
        const blob = await imageResponse.blob()
        const fallbackType = item.filename.toLowerCase().endsWith('.png')
          ? 'image/png'
          : 'image/jpeg'
        return {
          classCode: item.class_code || 'CONFORME',
          file: new File([blob], item.filename, {
            type: blob.type || fallbackType
          })
        }
      })
    )

    queueItems.forEach(item => {
      if (!automaticImageQueues[item.classCode]) {
        automaticImageQueues[item.classCode] = []
        automaticQueuePositions[item.classCode] = 0
      }
      automaticImageQueues[item.classCode].push(item.file)
    })

    automaticQueueLoaded = true
    visualBatchIndex = 0
    visualBatchOk = 0
    visualBatchNg = 0
    elements.visualBatchOk.textContent = '0'
    elements.visualBatchNg.textContent = '0'
    elements.visualBatchProgress.textContent = `0 / ${queueItems.length}`
    elements.visualBatchStatus.textContent =
      `Cola causal preparada · ${queueItems.length} medias`
    elements.visualBatchStart.disabled = true
    const initialFile = automaticImageQueues.CONFORME?.[0] || queueItems[0].file
    displayVisualFile(initialFile)
    elements.expectedDefect.textContent = 'Media conforme de referencia'
    elements.causalMatch.textContent =
      'El ciclo autónomo elegirá la imagen según la condición de la máquina.'
  } catch (error) {
    console.warn('No se cargó la cola automática de inspección:', error)
    elements.visualBatchStatus.textContent =
      'Cola automática no disponible · selección manual habilitada'
  }
}

async function checkYoloApi() {
  try {
    const response = await fetch(`${YOLO_API_URL}/health`)
    if (!response.ok) throw new Error('API no disponible')

    const data = await response.json()
    yoloApiAvailable = data.model_loaded === true
    riskModelAvailable = data.risk_model_loaded === true
    elements.yoloApiStatus.className = 'api-status online'
    elements.yoloApiStatus.querySelector('strong').textContent =
      'YOLOv8n conectado · modelo cargado'
    await loadAutomaticInspectionQueue()
  } catch (error) {
    yoloApiAvailable = false
    riskModelAvailable = false
    elements.yoloApiStatus.className = 'api-status offline'
    elements.yoloApiStatus.querySelector('strong').textContent =
      'API YOLO desconectada · inicia FastAPI en el puerto 8000'
  }

  elements.visualAnalyzeButton.disabled =
    !visualImageFile || !yoloApiAvailable
  elements.riskAnalyzeButton.disabled = !riskModelAvailable
  elements.visualBatchStart.disabled =
    !visualBatchFiles.length || !yoloApiAvailable || visualBatchRunning
}

function setRiskProbability(element, valueElement, probability) {
  const percentage = Math.round((Number(probability) || 0) * 1000) / 10
  element.value = percentage
  valueElement.textContent = `${percentage.toFixed(1)} %`
}

function updateIntegratedDecision() {
  if (latestVisualAssessment) {
    elements.decisionVisualEvidence.textContent =
      latestVisualAssessment.hasDefect ? 'Defecto detectado' : 'Prenda conforme'
    elements.decisionVisualDetail.textContent = latestVisualAssessment.hasDefect
      ? `${latestVisualAssessment.codes.join(', ')} · confianza máxima ${latestVisualAssessment.confidence.toFixed(1)} %`
      : 'Sin detecciones por encima del umbral configurado.'
  } else {
    elements.decisionVisualEvidence.textContent = 'Pendiente'
    elements.decisionVisualDetail.textContent =
      'Analiza primero una fotografía con YOLOv8n.'
  }

  if (latestRiskAssessment) {
    elements.decisionRiskEvidence.textContent =
      `Riesgo ${latestRiskAssessment.risk}`
    elements.decisionRiskDetail.textContent =
      `${latestRiskAssessment.targetMonth} · confianza ${latestRiskAssessment.confidence.toFixed(1)} %`
  } else {
    elements.decisionRiskEvidence.textContent = 'Pendiente'
    elements.decisionRiskDetail.textContent =
      'Evalúa primero la máquina con Random Forest.'
  }

  const allFailureCodes = [
    ...(latestVisualAssessment?.failureIds || []),
    ...(latestRiskAssessment?.failureCode
      ? [latestRiskAssessment.failureCode]
      : [])
  ]
  const uniqueFailureCodes = [...new Set(allFailureCodes)]
  const maximumNpr = Math.max(
    latestVisualAssessment?.npr || 0,
    latestRiskAssessment?.npr || 0
  )

  elements.decisionAmefEvidence.textContent = uniqueFailureCodes.length
    ? `${uniqueFailureCodes.join(' / ')} · NPR ${maximumNpr}`
    : 'Pendiente'
  elements.decisionAmefDetail.textContent = uniqueFailureCodes.length
    ? maximumNpr >= 300
      ? 'Criticidad AMEF elevada; la decisión debe escalarse.'
      : 'Criticidad incorporada en la regla de decisión.'
    : 'Se calculará con las fallas asociadas.'

  if (!latestVisualAssessment || !latestRiskAssessment) {
    latestIntegratedDecision = null
    elements.decisionOutputCard.className = 'decision-output-card'
    elements.integratedDecisionStatus.textContent = 'Esperando evidencias'
    elements.integratedDecisionAction.textContent =
      'Ejecuta la inspección visual y la predicción histórica.'
    elements.integratedDecisionReason.textContent =
      'El sistema requiere ambos resultados antes de decidir.'
    elements.registerDecisionButton.disabled = true
    return
  }

  const hasDefect = latestVisualAssessment.hasDefect
  const risk = latestRiskAssessment.risk.toLowerCase()
  let level = 'normal'
  let status = 'Continuar operación'
  let action = 'Autorizar el flujo de la prenda y mantener supervisión periódica.'

  if (!hasDefect && risk === 'medio') {
    level = 'preventive'
    status = 'Inspección preventiva'
    action = 'Continuar con vigilancia y programar una inspección preventiva de la máquina.'
  } else if (!hasDefect && risk === 'alto') {
    level = 'warning'
    status = 'Intervención prioritaria'
    action = 'Programar mantenimiento antes del siguiente periodo y aumentar la frecuencia de inspección.'
  } else if (hasDefect && risk === 'bajo') {
    level = 'warning'
    status = 'Segregar prenda'
    action = 'Segregar la prenda, verificar el punto asociado y continuar bajo observación.'
  } else if (hasDefect && risk === 'medio') {
    level = 'high'
    status = 'Segregar y ajustar'
    action = 'Segregar la prenda, ajustar la máquina e inspeccionar la siguiente unidad producida.'
  } else if (hasDefect && risk === 'alto') {
    level = 'critical'
    status = 'Parada preventiva'
    action = 'Detener la máquina, segregar la prenda y ejecutar inspección y mantenimiento prioritario.'
  }

  if (latestVisualAssessment.codes.includes('D01')) {
    level = 'critical'
    status = 'Parada por posible rotura de aguja'
    action = 'Detener la máquina, segregar la prenda y reemplazar o revisar la aguja antes del reinicio.'
  }

  if (maximumNpr >= 300 && level === 'normal') {
    level = 'preventive'
    status = 'Inspección por criticidad AMEF'
    action = 'Continuar temporalmente y programar inspección prioritaria por NPR elevado.'
  } else if (maximumNpr >= 300 && hasDefect && level !== 'critical') {
    level = 'critical'
    status = 'Parada por criticidad AMEF'
    action = 'Detener temporalmente, segregar la prenda y revisar el modo de falla con NPR elevado.'
  }

  latestIntegratedDecision = {
    level,
    status,
    action,
    maximumNpr,
    failureCodes: uniqueFailureCodes,
    reason:
      `YOLO: ${hasDefect ? 'defecto detectado' : 'sin defecto'}; ` +
      `Random Forest: riesgo ${risk}; AMEF: NPR ${maximumNpr}.`
  }

  updateActiveCycleTrace({
    codigoAmef: uniqueFailureCodes.join(' / ') || 'Sin falla',
    npr: maximumNpr,
    decision: status,
    accion: action
  })

  elements.decisionOutputCard.className =
    `decision-output-card decision-${level}`
  elements.integratedDecisionStatus.textContent = status
  elements.integratedDecisionAction.textContent = action
  elements.integratedDecisionReason.textContent =
    latestIntegratedDecision.reason
  elements.registerDecisionButton.disabled = false
}

function registerIntegratedDecision() {
  if (!latestIntegratedDecision) return

  const visualConfidence = latestVisualAssessment?.confidence || 0
  const riskConfidence = latestRiskAssessment?.confidence || 0
  const modes = [
    ...(latestVisualAssessment?.failureModes || []),
    latestRiskAssessment?.failureMode
  ].filter(Boolean)

  const record = {
    fechaHora: new Date().toISOString(),
    tiempo: elements.simulationTime.textContent,
    maquina: elements.machineSelect.value,
    escenario: 'Decisión conjunta YOLO + Random Forest + AMEF',
    codigoAmef: latestIntegratedDecision.failureCodes.join(' / ') || 'Sin falla',
    modoFalla: [...new Set(modes)].join(' / ') || 'Sin modo de falla',
    npr: latestIntegratedDecision.maximumNpr,
    defectoPotencial: latestVisualAssessment?.hasDefect
      ? latestVisualAssessment.defects.join(' / ')
      : 'Sin defecto visual detectado',
    tension: values.tension.toFixed(1),
    velocidad: Math.round(values.speed),
    vibracion: values.vibration.toFixed(1),
    temperatura: values.temperature.toFixed(1),
    corriente: values.current.toFixed(1),
    presenciaHilo: values.threadPresent ? 'Detectado' : 'No detectado',
    archivoImagen: visualImageName || 'No aplica',
    zonaVisual: 'Fusión de visión, riesgo histórico y AMEF',
    confianzaVisual:
      `YOLO ${visualConfidence.toFixed(1)}% / RF ${riskConfidence.toFixed(1)}%`,
    diagnostico: latestIntegratedDecision.reason,
    accion: latestIntegratedDecision.action,
    resultado: latestIntegratedDecision.status
  }

  eventRecords.push(record)
  saveEventRecords()
  renderEventRow(record)
  elements.registerDecisionButton.disabled = true
  elements.registerDecisionButton.textContent = 'Decisión registrada'
}

async function evaluateMachineRisk() {
  const machineId = elements.machineSelect.value
  if (!machineId) {
    window.alert('Selecciona primero una máquina.')
    return
  }

  elements.riskAnalyzeButton.disabled = true
  elements.riskAnalyzeButton.textContent = 'Evaluando...'
  elements.riskLevel.textContent = 'Procesando'
  elements.riskScope.textContent =
    'Random Forest está analizando el historial mensual de la máquina.'

  try {
    const response = await fetch(`${YOLO_API_URL}/risk/${machineId}`)
    if (!response.ok) {
      const detail = await response.text()
      throw new Error(detail || 'No se pudo ejecutar la predicción')
    }

    const prediction = await response.json()
    const risk = String(prediction.predicted_risk || '').toLowerCase()
    const riskLabel = risk
      ? `${risk.charAt(0).toUpperCase()}${risk.slice(1)}`
      : 'Sin resultado'
    const confidence = Number(prediction.confidence) || 0

    elements.riskSummaryCard.className =
      `risk-summary-card risk-${risk}`
    elements.riskLevel.textContent = riskLabel
    elements.riskScope.textContent = prediction.scope
    elements.riskModel.textContent = prediction.model
    elements.riskSourceMonth.textContent = prediction.source_month
    elements.riskTargetMonth.textContent = prediction.target_month
    elements.riskConfidence.textContent =
      `${(confidence * 100).toFixed(1)} %`
    elements.riskFailure.textContent =
      `${prediction.dominant_failure} — ${prediction.failure_mode} · NPR ${prediction.npr}`
    elements.riskAction.textContent = prediction.recommended_action
    elements.riskNotice.textContent = prediction.notice

    latestRiskAssessment = {
      risk: riskLabel,
      confidence: confidence * 100,
      targetMonth: prediction.target_month,
      failureCode: prediction.dominant_failure,
      failureMode: prediction.failure_mode,
      npr: Number(prediction.npr) || 0
    }
    updateActiveCycleTrace({
      riesgoRF: riskLabel,
      confianzaRF: confidence * 100,
      codigoAmef: prediction.dominant_failure || 'Sin falla',
      npr: Number(prediction.npr) || 0
    })
    updateIntegratedDecision()

    setRiskProbability(
      elements.riskProbLow,
      elements.riskProbLowValue,
      prediction.probabilities.bajo
    )
    setRiskProbability(
      elements.riskProbMedium,
      elements.riskProbMediumValue,
      prediction.probabilities.medio
    )
    setRiskProbability(
      elements.riskProbHigh,
      elements.riskProbHighValue,
      prediction.probabilities.alto
    )

    const record = {
      fechaHora: new Date().toISOString(),
      tiempo: elements.simulationTime.textContent,
      maquina: machineId,
      escenario: 'Predicción histórica Random Forest',
      codigoAmef: prediction.dominant_failure,
      modoFalla: prediction.failure_mode,
      npr: prediction.npr,
      defectoPotencial: `Riesgo operacional ${riskLabel.toLowerCase()}`,
      tension: values.tension.toFixed(1),
      velocidad: Math.round(values.speed),
      vibracion: values.vibration.toFixed(1),
      temperatura: values.temperature.toFixed(1),
      corriente: values.current.toFixed(1),
      presenciaHilo: values.threadPresent ? 'Detectado' : 'No detectado',
      archivoImagen: 'No aplica',
      zonaVisual: 'No aplica',
      confianzaVisual: `${(confidence * 100).toFixed(1)}% (ML)`,
      diagnostico:
        `Riesgo ${riskLabel.toLowerCase()} para ${prediction.target_month}`,
      accion: prediction.recommended_action,
      resultado: `Riesgo ${riskLabel}`
    }

    eventRecords.push(record)
    saveEventRecords()
    renderEventRow(record)
  } catch (error) {
    console.error('Error de predicción de riesgo:', error)
    elements.riskSummaryCard.className = 'risk-summary-card risk-error'
    elements.riskLevel.textContent = 'Error de conexión'
    elements.riskScope.textContent =
      'Verifica que FastAPI esté ejecutándose y que Random Forest esté cargado.'
    await checkYoloApi()
  } finally {
    elements.riskAnalyzeButton.textContent = 'Evaluar con Random Forest'
    elements.riskAnalyzeButton.disabled = !riskModelAvailable
  }
}

function displayVisualFile(file) {
  if (!file) return

  if (visualImageUrl) URL.revokeObjectURL(visualImageUrl)

  visualImageUrl = URL.createObjectURL(file)
  visualImageName = file.name
  visualImageFile = file
  latestVisualAssessment = null
  latestIntegratedDecision = null
  elements.registerDecisionButton.textContent =
    'Registrar decisión conjunta'
  updateIntegratedDecision()
  elements.visualImage.src = visualImageUrl
  elements.visualImage.classList.add('visible')
  elements.visualPlaceholder.classList.add('hidden')
  elements.inspectionRoi.classList.add('visible')
  elements.yoloDetectionLayer.innerHTML = ''
  elements.visualAnalyzeButton.disabled = !yoloApiAvailable
  elements.visualResult.className = 'visual-result'
  elements.visualResultStatus.textContent = 'Imagen preparada'
  elements.visualResultDetail.textContent =
    'Pulsa Analizar con YOLOv8n para ejecutar la inferencia local.'
}

function loadVisualImage(event) {
  const files = [...event.target.files]
  if (!files.length) return

  stopVisualBatch('Lote preparado')
  currentExpectedClass = null
  currentCausalScenario = null
  elements.expectedDefect.textContent = 'Selección manual'
  elements.causalMatch.textContent =
    'No existe una anomalía causal asociada a esta carga manual.'
  visualBatchFiles = files
  visualBatchIndex = 0
  visualBatchOk = 0
  visualBatchNg = 0
  elements.visualBatchOk.textContent = '0'
  elements.visualBatchNg.textContent = '0'
  elements.visualBatchProgress.textContent = `0 / ${files.length}`
  elements.visualBatchStatus.textContent =
    files.length === 1 ? '1 fotografía preparada' : `${files.length} fotografías preparadas`
  elements.visualBatchStart.disabled = !yoloApiAvailable
  displayVisualFile(files[0])
}

function stopVisualBatch(status = 'Lote pausado') {
  clearTimeout(visualBatchTimer)
  visualBatchTimer = null
  visualBatchRunning = false
  elements.visualBatchStatus.textContent = status
  elements.visualBatchStop.disabled = true
  elements.visualBatchStart.disabled =
    !visualBatchFiles.length || !yoloApiAvailable
  elements.visualBatchStart.textContent =
    visualBatchIndex > 0 && visualBatchIndex < visualBatchFiles.length
      ? 'Continuar lote'
      : 'Iniciar lote'
  elements.visualAnalyzeButton.disabled =
    !visualImageFile || !yoloApiAvailable || visualInferenceInProgress
}

function waitForNextVisualBatchImage() {
  const delay = (Number(elements.visualBatchInterval.value) || 5) * 1000
  visualBatchTimer = setTimeout(runNextVisualBatchImage, delay)
}

async function runNextVisualBatchImage() {
  if (!visualBatchRunning) return

  if (visualBatchIndex >= visualBatchFiles.length) {
    visualBatchRunning = false
    elements.visualBatchStatus.textContent = 'Lote finalizado'
    elements.visualBatchStart.textContent = 'Repetir lote'
    elements.visualBatchStart.disabled = false
    elements.visualBatchStop.disabled = true
    elements.visualAnalyzeButton.disabled =
      !visualImageFile || !yoloApiAvailable
    return
  }

  const file = visualBatchFiles[visualBatchIndex]
  displayVisualFile(file)
  elements.visualBatchStatus.textContent =
    `Inspeccionando media ${visualBatchIndex + 1}`

  try {
    await elements.visualImage.decode()
  } catch (error) {
    console.warn('La vista previa todavía no terminó de decodificarse:', error)
  }

  const result = await evaluateVisualImage()
  if (!visualBatchRunning) return

  if (result?.isConforming === true) visualBatchOk += 1
  if (result?.isConforming === false) visualBatchNg += 1

  visualBatchIndex += 1
  elements.visualBatchOk.textContent = String(visualBatchOk)
  elements.visualBatchNg.textContent = String(visualBatchNg)
  elements.visualBatchProgress.textContent =
    `${visualBatchIndex} / ${visualBatchFiles.length}`

  if (visualBatchIndex >= visualBatchFiles.length) {
    runNextVisualBatchImage()
  } else {
    elements.visualBatchStatus.textContent = 'Esperando siguiente media'
    waitForNextVisualBatchImage()
  }
}

function startVisualBatch() {
  if (!visualBatchFiles.length) {
    window.alert('Selecciona primero un lote de fotografías.')
    return
  }

  if (!yoloApiAvailable) {
    window.alert('La API YOLOv8n no está disponible.')
    return
  }

  if (visualBatchIndex >= visualBatchFiles.length) {
    visualBatchIndex = 0
    visualBatchOk = 0
    visualBatchNg = 0
    elements.visualBatchOk.textContent = '0'
    elements.visualBatchNg.textContent = '0'
  }

  visualBatchRunning = true
  elements.visualBatchStart.disabled = true
  elements.visualBatchStop.disabled = false
  elements.visualAnalyzeButton.disabled = true
  runNextVisualBatchImage()
}

function updateVisualConfidence() {
  elements.visualConfidenceValue.textContent =
    elements.visualConfidence.value
}

function drawYoloDetections(detections, imageWidth, imageHeight) {
  elements.yoloDetectionLayer.innerHTML = ''

  const previewRect = document
    .querySelector('#visualPreview')
    .getBoundingClientRect()
  const imageRect = elements.visualImage.getBoundingClientRect()

  detections.forEach(detection => {
    const [x1, y1, x2, y2] = detection.bbox_xyxy
    const box = document.createElement('div')
    box.className = 'yolo-box'
    box.style.left = `${imageRect.left - previewRect.left + (x1 / imageWidth) * imageRect.width}px`
    box.style.top = `${imageRect.top - previewRect.top + (y1 / imageHeight) * imageRect.height}px`
    box.style.width = `${((x2 - x1) / imageWidth) * imageRect.width}px`
    box.style.height = `${((y2 - y1) / imageHeight) * imageRect.height}px`

    const label = document.createElement('span')
    label.textContent =
      `${detection.class_code} · ${(detection.confidence * 100).toFixed(1)}%`
    box.appendChild(label)
    elements.yoloDetectionLayer.appendChild(box)
  })
}

async function evaluateVisualImage() {
  if (!visualImageFile) {
    window.alert('Selecciona primero una fotografía.')
    return
  }

  if (visualInferenceInProgress) return null
  visualInferenceInProgress = true

  elements.visualAnalyzeButton.disabled = true
  elements.visualAnalyzeButton.textContent = 'Analizando...'
  elements.visualResultStatus.textContent = 'Inferencia en curso'
  elements.visualResultDetail.textContent =
    'Python está procesando la fotografía con YOLOv8n.'

  try {
    const threshold = Number(elements.visualConfidence.value) / 100
    const formData = new FormData()
    formData.append('file', visualImageFile)

    const response = await fetch(
      `${YOLO_API_URL}/predict?conf=${threshold}`,
      { method: 'POST', body: formData }
    )

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(detail || 'No se pudo ejecutar la inferencia')
    }

    const prediction = await response.json()
    const detections = prediction.detections
    const isConforming = detections.length === 0
    const result = isConforming ? 'Conforme' : 'No conforme'

    drawYoloDetections(
      detections,
      prediction.image_width,
      prediction.image_height
    )

    const detectedCodes = [
      ...new Set(detections.map(item => item.class_code))
    ]
    const detectedDefects = detectedCodes
      .map(code => visualDefectCatalog[code])
      .filter(Boolean)
    const failureIds = [
      ...new Set(detectedDefects.map(item => item.failureId).filter(Boolean))
    ]
    const failures = failureIds
      .map(id =>
        dicapriData.failures.find(item => item['ID_Falla'] === id)
      )
      .filter(Boolean)
    const topConfidence = detections.length
      ? Math.max(...detections.map(item => item.confidence))
      : 0

    latestVisualAssessment = {
      hasDefect: !isConforming,
      codes: detectedCodes,
      defects: isConforming
        ? ['Sin defecto visual detectado']
        : detections.map(item => item.class_name),
      confidence: topConfidence * 100,
      failureIds,
      failureModes: failures.map(item => item['Modo_falla']),
      npr: failures.length
        ? Math.max(...failures.map(item => Number(item.NPR) || 0))
        : 0,
      expectedClass: currentExpectedClass,
      causalScenario: currentCausalScenario
    }
    updateActiveCycleTrace({
      resultadoYolo: isConforming ? 'Conforme' : 'No conforme',
      clasesYolo: detectedCodes,
      confianzaYolo: topConfidence * 100,
      codigoAmef: failureIds.join(' / ') || activeCycleTrace?.codigoAmef || 'Sin falla',
      npr: failures.length
        ? Math.max(...failures.map(item => Number(item.NPR) || 0))
        : activeCycleTrace?.npr ?? 0
    })
    updateIntegratedDecision()

    elements.visualResult.className =
      `visual-result ${isConforming ? 'conforming' : 'nonconforming'}`
    elements.visualResultStatus.textContent = result
    elements.visualResultDetail.textContent = isConforming
      ? 'YOLOv8n no detectó defectos por encima del umbral configurado.'
      : `${detections.length} detección(es): ${detectedCodes.join(', ')}. ${prediction.recommended_action}`

    if (!isConforming) {
      metrics.totalAnomalies += 1
      updateMetrics()
    }

    const record = {
      fechaHora: new Date().toISOString(),
      tiempo: elements.simulationTime.textContent,
      maquina: elements.machineSelect.value,
      escenario: 'Inferencia real YOLOv8n',
      codigoAmef: failureIds.join(' / ') || 'Sin falla asociada',
      modoFalla:
        failures.map(item => item['Modo_falla']).join(' / ') ||
        'Sin modo de falla asociado',
      npr: failures.length
        ? Math.max(...failures.map(item => Number(item.NPR) || 0))
        : 0,
      defectoPotencial: isConforming
        ? 'Sin defecto detectado'
        : detections.map(item => item.class_name).join(' / '),
      tension: values.tension.toFixed(1),
      velocidad: Math.round(values.speed),
      vibracion: values.vibration.toFixed(1),
      temperatura: values.temperature.toFixed(1),
      corriente: values.current.toFixed(1),
      presenciaHilo: values.threadPresent ? 'Detectado' : 'No detectado',
      archivoImagen: visualImageName,
      zonaVisual: 'Coordenadas calculadas por YOLO',
      confianzaVisual: `${(topConfidence * 100).toFixed(1)}%`,
      diagnostico: isConforming
        ? `Sin detecciones por encima del umbral; esperado: ${currentExpectedClass || 'sin asociación'}`
        : `${detections.length} región(es) detectada(s); esperado: ${currentExpectedClass || 'sin asociación'}`,
      accion: prediction.recommended_action,
      resultado: result
    }

    eventRecords.push(record)
    saveEventRecords()
    renderEventRow(record)
    return { isConforming, prediction }
  } catch (error) {
    console.error('Error de inferencia:', error)
    elements.visualResult.className = 'visual-result nonconforming'
    elements.visualResultStatus.textContent = 'Error de conexión'
    elements.visualResultDetail.textContent =
      'No fue posible comunicarse con la API YOLO. Verifica que FastAPI continúe ejecutándose.'
    await checkYoloApi()
    return null
  } finally {
    visualInferenceInProgress = false
    elements.visualAnalyzeButton.textContent = 'Analizar con YOLOv8n'
    elements.visualAnalyzeButton.disabled =
      !visualImageFile || !yoloApiAvailable || visualBatchRunning
  }
}

function escapeCsvValue(value) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

function exportCsv() {
  if (eventRecords.length === 0) {
    window.alert('Todavía no existen eventos para exportar.')
    return
  }

  const headers = [
    'Fecha y hora',
    'Tiempo',
    'Máquina',
    'Escenario',
    'Código AMEF',
    'Modo de falla',
    'NPR',
    'Defecto potencial',
    'Tensión (cN)',
    'Velocidad (rpm)',
    'Vibración RMS (mm/s)',
    'Temperatura (°C)',
    'Corriente (A)',
    'Presencia de hilo',
    'Archivo de imagen',
    'Zona visual',
    'Confianza visual',
    'Diagnóstico',
    'Acción',
    'Resultado'
  ]

  const rows = eventRecords.map(record => [
    record.fechaHora,
    record.tiempo,
    record.maquina,
    record.escenario,
    record.codigoAmef,
    record.modoFalla,
    record.npr,
    record.defectoPotencial,
    record.tension,
    record.velocidad,
    record.vibracion,
    record.temperatura,
    record.corriente,
    record.presenciaHilo,
    record.archivoImagen,
    record.zonaVisual,
    record.confianzaVisual,
    record.diagnostico,
    record.accion,
    record.resultado
  ])

  const csvContent = [
    headers.map(escapeCsvValue).join(';'),
    ...rows.map(row => row.map(escapeCsvValue).join(';'))
  ].join('\n')

  const blob = new Blob(
    ['\ufeff', csvContent],
    { type: 'text/csv;charset=utf-8;' }
  )

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `resultados-prototipo-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

function exportTraceabilityCsv() {
  if (!cycleTraceRecords.length) {
    window.alert('Todavía no existen ciclos trazables para exportar.')
    return
  }

  const headers = [
    'ID de ciclo', 'Inicio', 'Fin', 'Duración del ciclo (s)',
    'Tiempo simulado inicio', 'Tiempo simulado fin', 'Máquina', 'Escenario',
    'Tensión (cN)', 'Velocidad (RPM)', 'Vibración RMS (mm/s)',
    'Temperatura (°C)', 'Corriente (A)', 'Presencia de hilo',
    'Riesgo Random Forest', 'Confianza RF (%)', 'Defecto esperado',
    'Resultado YOLO', 'Clases YOLO', 'Confianza YOLO (%)',
    'Coincidencia causal', 'Código AMEF', 'NPR', 'Decisión', 'Acción',
    'Intervención', 'Tiempo de intervención (s)', 'Resultado final',
    'Ventana recurrencia', 'Defectos ventana', 'Nivel recurrencia', 'Mantenimiento por recurrencia'
  ]

  const rows = cycleTraceRecords.map(record => {
    const sensors = record.sensores || {}
    return [
      record.idCiclo, record.inicio, record.fin, record.duracionSegundos,
      record.tiempoSimuladoInicio, record.tiempoSimuladoFin,
      record.maquina, record.escenario, sensors.tension, sensors.velocidad,
      sensors.vibracion, sensors.temperatura, sensors.corriente,
      sensors.presenciaHilo, record.riesgoRF, record.confianzaRF,
      record.defectoEsperado, record.resultadoYolo,
      record.clasesYolo?.join(' / '), record.confianzaYolo,
      record.coincidenciaCausal, record.codigoAmef, record.npr,
      record.decision, record.accion, record.intervencion,
      record.tiempoIntervencionSegundos, record.resultadoFinal,
      record.recurrenciaVentana, record.recurrenciaDefectos,
      record.recurrenciaNivel, record.mantenimientoRecurrente
    ]
  })

  const csvContent = [
    headers.map(escapeCsvValue).join(';'),
    ...rows.map(row => row.map(escapeCsvValue).join(';'))
  ].join('\n')
  const blob = new Blob(['\ufeff', csvContent], {
    type: 'text/csv;charset=utf-8;'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `trazabilidad-ciclos-dicapri-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function exportImpactComparisonCsv() {
  const impact = calculateImpactIndicators()
  if (!impact.sampleSize) {
    window.alert('Completa al menos un ciclo con inspección YOLO antes de exportar la comparación.')
    return
  }

  const rows = [
    ['Indicador', 'Antes', 'Con prototipo', 'Unidad', 'Naturaleza del dato'],
    ['Tasa de defectos', impact.baselineDefectRate, impact.defectRate, 'proporción', 'Base reconstruida / corrida simulada'],
    ['FPY', impact.baselineFpy, impact.fpy, 'proporción', 'Derivado de defectos / corrida simulada'],
    ['OEE', impact.baselineOee, impact.simulatedOee, 'proporción', 'Reconstruido / estimado en simulación'],
    ['Disponibilidad', impact.baselineAvailability, impact.simulatedAvailability, 'proporción', 'Reconstruida / estimada en simulación'],
    ['Paradas por 100 ciclos', impact.baselineStopsPer100, impact.stopsPer100, 'eventos', 'Referencia reconstruida / corrida simulada'],
    ['Tiempo medio de respuesta', 'No disponible', impact.responseTime, 'segundos', 'Sin histórico / simulación'],
    ['Tiempo medio de recuperación', 'No disponible', impact.recoveryTime, 'segundos', 'Sin histórico / simulación'],
    ['No conformes segregadas', 'Sin inspección automática', impact.segregated, 'prendas', 'Resultado de simulación'],
    ['Coincidencia anomalía-defecto', 'No disponible', impact.causalRate, 'proporción', 'Resultado de simulación'],
    ['Tamaño de muestra', 'No aplica', impact.sampleSize, 'ciclos inspeccionados', 'Resultado de simulación']
  ]

  const csvContent = rows
    .map(row => row.map(escapeCsvValue).join(';'))
    .join('\n')
  const blob = new Blob(['\ufeff', csvContent], {
    type: 'text/csv;charset=utf-8;'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `comparacion-indicadores-dicapri-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
function startSimulation() {
  if (running) return

  if (hybridMachineLocked) {
    setSystemStatus('critical', 'Reinicio bloqueado')
    setHybridPhase(
      'action',
      'Intervención requerida',
      'Confirma la intervención del operario antes de reiniciar la máquina.'
    )
    return
  }

  running = true
  setSystemStatus('normal', 'Operación en curso')
  elements.actionText.textContent = 'Supervisando variables'

  updateMachineAnimation()

  timer = setInterval(() => {
    seconds += 1
    updateTimer()
    updateValues()
    updateCharts()
  }, 1000)

  if (elements.operationMode.value === 'autonomous') {
    startAutonomousScheduler()
  }
}

function pauseSimulation() {
  stopAutonomousScheduler('Pausado')
  running = false
  clearInterval(timer)
  timer = null
  setSystemStatus('warning', 'Simulación pausada')
  elements.actionText.textContent = 'Simulación detenida temporalmente'
  updateMachineAnimation()
}

function resetSimulation() {
  stopAutonomousScheduler('Detenido')
  cancelScheduledCorrections()
  cancelSimulatedIntervention()
  running = false
  clearInterval(timer)
  timer = null
  seconds = 0
  autonomousCycleCount = 0
  hybridMachineLocked = false
  hybridPhase = 'idle'
  hybridConsecutiveDefects = 0
  hybridValidationRemaining = 0
  pendingAffectedPiece = null
  automaticImageIndex = 0
  machineHealth = 100
  severeMaintenanceEvents = 0
  criticalMaintenanceEvents = 0
  recentMaintenanceEvents = []
  criticalitySequenceIndex = 0
  maintenanceRequired = false
  resetRecurrenceWindow()
  hybridStopReason = ''
  elements.autonomousCycles.textContent = '0 ciclos'
  currentScenario = 'normal'
  metrics.totalAnomalies = 0
  metrics.recoverableEvents = 0
  metrics.controlledEvents = 0
  metrics.criticalStops = 0
  metrics.responseTimes = []
  metrics.recoveryTimes = []

  updateMetrics()

  Object.assign(values, {
    tension: 42,
    speed: 105,
    vibration: 1.8,
    temperature: 38,
    current: 1.1,
    threadPresent: true
  })

  elements.scenarioSelect.value = 'normal'
  elements.anomalyText.textContent = 'Ninguna'
  elements.diagnosisText.textContent = 'Operación sin evaluar'
  elements.actionText.textContent = 'Esperando inicio'
  updateTimer()
  renderValues()
  clearCharts()
  updateMachineAnimation()
  setSystemStatus('normal', 'Sistema preparado')
  setHybridPhase(
    'idle',
    'En espera',
    'Inicia el modo autónomo para coordinar sensores, ML, YOLO y AMEF.'
  )
  updateHybridIndicators()
  updateMaintenanceDashboard()
}

function setAutonomousState(text) {
  elements.autonomousState.textContent = text
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function setHybridPhase(phase, status, detail) {
  hybridPhase = phase
  elements.hybridCycleStatus.textContent = status
  elements.hybridCycleDetail.textContent = detail
  elements.hybridCycleCard.dataset.phase = phase
  document.querySelectorAll('[data-hybrid-step]').forEach(step => {
    step.classList.toggle('active', step.dataset.hybridStep === phase)
    step.classList.toggle('completed', getHybridStepIndex(step.dataset.hybridStep) < getHybridStepIndex(phase))
  })
}

function getHybridStepIndex(step) {
  return ['weaving', 'risk', 'yolo', 'decision', 'action'].indexOf(step)
}

function updateHybridIndicators() {
  elements.hybridConsecutiveDefects.textContent = String(hybridConsecutiveDefects)
  elements.hybridValidationStatus.textContent = hybridValidationRemaining > 0
    ? `${hybridValidationRemaining} media(s) conforme(s) pendiente(s)`
    : 'No requerida'
  elements.hybridLockBadge.textContent = hybridMachineLocked
    ? 'REINICIO BLOQUEADO'
    : 'MÁQUINA LIBERADA'
  elements.hybridLockBadge.classList.toggle('locked', hybridMachineLocked)
  elements.confirmInterventionButton.disabled = !hybridMachineLocked
}

function cancelSimulatedIntervention() {
  clearInterval(simulatedInterventionTimer)
  simulatedInterventionTimer = null
  simulatedInterventionRemaining = 0
  machine3D?.stopIntervention()
  if (elements.interventionStatus) {
    elements.interventionStatus.textContent = 'No requerida'
  }
}

function startSimulatedIntervention() {
  cancelSimulatedIntervention()

  if (!hybridMachineLocked) return
  interventionStartedAt = Date.now()
  updateActiveCycleTrace({ intervencion: 'Requerida' })
  if (elements.interventionMode.value !== 'automatic' || recurrenceMaintenance?.origin === 'Ensayo sintético V18') {
    elements.interventionStatus.textContent = 'Esperando confirmación manual'
    elements.confirmInterventionButton.textContent =
      'Confirmar intervención y validar'
    machine3D?.startIntervention(currentScenario, 0)
    return
  }

  simulatedInterventionRemaining = 5 + Math.floor(Math.random() * 6)
  machine3D?.startIntervention(
    currentScenario,
    simulatedInterventionRemaining
  )
  elements.confirmInterventionButton.textContent = 'Confirmar ahora y validar'

  const renderCountdown = () => {
    elements.interventionStatus.textContent =
      `Operario atendiendo · ${simulatedInterventionRemaining} s`
    elements.actionText.textContent =
      `Intervención simulada en curso · ${simulatedInterventionRemaining} s restantes`
    setAutonomousState(`Intervención del operario · ${simulatedInterventionRemaining} s`)
  }

  renderCountdown()
  simulatedInterventionTimer = setInterval(() => {
    simulatedInterventionRemaining -= 1
    if (simulatedInterventionRemaining <= 0) {
      clearInterval(simulatedInterventionTimer)
      simulatedInterventionTimer = null
      elements.interventionStatus.textContent = 'Corrección terminada'
      confirmHybridIntervention()
      return
    }
    renderCountdown()
  }, 1000)
}

function engageHybridStop(reason, action) {
  hybridMachineLocked = true
  hybridStopReason = reason
  updateActiveCycleTrace({
    decision: 'Parada automática',
    accion: action,
    intervencion: 'Requerida'
  })
  running = false
  clearInterval(timer)
  timer = null
  stopAutonomousScheduler('Parada automática')
  cancelScheduledCorrections()
  if (!['brokenThread', 'jam', 'elasticTrigger'].includes(currentScenario)) {
    metrics.criticalStops += 1
  }
  updateMetrics()
  setSystemStatus('critical', 'Parada automática solicitada')
  elements.actionText.textContent = action
  setHybridPhase('action', 'Parada automática solicitada', reason)
  updateMachineAnimation()
  updateHybridIndicators()
  startSimulatedIntervention()
}

function confirmHybridIntervention() {
  if (!hybridMachineLocked) return

  const interventionSeconds = interventionStartedAt
    ? Math.max(1, Math.round((Date.now() - interventionStartedAt) / 1000))
    : null
  cancelSimulatedIntervention()
  interventionStartedAt = null

  if (interventionCycleId) {
    updateStoredCycleTrace(interventionCycleId, {
      intervencion: 'Completada',
      tiempoIntervencionSegundos: interventionSeconds,
      resultadoFinal: 'Intervención completada; validación pendiente'
    })
    interventionCycleId = null
  }
  if (maintenanceRequired) {
    hybridMachineLocked = true
    hybridValidationRemaining = 0
    elements.anomalyText.textContent = 'Degradación acumulada'
    elements.diagnosisText.textContent = 'La recurrencia y severidad superaron el límite de mantenimiento.'
    elements.actionText.textContent = 'Ejecutar mantenimiento mayor antes de restablecer la simulación.'
    elements.confirmInterventionButton.textContent = 'Mantenimiento requerido'
    setSystemStatus('critical', 'Mantenimiento requerido')
    setAutonomousState('Bloqueada por mantenimiento')
    setHybridPhase('action', 'Mantenimiento requerido',
      'La corrección puntual terminó, pero la máquina permanece bloqueada por degradación acumulada.')
    updateHybridIndicators()
    updateMaintenanceDashboard()
    return
  }
  if (recurrenceMaintenance) {
    recurrenceMaintenance = null
    recurrenceWindow = [] // nueva ventana post-intervención; no mezclar periodos
    renderRecurrence()
  }
  hybridMachineLocked = false
  hybridValidationRemaining = 2
  hybridConsecutiveDefects = 0
  currentScenario = 'normal'
  elements.scenarioSelect.value = 'normal'
  renderAmefScenarioInfo('normal')
  elements.anomalyText.textContent = 'Intervención registrada'
  elements.diagnosisText.textContent = hybridStopReason
  elements.actionText.textContent = 'Validar dos medias consecutivas con YOLO'
  elements.confirmInterventionButton.textContent =
    'Confirmar intervención y validar'
  setHybridPhase(
    'weaving',
    'Reinicio controlado',
    pendingAffectedPiece
      ? 'La máquina fue reparada. Primero se terminará e inspeccionará la media interrumpida; después se exigirán dos medias conformes.'
      : 'La máquina queda en validación hasta obtener dos medias conformes consecutivas.'
  )
  updateHybridIndicators()
  startSimulation()
}

function takeNextCausalImage(classCode) {
  const queue = automaticImageQueues[classCode]
  if (!queue?.length) return null

  const position = automaticQueuePositions[classCode] || 0
  const file = queue[position % queue.length]
  automaticQueuePositions[classCode] = position + 1
  return file
}

async function inspectNextAutomaticImage(classCode = 'CONFORME', scenario = 'normal') {
  if (!yoloApiAvailable) return null

  const file = takeNextCausalImage(classCode)
  if (!file) return null

  automaticImageIndex += 1
  currentExpectedClass = classCode
  currentCausalScenario = scenario
  displayVisualFile(file)
  elements.visualBatchStatus.textContent =
    `Inspección causal · media ${automaticImageIndex} · ${classCode}`
  elements.expectedDefect.textContent =
    expectedDefectLabels[classCode] || classCode
  elements.causalMatch.textContent =
    `Origen: ${scenarioLabels[scenario] || scenario}. Ejecutando YOLO...`
  try {
    await elements.visualImage.decode()
  } catch (error) {
    console.warn('La imagen automática no terminó de decodificarse:', error)
  }
  const result = await evaluateVisualImage()
  if (!result) return null

  const detectedCodes = result.prediction.detections.map(item => item.class_code)
  const causalMatch = classCode === 'CONFORME'
    ? detectedCodes.length === 0
    : detectedCodes.includes(classCode)

  elements.causalMatch.textContent = causalMatch
    ? 'Coherencia confirmada: YOLO coincide con el resultado esperado.'
    : classCode === 'CONFORME'
      ? `Alerta: YOLO indicó ${detectedCodes.join(', ') || 'un resultado no esperado'}.`
      : `Omisión preliminar: se esperaba ${classCode}, pero YOLO no lo confirmó.`

  updateActiveCycleTrace({
    defectoEsperado: expectedDefectLabels[classCode] || classCode,
    coincidenciaCausal: causalMatch ? 'Coincide' : 'No coincide'
  })

  return { ...result, causalMatch, expectedClass: classCode }
}

function applyHybridDecision(immediateStop = false, processAffectedPiece = null) {
  if (immediateStop) {
    engageHybridStop(
      `Los sensores confirmaron ${scenarioLabels[currentScenario].toLowerCase()}.`,
      'PLC simulado: detener máquina y solicitar intervención del operario.'
    )
    return 'stopped'
  }

  if (!latestVisualAssessment) {
    setHybridPhase(
      'action',
      'Inspección visual pendiente',
      'No hay una fotografía disponible. Selecciona previamente un lote para que YOLO inspeccione cada media.'
    )
    return 'pending-image'
  }

  const visualHasDefect = latestVisualAssessment.hasDefect
  const hasDefect = visualHasDefect || Boolean(processAffectedPiece)

  // La reparación corrige la máquina, no la prenda que quedó interrumpida.
  // La decisión operacional se mantiene como no conforme aun si YOLO incurre
  // en un falso negativo; el resultado visual real permanece visible aparte.
  if (processAffectedPiece) {
    hybridConsecutiveDefects = 0
    updateActiveCycleTrace({
      decision: 'Segregar por interrupción del proceso',
      accion: `Separar la media afectada por ${scenarioLabels[processAffectedPiece.scenario] || processAffectedPiece.scenario}; conservar el resultado real de YOLO como evidencia visual.`,
      resultadoFinal: visualHasDefect
        ? 'Media afectada confirmada por YOLO; segregada'
        : 'Media no conforme por interrupción del proceso; YOLO no confirmó el defecto'
    })
    setHybridPhase(
      'action',
      'Prenda afectada segregada',
      visualHasDefect
        ? 'YOLO confirmó el defecto esperado. La media se separa y comienza la validación posterior.'
        : 'YOLO no confirmó visualmente el defecto, pero la media se separa porque sufrió una interrupción crítica durante el tejido.'
    )
    elements.actionText.textContent =
      'Media interrumpida segregada · validar dos prendas posteriores'
    pendingAffectedPiece = null
    updateHybridIndicators()
    return 'segregated-process'
  }

  hybridConsecutiveDefects = hasDefect ? hybridConsecutiveDefects + 1 : 0

  if (hybridValidationRemaining > 0) {
    if (hasDefect) {
      engageHybridStop(
        'La media de validación volvió a presentar un defecto.',
        'Mantener el bloqueo y repetir la intervención técnica.'
      )
      return 'stopped'
    }
    hybridValidationRemaining -= 1
    if (hybridValidationRemaining === 0) {
      metrics.controlledEvents += 1
      updateMetrics()
      setHybridPhase('action', 'Producción liberada', 'Dos medias consecutivas fueron aprobadas por YOLO.')
    }
    updateHybridIndicators()
    return 'validation'
  }

  const criticalDecision = latestIntegratedDecision?.level === 'critical'
  if (criticalDecision || hybridConsecutiveDefects >= 2) {
    engageHybridStop(
      criticalDecision
        ? latestIntegratedDecision.reason
        : 'YOLO detectó dos medias defectuosas consecutivas.',
      latestIntegratedDecision?.action || 'Segregar las prendas y revisar la máquina.'
    )
    return 'stopped'
  }

  setHybridPhase(
    'action',
    hasDefect ? 'Prenda segregada; vigilancia reforzada' : 'Producción autorizada',
    hasDefect
      ? 'El primer defecto aislado se registra; una repetición consecutiva provocará la parada.'
      : 'Los sensores, el modelo predictivo y YOLO permiten continuar el proceso.'
  )
  updateHybridIndicators()
  return 'continue'
}

function renderRecurrence() {
  const summary = recurrenceSummary(recurrenceWindow)
  const labels = { insufficient: 'Muestra incompleta', normal: 'Estable', warning: 'Advertencia', critical: 'Crítico' }
  elements.recurrenceCard.dataset.level = summary.level
  elements.recurrenceLevel.textContent = labels[summary.level]
  elements.recurrenceCount.textContent = `${summary.defects} defectos / ${summary.inspected} inspecciones`
  elements.recurrenceRate.textContent = summary.inspected ? `${(summary.rate * 100).toFixed(1)} %` : '—'
  elements.recurrenceProgress.style.width = `${summary.inspected / WINDOW_SIZE * 100}%`
  elements.recurrenceDetail.textContent = summary.inspected < WINDOW_SIZE
    ? `Se requieren ${WINDOW_SIZE - summary.inspected} inspecciones adicionales para evaluar la ventana completa.`
    : `Defecto predominante: ${summary.dominant ? (expectedDefectLabels[summary.dominant] || summary.dominant) : 'ninguno'}.`
  elements.recurrenceAction.textContent = recurrenceMaintenance
    ? `Intervención solicitada: ${recurrenceMaintenance.action}`
    : summary.level === 'warning'
      ? 'Advertencia: revisar tendencia y parámetros operativos.'
      : summary.level === 'critical'
        ? 'Umbral crítico alcanzado: requiere diagnóstico y parada controlada.'
        : 'Monitoreo de recurrencia activo; umbrales experimentales 3/24 y 6/24.'
}

function registerRecurrenceInspection({ defect, classCode = null, origin = 'YOLO' }) {
  recurrenceWindow.push({ defect: Boolean(defect), classCode: defect ? classCode : null, origin })
  recurrenceWindow = recurrenceWindow.slice(-WINDOW_SIZE)
  const summary = recurrenceSummary(recurrenceWindow)
  updateActiveCycleTrace({
    recurrenciaVentana: summary.inspected,
    recurrenciaDefectos: summary.defects,
    recurrenciaNivel: summary.level
  })
  renderRecurrence()
  if (summary.level === 'critical' && !hybridMachineLocked && !recurrenceMaintenance) {
    const action = recommendedMaintenance(summary.dominant)
    recurrenceMaintenance = { action, dominant: summary.dominant, summary, origin, at: new Date().toISOString() }
    recurrenceInterventions.push(recurrenceMaintenance)
    updateActiveCycleTrace({ mantenimientoRecurrente: action })
    engageHybridStop(
      `Recurrencia crítica: ${summary.defects} defectos en ${WINDOW_SIZE} inspecciones (${(summary.rate * 100).toFixed(1)} %).`,
      action
    )
    renderRecurrence()
  }
  return summary
}

function resetRecurrenceWindow() {
  recurrenceWindow = []
  recurrenceMaintenance = null
  renderRecurrence()
}

function runRecurrenceDemo() {
  if (running || hybridMachineLocked) {
    window.alert('Pausa la simulación y resuelve cualquier intervención antes de iniciar el ensayo controlado.')
    return
  }
  // No se crean registros falsos de producción ni de YOLO: es un escenario separado.
  resetRecurrenceWindow()
  for (let i = 0; i < 24; i += 1) {
    registerRecurrenceInspection({ defect: i < 8, classCode: i < 8 ? 'D09' : null, origin: 'Ensayo sintético V18' })
  }
}

function stopAutonomousScheduler(state = 'Detenido') {
  clearTimeout(autonomousTimer)
  autonomousTimer = null
  autonomousCycleInProgress = false
  setAutonomousState(state)
}

function selectAutonomousScenario() {
  if (elements.anomalyFrequency.value === 'criticality') {
    const scenario = criticalitySequence[criticalitySequenceIndex % criticalitySequence.length]
    criticalitySequenceIndex += 1
    return scenario
  }
  const risk = latestRiskAssessment?.risk?.toLowerCase() || 'medio'
  const baseProbability = Number(elements.anomalyFrequency.value) || 0.0412
  const riskMultiplier = risk === 'alto' ? 1.35 : risk === 'bajo' ? 0.75 : 1
  const anomalyProbability = Math.min(0.8, baseProbability * riskMultiplier)

  if (Math.random() >= anomalyProbability) return 'normal'

  const weightedScenarios = [
    { scenario: 'brokenThread', weight: 30, critical: true },
    { scenario: 'lowTension', weight: 16, critical: false },
    { scenario: 'highTension', weight: 8, critical: false },
    { scenario: 'jam', weight: 14, critical: true },
    { scenario: 'brokenNeedle', weight: 12, critical: true },
    { scenario: 'elasticTrigger', weight: 12, critical: true },
    { scenario: 'oilStain', weight: 8, critical: false }
  ].map(item => ({
    ...item,
    weight: item.weight * (
      risk === 'alto' && item.critical
        ? 1.4
        : risk === 'bajo' && item.critical
          ? 0.75
          : 1
    )
  }))

  const totalWeight = weightedScenarios.reduce(
    (sum, item) => sum + item.weight,
    0
  )
  let draw = Math.random() * totalWeight

  for (const item of weightedScenarios) {
    draw -= item.weight
    if (draw <= 0) return item.scenario
  }

  return 'lowTension'
}

function updateMaintenanceDashboard() {
  const recentAnomalies = recentMaintenanceEvents.filter(item => item.points > 0).length
  let level = 'stable'
  let status = 'Condición estable'
  let recommendation = 'Continuar operación y supervisión rutinaria.'
  if (criticalMaintenanceEvents >= 2 || machineHealth <= 40) {
    level = 'critical'
    status = 'Mantenimiento requerido'
    recommendation = 'Detener la máquina y ejecutar mantenimiento antes de reiniciar.'
    maintenanceRequired = true
  } else if (severeMaintenanceEvents >= 2 || machineHealth <= 65) {
    level = 'warning'
    status = 'Programar mantenimiento'
    recommendation = 'Programar mantenimiento preventivo y reforzar la inspección.'
  } else if (recentAnomalies >= 2 || machineHealth <= 80) {
    level = 'watch'
    status = 'Máquina bajo observación'
    recommendation = 'Supervisar variables críticas y recurrencia de fallas.'
  }
  elements.machineHealthValue.textContent = Math.round(machineHealth) + ' %'
  elements.machineHealthBar.style.width = machineHealth + '%'
  elements.maintenanceStatus.textContent = status
  elements.maintenanceEventCount.textContent =
    severeMaintenanceEvents + ' severos · ' + criticalMaintenanceEvents + ' críticos'
  elements.maintenanceRecommendation.textContent = recommendation
  elements.maintenanceHealthCard.dataset.level = level
  elements.criticalityNotice.hidden = elements.anomalyFrequency.value !== 'criticality'
}

function registerMaintenanceImpact(scenario) {
  const points = maintenanceSeverityPoints[scenario] ?? 0
  if (points <= 0) {
    updateMaintenanceDashboard()
    return
  }
  machineHealth = Math.max(0, machineHealth - points)
  if (points >= 6) severeMaintenanceEvents += 1
  if (points >= 10) criticalMaintenanceEvents += 1
  recentMaintenanceEvents.push({ scenario, points, cycle: autonomousCycleCount + 1 })
  recentMaintenanceEvents = recentMaintenanceEvents.slice(-10)
  updateMaintenanceDashboard()
}

function scheduleNextAutonomousCycle(delaySeconds) {
  clearTimeout(autonomousTimer)
  autonomousTimer = setTimeout(runAutonomousCycle, delaySeconds * 1000)
}

async function runAutonomousCycle() {
  if (!running || elements.operationMode.value !== 'autonomous') return

  if (hybridMachineLocked) {
    setAutonomousState('Reinicio bloqueado')
    updateHybridIndicators()
    return
  }

  if (autonomousCycleInProgress || correctionInProgress) {
    setAutonomousState('Esperando corrección')
    scheduleNextAutonomousCycle(3)
    return
  }

  autonomousCycleInProgress = true
  setAutonomousState('Produciendo media')
  startCycleTrace()
  latestVisualAssessment = null
  latestIntegratedDecision = null

  try {
    setHybridPhase(
      'weaving',
      'Media en proceso',
      'Los sensores virtuales supervisan el tejido en tiempo real.'
    )

    if (riskModelAvailable) {
      setAutonomousState('Evaluando riesgo')
      setHybridPhase(
        'risk',
        'Evaluando riesgo operacional',
        'Random Forest analiza el historial de la máquina antes de finalizar el ciclo.'
      )
      await evaluateMachineRisk()
    }

    const affectedPieceContext = pendingAffectedPiece
    const scenario = affectedPieceContext || hybridValidationRemaining > 0
      ? 'normal'
      : selectAutonomousScenario()
    elements.scenarioSelect.value = scenario
    currentScenario = scenario
    registerMaintenanceImpact(scenario)
    updateActiveCycleTrace({
      escenario: affectedPieceContext
        ? `Reanudación tras ${scenarioLabels[affectedPieceContext.scenario] || affectedPieceContext.scenario}`
        : scenarioLabels[scenario] || scenario,
      sensores: sensorSnapshot()
    })
    setAutonomousState(`Ejecutando ${scenarioLabels[scenario]}`)
    applyScenario()
    await wait(1800)

    autonomousCycleCount += 1
    elements.autonomousCycles.textContent =
      `${autonomousCycleCount} ciclo${autonomousCycleCount === 1 ? '' : 's'}`

    const productEffect = scenarioProductMap[scenario] || scenarioProductMap.normal
    const anomalyAffectedPiece = affectedPieceContext
      ? true
      : scenario === 'normal' || Math.random() < productEffect.damageProbability
    const expectedClass = affectedPieceContext
      ? affectedPieceContext.classCode
      : anomalyAffectedPiece
        ? productEffect.classCode
        : 'CONFORME'
    const causalScenario = affectedPieceContext?.scenario || scenario
    updateActiveCycleTrace({
      defectoEsperado: expectedDefectLabels[expectedClass] || expectedClass
    })
    const immediateStop = ['brokenThread', 'jam', 'elasticTrigger'].includes(scenario)

    if (immediateStop) {
      if (anomalyAffectedPiece) {
        pendingAffectedPiece = {
          scenario,
          classCode: expectedClass,
          registeredAtCycle: autonomousCycleCount
        }
        elements.expectedDefect.textContent =
          expectedDefectLabels[expectedClass] || expectedClass
        elements.causalMatch.textContent =
          'Prenda interrumpida: se inspeccionará automáticamente después de la reparación.'
        updateActiveCycleTrace({
          resultadoYolo: 'Pendiente post-intervención',
          clasesYolo: [],
          coincidenciaCausal: 'Inspección pendiente después de reparar',
          resultadoFinal: 'Máquina detenida; prenda afectada pendiente'
        })
      } else {
        currentExpectedClass = null
        currentCausalScenario = scenario
        elements.expectedDefect.textContent = 'Sin media terminada'
        elements.causalMatch.textContent =
          'La protección detuvo la máquina antes de completar una prenda defectuosa.'
        updateActiveCycleTrace({
          resultadoYolo: 'No aplica',
          clasesYolo: [],
          coincidenciaCausal: 'Parada antes de completar la prenda'
        })
      }
      applyHybridDecision(true)
      return
    }

    if (elements.autonomousYolo.checked && yoloApiAvailable) {
      setAutonomousState('Analizando con YOLOv8n')
      setHybridPhase(
        'yolo',
        affectedPieceContext
          ? 'Media interrumpida terminada: inspección YOLO'
          : 'Media terminada: inspección YOLO',
        `Resultado esperado por el proceso: ${expectedDefectLabels[expectedClass]}.`
      )
      await inspectNextAutomaticImage(expectedClass, causalScenario)

      setHybridPhase(
        'decision',
        'Fusionando evidencias',
        'El sistema combina sensores, Random Forest, YOLO y criticidad AMEF.'
      )
      if (latestIntegratedDecision) {
        registerIntegratedDecision()
      }
    } else {
      latestVisualAssessment = null
    }

    if (scenario === 'brokenNeedle') {
      engageHybridStop(
        'Los sensores identificaron una rotura de aguja; la inspección de la media ya fue ejecutada.',
        'Detener la máquina, segregar la prenda y solicitar al operario el reemplazo de la aguja.'
      )
      setAutonomousState('Cambio de aguja requerido')
      return
    }

    const wasValidationCycle = hybridValidationRemaining > 0
    const outcome = applyHybridDecision(false, affectedPieceContext)
    // Solo observaciones efectivas de YOLO, sin contar defectos esperados como detecciones.
    if (!hybridMachineLocked && !affectedPieceContext && !wasValidationCycle &&
        latestVisualAssessment && typeof latestVisualAssessment.hasDefect === 'boolean') {
      const firstDetectedClass = latestVisualAssessment.hasDefect
        ? (activeCycleTrace?.clasesYolo?.[0] || null)
        : null
      registerRecurrenceInspection({
        defect: latestVisualAssessment.hasDefect,
        classCode: firstDetectedClass,
        origin: 'YOLO'
      })
    }
    updateActiveCycleTrace({
      resultadoFinal: hybridMachineLocked || outcome === 'stopped'
        ? 'Producción detenida'
        : outcome === 'segregated-process'
          ? activeCycleTrace?.resultadoFinal || 'Media afectada segregada'
        : outcome === 'pending-image'
          ? affectedPieceContext
            ? 'Media afectada pendiente de inspección YOLO'
            : 'Ciclo pendiente de inspección YOLO'
        : latestVisualAssessment?.hasDefect
          ? 'Media segregada'
          : 'Producción autorizada'
    })
    setAutonomousState(hybridMachineLocked || outcome === 'stopped' ? 'Parada automática' : 'Supervisando')
  } finally {
    if (activeCycleTrace) {
      const finalResult = hybridMachineLocked
        ? 'Detenida; intervención requerida'
        : activeCycleTrace.resultadoFinal === 'En proceso'
          ? activeCycleTrace.resultadoYolo === 'Conforme'
            ? 'Media conforme; producción autorizada'
            : activeCycleTrace.resultadoYolo === 'No conforme'
              ? 'Media no conforme; segregada'
              : 'Ciclo completado sin inspección visual'
          : activeCycleTrace.resultadoFinal
      const completedTrace = finalizeCycleTrace(finalResult)
      if (hybridMachineLocked && completedTrace) {
        interventionCycleId = completedTrace.idCiclo
      }
    }
    autonomousCycleInProgress = false
    if (running && !hybridMachineLocked && elements.operationMode.value === 'autonomous') {
      scheduleNextAutonomousCycle(
        Number(elements.autonomousInterval.value) || 25
      )
    }
  }
}

function startAutonomousScheduler() {
  if (hybridMachineLocked) {
    setAutonomousState('Reinicio bloqueado')
    return
  }
  stopAutonomousScheduler('Preparando ciclo')
  elements.automaticControl.checked = true
  scheduleNextAutonomousCycle(2)
}

function updateOperationMode() {
  const autonomous = elements.operationMode.value === 'autonomous'
  elements.autonomousOptions.classList.toggle('visible', autonomous)
  elements.scenarioSelect.disabled = autonomous
  elements.applyScenarioButton.disabled = autonomous
  elements.startButton.textContent = autonomous
    ? 'Iniciar ciclo autónomo'
    : 'Iniciar operación'

  if (!autonomous) {
    stopAutonomousScheduler('Detenido')
  } else if (running) {
    startAutonomousScheduler()
  }
}

function clearEventHistory() {
  const confirmed = window.confirm(
    '¿Deseas eliminar definitivamente el historial de eventos y la trazabilidad por ciclo?'
  )

  if (!confirmed) return

  eventRecords = []
  cycleTraceRecords = []
  activeCycleTrace = null
  interventionCycleId = null
  resetRecurrenceWindow()
  recurrenceInterventions = []
  localStorage.removeItem(EVENT_STORAGE_KEY)
  localStorage.removeItem(TRACE_STORAGE_KEY)
  elements.eventTable.innerHTML = `
    <tr class="empty-row">
      <td colspan="8">Todavía no se han registrado eventos.</td>
    </tr>
  `
  renderStoredCycleTraces()
}

elements.recurrenceDemo.addEventListener('click', runRecurrenceDemo)
elements.recurrenceClear.addEventListener('click', () => {
  if (hybridMachineLocked) return window.alert('Confirma primero la intervención pendiente.')
  resetRecurrenceWindow()
})
elements.startButton.addEventListener('click', startSimulation)
elements.themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark'
    ? 'light'
    : 'dark'
  applyTheme(nextTheme)
})
elements.pauseButton.addEventListener('click', pauseSimulation)
elements.resetButton.addEventListener('click', resetSimulation)
elements.applyScenarioButton.addEventListener('click', applyScenario)
elements.exportButton.addEventListener('click', exportCsv)
elements.exportTraceButton.addEventListener('click', exportTraceabilityCsv)
elements.exportImpactButton.addEventListener('click', exportImpactComparisonCsv)
elements.openModelComparisonButton.addEventListener('click', () => {
  elements.modelComparisonDialog.showModal()
})
elements.closeModelComparisonButton.addEventListener('click', () => {
  elements.modelComparisonDialog.close()
})
elements.closeModelComparisonFooterButton.addEventListener('click', () => {
  elements.modelComparisonDialog.close()
})
elements.modelComparisonDialog.addEventListener('click', event => {
  if (event.target === elements.modelComparisonDialog) {
    elements.modelComparisonDialog.close()
  }
})
elements.clearHistoryButton.addEventListener('click', clearEventHistory)
elements.visualImageInput.addEventListener('change', loadVisualImage)
elements.visualConfidence.addEventListener('input', updateVisualConfidence)
elements.visualAnalyzeButton.addEventListener('click', evaluateVisualImage)
elements.visualBatchStart.addEventListener('click', startVisualBatch)
elements.visualBatchStop.addEventListener(
  'click',
  () => stopVisualBatch('Lote pausado')
)
elements.riskAnalyzeButton.addEventListener('click', evaluateMachineRisk)
elements.registerDecisionButton.addEventListener(
  'click',
  registerIntegratedDecision
)
elements.confirmInterventionButton.addEventListener(
  'click',
  confirmHybridIntervention
)
elements.operationMode.addEventListener('change', updateOperationMode)
elements.interventionMode.addEventListener('change', () => {
  if (!hybridMachineLocked) return
  startSimulatedIntervention()
})
elements.anomalyFrequency.addEventListener('change', () => {
  if (elements.anomalyFrequency.value === 'criticality') {
    elements.autonomousInterval.value = '8'
  }
  updateMaintenanceDashboard()
})
elements.machineSelect.addEventListener('change', event => {
  resetRecurrenceWindow()
  renderMachineData(event.target.value)
  latestRiskAssessment = null
  latestIntegratedDecision = null
  elements.riskSummaryCard.className = 'risk-summary-card'
  elements.riskLevel.textContent = 'Sin evaluar'
  elements.riskScope.textContent =
    'Ejecuta una nueva predicción para la máquina seleccionada.'
  elements.registerDecisionButton.textContent =
    'Registrar decisión conjunta'
  updateIntegratedDecision()
})
elements.scenarioSelect.addEventListener('change', () => {
  currentScenario = elements.scenarioSelect.value
  renderAmefScenarioInfo(currentScenario)
})

const machine3D = initMachine3D('#machine3dCanvas')

// V20: escenarios coordinados con el banco 3D principal; resultados sintéticos separados de YOLO.
const labConfig = {
  needles: { name: 'Desgaste de agujas', code: 'brokenNeedle', defect: 'Huecos', action: 'Inspeccionar agujas; sustituir las dañadas si se confirma desgaste.' },
  tension: { name: 'Desajuste de tensión', code: 'highTension', defect: 'Tensión irregular', action: 'Revisar y ajustar tensores según especificaciones.' },
  thread: { name: 'Rotura recurrente de hilo', code: 'brokenThread', defect: 'Hilo suelto', action: 'Revisar guías, alimentación y fricción del hilo.' },
  oil: { name: 'Contaminación por lubricante', code: 'oilStain', defect: 'Manchas', action: 'Inspeccionar fugas y lubricación; limpiar y verificar.' },
  recurrent: { name: 'Recurrencia 6–9/24', code: 'brokenNeedle', defect: 'Defectos recurrentes', action: 'Inspeccionar el origen predominante de los defectos.' },
  mechanical: { name: 'Deterioro mecánico', code: 'jam', defect: 'Anomalía mecánica', action: 'Revisar vibración y temperatura; diagnóstico por personal autorizado.' },
  relapse: { name: 'Reaparición del defecto', code: 'highTension', defect: 'Recurrencia tras ajuste', action: 'Reevaluar causa raíz; no liberar sin verificación.' }
}
const lab = Object.fromEntries(['Scenario','Escalation','Mode','Start','Next','Stop','Export','Phase','Actor','Narrative','Units','Defects','Escalations','Stops','Results'].map(k => [k, document.querySelector('#lab'+k)]))
let labRun = null
let labTimer = null
let labEvents = []
const labSteps = [
  { phase:'Producción', units:8, defects:1, actor:'Sistema', text:'La máquina produce con anomalías incipientes.' },
  { phase:'Advertencia', units:15, defects:4, actor:'Sistema', text:'Se observa recurrencia. Se eleva la criticidad y se recomienda inspección.' },
  { phase:'Parada controlada', units:24, defects:8, actor:'Sistema', text:'8 defectos en 24 piezas (33,3 %). Umbral experimental superado; se solicita parada.' },
  { phase:'Operario principal', units:24, defects:8, actor:'Operario', text:'El operario se aproxima y realiza un ajuste básico autorizado.' },
  { phase:'Evaluación de primera intervención', units:24, defects:8, actor:'Sistema', text:'Se comprueba el resultado de la intervención inicial.' },
  { phase:'Jefe de planta', units:24, defects:8, actor:'Jefe de planta', text:'Se activa escalamiento. El jefe de planta acude, evalúa y coordina una intervención especializada.' },
  { phase:'Verificación posterior', units:24, defects:8, actor:'Sistema', text:'Se comprueba la recuperación; la intervención no implica eficacia garantizada.' },
  { phase:'Resultados AS-IS / TO-BE', units:48, defects:8, actor:'Sistema', text:'Se comparan resultados hipotéticos bajo condiciones compartidas.' }
]
function labRecord(phase, detail) {
  labEvents.push({ momento: new Date().toISOString(), escenario: labRun?.config.name || '', fase: phase, responsable: lab.Actor.textContent, detalle: detail, origen: 'SIMULACIÓN SINTÉTICA V20' })
}
function labResetActors() { machine3D?.stopIntervention(); machine3D?.stopSupervisorIntervention() }
function labStopRun(message = 'Simulación detenida') {
  clearTimeout(labTimer); labTimer = null
  labResetActors()
  machine3D?.setProcessState({running:false,scenario:'normal'})
  labRun = null
  lab.Phase.textContent = message
  lab.Next.disabled = true
  lab.Start.disabled = false
}
function labAdvance() {
  if (!labRun) return
  const run = labRun
  run.index++
  if (run.index >= labSteps.length) { labStopRun('Escenario completado'); return }
  let step = labSteps[run.index]
  if (step.phase === 'Jefe de planta' && run.outcome === 'success') { run.index++; step = labSteps[run.index] }
  labResetActors()
  const isProducing = run.index < 2 || step.phase === 'Verificación posterior'
  machine3D?.setProcessState({running:isProducing,scenario:isProducing ? run.config.code : 'normal',vibration:run.config.code === 'jam' ? 6 : 2})
  machine3D?.setRPM(isProducing ? 105 : 0)
  let detail = step.text
  if (step.phase === 'Operario principal') {
    machine3D?.startIntervention(run.config.code, 8)
    detail += ' ' + run.config.action
  }
  if (step.phase === 'Evaluación de primera intervención') {
    detail = run.outcome === 'failed' ? 'La anomalía persiste. Se solicita apoyo del jefe de planta; máquina detenida.' : 'El ajuste fue eficaz en el modelo. Se procede a verificar antes de liberar.'
  }
  if (step.phase === 'Jefe de planta') {
    machine3D?.startSupervisorIntervention(8)
    lab.Escalations.textContent = '1'
    detail += ' ' + run.config.action
  }
  if (step.phase === 'Verificación posterior') {
    detail = run.outcome === 'failed' ? 'Después de la intervención especializada, se simula una prueba de recuperación. La liberación exige criterios de conformidad.' : 'El operario completó el ajuste. Se simula una prueba de recuperación y reinspección.'
  }
  if (step.phase === 'Resultados AS-IS / TO-BE') {
    // Supuesto didáctico explícito: segundo lote de 24, sin acción 8 defectos; con acción 2.
    const asIs = 8 + 8, toBe = 8 + 2
    lab.Results.textContent = `COMPARACIÓN ILUSTRATIVA (48 PIEZAS): AS-IS ${asIs} defectos (33,3 %) · TO-BE ${toBe} defectos (20,8 %) · reducción relativa hipotética ${((asIs-toBe)/asIs*100).toFixed(1)} %. Supuestos: segundo lote sin intervención 8 defectos, con intervención eficaz 2. NO es un resultado validado ni una medición real.`
    detail = 'Se completó una comparación ilustrativa; no se ha demostrado reducción real.'
  }
  lab.Phase.textContent = step.phase
  lab.Actor.textContent = step.actor
  lab.Narrative.textContent = detail
  lab.Units.textContent = String(step.units)
  lab.Defects.textContent = String(step.defects)
  lab.Stops.textContent = run.index >= 2 ? '1' : '0'
  labRecord(step.phase, detail)
  if (run.mode === 'auto') labTimer = setTimeout(labAdvance, step.phase === 'Operario principal' || step.phase === 'Jefe de planta' ? 8500 : 2800)
}
lab.Start.addEventListener('click', () => {
  if (labRun) labStopRun('Escenario reiniciado')
  const config = labConfig[lab.Scenario.value]
  labRun = { config, outcome: lab.Escalation.value, mode: lab.Mode.value, index: -1 }
  labEvents = []
  lab.Escalations.textContent = '0'
  lab.Stops.textContent = '0'
  lab.Results.textContent = 'Comparación pendiente. Los valores son supuestos de demostración.'
  machine3D?.setProcessState({running:true,scenario:config.code,vibration:2})
  document.querySelector('#machine3dCanvas')?.scrollIntoView({behavior:'smooth',block:'center'})
  lab.Start.disabled = true
  lab.Next.disabled = labRun.mode !== 'guided'
  labAdvance()
})
lab.Next.addEventListener('click', () => { if (labRun?.mode === 'guided') labAdvance() })
lab.Stop.addEventListener('click', () => labStopRun())
lab.Export.addEventListener('click', () => {
  if (!labEvents.length) { lab.Narrative.textContent = 'Primero ejecuta un escenario para exportar eventos.'; return }
  const columns = ['momento','escenario','fase','responsable','detalle','origen']
  const csv = [columns.join(';'), ...labEvents.map(row => columns.map(col => '"' + String(row[col] || '').replaceAll('"','""') + '"').join(';'))].join('\r\n')
  const url = URL.createObjectURL(new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'}))
  const a = document.createElement('a'); a.href = url; a.download = 'dicapri_v20_escenario_sintetico.csv'; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
})


applyTheme(initialTheme, false)
updateOperationMode()
updateHybridIndicators()
updateMaintenanceDashboard()
renderRecurrence()
renderValues()
renderStoredEvents()
renderStoredCycleTraces()
loadDicapriData()
loadModelComparison()
checkYoloApi()

// V20.4 — Episodios de deterioro y sensibilidad: producción fija y horizonte fijo.
const experimentPanel=document.createElement('section')
experimentPanel.className='panel validation-experiment-panel'
experimentPanel.innerHTML=`
  <div class="panel-heading"><span>V20.4</span><div><h2>Validación experimental AS-IS / TO-BE</h2><p>Simulación sintética exploratoria; NO son mediciones de Dicapri.</p></div></div>
  <div class="validation-experiment-controls">
    <label>Escenario de deterioro <select id="expScenario"><option value="normal">Habitual (pocos episodios)</option><option value="mixed" selected>Mixto (exploratorio)</option><option value="critical">Estrés crítico (episodios frecuentes)</option></select></label>
    <label>Diseño experimental <select id="expMode"><option value="fixed_units">Producción fija (mismas medias)</option><option value="fixed_time">Horizonte fijo (mismos ciclos)</option></select></label>
    <label><span id="expUnitsLabel">Medias por política</span><input id="expUnits" type="number" min="100" max="100000" value="1200"></label>
    <label>Réplicas <input id="expReplicas" type="number" min="2" max="1000" value="30"></label>
    <label>Semilla <input id="expSeed" type="number" min="0" max="4294967295" value="20261025"></label>
    <label>Umbral defectos / 24 <input id="expThreshold" type="number" min="1" max="24" value="6"></label>
    <label>Eficacia operario (%) <input id="expOperator" type="number" min="0" max="100" value="55"></label>
    <label>Eficacia jefe de planta (%) <input id="expSupervisor" type="number" min="0" max="100" value="83"></label>
    <label>Frecuencia incidentes (%) <input id="expIncident" type="number" min="0" max="100" step="0.01" value="0.4"></label>
    <label>Defecto base (%) <input id="expBaseDefect" type="number" min="0" max="100" step="0.01" value="2.5"></label>
    <label>Incremento de desgaste por ciclo <input id="expWearStep" type="number" min="0" max="0.1" step="0.001" value="0.006"></label>
    <label>Recuperación natural por ciclo <input id="expNaturalRecovery" type="number" min="0" max="0.1" step="0.001" value="0.007"></label>
    <label>Duración parada crítica (ciclos) <input id="expCritical" type="number" min="1" max="10000" value="144"></label>
  </div>
  <div class="validation-experiment-actions"><button type="button" id="expRun">Ejecutar réplicas comparables</button><button type="button" id="expExport" disabled>Exportar CSV de corridas</button></div>
  <div class="validation-experiment-actions"><button type="button" id="expCalibrate">Calibrar incidentes a 3,08 % (exploratorio)</button><button type="button" id="expSensitivity">Analizar sensibilidad (12 escenarios)</button><button type="button" id="expSensitivityExport" disabled>Exportar sensibilidad CSV</button></div>
  <div id="expCalibration" class="validation-experiment-note">Referencia reconstruida AS-IS: 3,08 %. Ajuste exploratorio de un parámetro; no es validación empírica.</div>
  <div id="expSensitivityResult" aria-live="polite"></div>
  <div id="expResult" aria-live="polite">Selecciona la modalidad y ejecuta las réplicas. Parámetros sin calibración empírica.</div>
  <p class="validation-experiment-note">Producción fija: se fabrican las mismas unidades y se compara tiempo, defectos y paradas. Horizonte fijo: se ejecutan los mismos ciclos y se comparan producción, tasa de defectos y paradas. Se utilizan los mismos eventos aleatorios por índice de unidad; las pausas no consumen eventos productivos. Los ciclos NO equivalen a horas. IC normal aproximado al 95 % de diferencias pareadas, no evidencia de eficacia real.</p>
`
const mainArea=document.querySelector('.app-shell')
mainArea?.append(experimentPanel)
let experimentRows=[]
const expField=id=>document.getElementById(id)
expField('expScenario').addEventListener('change',()=>{experimentRows=[];expField('expExport').disabled=true;expField('expResult').textContent='Escenario cambiado: ejecuta las réplicas nuevamente.'})
expField('expMode').addEventListener('change',()=>{
  expField('expUnitsLabel').textContent=expField('expMode').value==='fixed_units'?'Medias por política':'Ciclos por política'
  expField('expResult').textContent='Modalidad cambiada: ejecuta nuevamente para actualizar los resultados.'
  expField('expExport').disabled=true
  experimentRows=[]
})
expField('expRun').addEventListener('click',()=>{
  const p={...DEFAULT_PARAMS,mode:expField('expMode').value,scenario:expField('expScenario').value,units:Number(expField('expUnits').value),replicates:Number(expField('expReplicas').value),seed:Number(expField('expSeed').value),threshold:Number(expField('expThreshold').value),operatorEfficacy:Number(expField('expOperator').value)/100,supervisorEfficacy:Number(expField('expSupervisor').value)/100,criticalDuration:Number(expField('expCritical').value),incidentRate:Number(expField('expIncident').value)/100,baseDefect:Number(expField('expBaseDefect').value)/100}
  if(!Number.isInteger(p.units)||p.units<100||p.units>100000||!Number.isInteger(p.replicates)||p.replicates<2||p.replicates>1000||!Number.isInteger(p.seed)||p.seed<0||p.seed>4294967295||!Number.isInteger(p.threshold)||p.threshold<1||p.threshold>24||!Number.isFinite(p.operatorEfficacy)||p.operatorEfficacy<0||p.operatorEfficacy>1||!Number.isFinite(p.supervisorEfficacy)||p.supervisorEfficacy<0||p.supervisorEfficacy>1||!Number.isFinite(p.incidentRate)||p.incidentRate<0||p.incidentRate>1||!Number.isFinite(p.baseDefect)||p.baseDefect<0||p.baseDefect>1||!Number.isFinite(p.wearStep)||p.wearStep<0||p.wearStep>0.1||!Number.isFinite(p.naturalRecovery)||p.naturalRecovery<0||p.naturalRecovery>0.1||!Number.isInteger(p.criticalDuration)||p.criticalDuration<1||p.criticalDuration>10000){expField('expResult').textContent='Parámetros inválidos: revisa los límites de cada campo.';return}
  const result=runExperiment(p)
  experimentRows=result.rows.map(row=>({...row,params:p}))
  const s=result.summary
  const f=v=>Number(v).toFixed(2)
  const modeName=p.mode==='fixed_units'?'PRODUCCIÓN FIJA':'HORIZONTE FIJO'
  expField('expResult').innerHTML=`<strong>SIMULACIÓN SINTÉTICA — ${modeName} (${p.replicates} réplicas)</strong><div class="exp-metrics"><div><strong>Defectos (%)</strong><span>AS-IS ${f(s.asIsRate)} % → TO-BE ${f(s.toBeRate)} %</span></div><div><strong>Reducción relativa de tasa</strong><span>${f(s.relativeReduction)} % (${f(s.delta)} pp)</span></div><div><strong>Medias producidas</strong><span>${f(s.asIsProduced)} → ${f(s.toBeProduced)}</span></div><div><strong>Medias defectuosas</strong><span>${f(s.asIsDefects)} → ${f(s.toBeDefects)}</span></div><div><strong>Ciclos transcurridos</strong><span>${f(s.asIsElapsed)} → ${f(s.toBeElapsed)}</span></div><div><strong>Episodios de deterioro</strong><span>AS-IS ${f(s.asIsEpisodes)} → TO-BE ${f(s.toBeEpisodes)}</span></div><div><strong>Paradas críticas</strong><span>${f(s.asIsStops)} → ${f(s.toBeStops)}</span></div><div><strong>Ciclos inoperativos</strong><span>${f(s.asIsDowntime)} → ${f(s.toBeDowntime)}</span></div><div><strong>IC aproximado 95 % (diferencia tasa)</strong><span>[${f(s.ciLow)}, ${f(s.ciHigh)}] pp</span></div></div><p class="validation-experiment-note">${p.mode==='fixed_units'?'Ambas políticas completan la misma producción; compare cantidad absoluta de defectos y ciclos consumidos.':'Ambas políticas disponen del mismo horizonte; las cantidades producidas pueden diferir. Una menor tasa no implica necesariamente menos defectos absolutos.'} ${s.completed?'Todas las corridas completadas.':'Advertencia: alguna corrida alcanzó el límite de seguridad.'} Resultados sintéticos NO validados en planta.</p>`
  expField('expExport').disabled=false
})
expField('expExport').addEventListener('click',()=>{
  if(!experimentRows.length)return
  const headers=['modalidad','replica','seed','as_is_unidades','as_is_defectos','as_is_porcentaje','as_is_paradas_criticas','as_is_ciclos_inoperativos','as_is_ciclos_totales','to_be_unidades','to_be_defectos','to_be_porcentaje','to_be_paradas_criticas','to_be_ciclos_inoperativos','to_be_ciclos_totales','to_be_intervenciones','to_be_escalamientos','diferencia_pp','episodios_as_is','episodios_to_be','episodios_criticos_as_is','episodios_criticos_to_be','parametros_json','origen']
  const rows=experimentRows.map(r=>[r.params.mode,r.replica,r.seed,r.asIs.produced,r.asIs.defects,r.asIs.defectRate,r.asIs.criticalStops,r.asIs.downtime,r.asIs.elapsed,r.toBe.produced,r.toBe.defects,r.toBe.defectRate,r.toBe.criticalStops,r.toBe.downtime,r.toBe.elapsed,r.toBe.interventions,r.toBe.escalation,r.deltaRate,r.asIs.episodeCount,r.toBe.episodeCount,r.asIs.criticalEpisodes,r.toBe.criticalEpisodes,JSON.stringify(r.params),'SIMULACION_SINTETICA_NO_VALIDADA'])
  const csv=[headers,...rows].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n')
  const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}))
  const a=document.createElement('a');a.href=url;a.download='dicapri_v20_4_'+experimentRows[0].params.mode+'_corridas.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
})

// V20.3: análisis separado; no mezcla resultados con el banco 3D ni con inferencias YOLO.
function getExperimentalParams(){
  return {...DEFAULT_PARAMS,mode:expField('expMode').value,scenario:expField('expScenario').value,units:Number(expField('expUnits').value),replicates:Number(expField('expReplicas').value),seed:Number(expField('expSeed').value),threshold:Number(expField('expThreshold').value),operatorEfficacy:Number(expField('expOperator').value)/100,supervisorEfficacy:Number(expField('expSupervisor').value)/100,criticalDuration:Number(expField('expCritical').value),incidentRate:Number(expField('expIncident').value)/100,baseDefect:Number(expField('expBaseDefect').value)/100}
}
function validExperimentalParams(p){return Number.isInteger(p.units)&&p.units>=100&&p.units<=100000&&Number.isInteger(p.replicates)&&p.replicates>=2&&p.replicates<=1000&&Number.isInteger(p.seed)&&p.seed>=0&&p.seed<=4294967295&&Number.isInteger(p.threshold)&&p.threshold>=1&&p.threshold<=24&&[p.operatorEfficacy,p.supervisorEfficacy,p.incidentRate,p.baseDefect].every(x=>Number.isFinite(x)&&x>=0&&x<=1)&&Number.isFinite(p.wearStep)&&p.wearStep>=0&&p.wearStep<=0.1&&Number.isFinite(p.naturalRecovery)&&p.naturalRecovery>=0&&p.naturalRecovery<=0.1&&Number.isInteger(p.criticalDuration)&&p.criticalDuration>=1&&p.criticalDuration<=10000}
let sensitivityRows=[]
expField('expCalibrate').addEventListener('click',()=>{
  const p=getExperimentalParams()
  if(!validExperimentalParams(p)){expField('expCalibration').textContent='Parámetros inválidos.';return}
  const c=calibrateIncidentRate(p,3.08)
  if(!c.reachable){expField('expCalibration').textContent=`La tasa objetivo 3,08 % no es alcanzable variando solo incidentes (rango simulado: ${c.lowRate.toFixed(2)} %–${c.highRate.toFixed(2)} %). No se modificó ningún parámetro.`;return}
  expField('expIncident').value=(c.incidentRate*100).toFixed(4)
  expField('expCalibration').textContent=`AJUSTE EXPLORATORIO: incidentes ${(c.incidentRate*100).toFixed(4)} %; AS-IS simulado ${c.achievedRate.toFixed(2)} % frente a referencia reconstruida 3,08 %. ${c.replicates} réplicas, producción fija. No valida causas, fallas ni eficacia de mantenimiento. Vuelve a ejecutar ambas modalidades.`
  expField('expExport').disabled=true
  experimentRows=[]
  expField('expResult').textContent='Parámetro cambiado por calibración: ejecuta nuevamente.'
})
expField('expSensitivity').addEventListener('click',()=>{
  const p=getExperimentalParams()
  if(!validExperimentalParams(p)){expField('expSensitivityResult').textContent='Parámetros inválidos.';return}
  if(p.units>10000){expField('expSensitivityResult').textContent='Para sensibilidad, utiliza un horizonte de 10.000 o menos.';return}
  sensitivityRows=sensitivitySweep(p)
  expField('expSensitivityExport').disabled=false
  const trs=sensitivityRows.map(r=>`<tr><td>${r.factor}</td><td>${(r.value*100).toFixed(2)} %</td><td>${r.asIsRate.toFixed(2)} %</td><td>${r.toBeRate.toFixed(2)} %</td><td>${r.delta.toFixed(2)} pp</td><td>${r.toBeStops.toFixed(2)}</td></tr>`).join('')
  expField('expSensitivityResult').innerHTML=`<div style="overflow-x:auto"><table style="width:100%;font-size:.83rem"><thead><tr><th>Factor</th><th>Valor</th><th>AS-IS</th><th>TO-BE</th><th>Diferencia</th><th>Paradas TO-BE</th></tr></thead><tbody>${trs}</tbody></table></div><p class="validation-experiment-note">12 escenarios unifactoriales, hasta 30 réplicas pareadas por escenario. Comparación sintética condicionada a parámetros no calibrados. El análisis no representa incertidumbre estructural ni sustituye validación en planta.</p>`
})
expField('expSensitivityExport').addEventListener('click',()=>{
  if(!sensitivityRows.length)return
  const fields=['factor','parameter','value','mode','replicates','asIsRate','toBeRate','delta','relativeReduction','asIsStops','toBeStops','asIsDefects','toBeDefects','ciLow','ciHigh']
  const csv=[fields.join(';'),...sensitivityRows.map(r=>fields.map(k=>`"${String(r[k]).replaceAll('"','""')}"`).join(';'))].join('\r\n')
  const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='dicapri_v20_4_sensibilidad_sintetica.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
})
