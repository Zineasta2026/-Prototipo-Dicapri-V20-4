import './style.css'
import Chart from 'chart.js/auto'

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

      <div class="system-status normal" id="systemStatus">
        <span class="status-light"></span>
        <div>
          <small>ESTADO GENERAL</small>
          <strong id="systemStatusText">Sistema preparado</strong>
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
            <div class="sensor-icon">V</div>
            <div>
              <small>VELOCIDAD</small>
              <strong><span id="speedValue">105</span> rpm</strong>
              <p>Rango: 90–120 rpm</p>
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
        <section class="metrics-panel panel">
      <div class="panel-heading">
        <span>05</span>
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
      </div>
    </section>
    <section class="event-panel panel">
      <div class="panel-heading">
        <span>06</span>
        <div>
          <h2>Registro de eventos</h2>
          <p>Historial de detecciones y actuaciones</p>
        </div>
      </div>

      <div class="event-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tiempo</th>
              <th>Escenario</th>
              <th>Diagnóstico</th>
              <th>Acción</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody id="eventTable">
            <tr class="empty-row">
              <td colspan="5">Todavía no se han registrado eventos.</td>
            </tr>
          </tbody>
        </table>
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

const eventRecords = []

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
}
const elements = {
  startButton: document.querySelector('#startButton'),
  pauseButton: document.querySelector('#pauseButton'),
  resetButton: document.querySelector('#resetButton'),
  applyScenarioButton: document.querySelector('#applyScenarioButton'),
  scenarioSelect: document.querySelector('#scenarioSelect'),
  automaticControl: document.querySelector('#automaticControl'),
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
    exportButton: document.querySelector('#exportButton'),
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
  fetch('/data/maquinas.json'),
  fetch('/data/kpi_maquinas.json'),
  fetch('/data/linea_base.json'),
  fetch('/data/pareto_defectos_ordenado.json'),
  fetch('/data/fallas_amef.json'),
  fetch('/data/defectos_causas.json')
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
  elements.machineSelect.innerHTML = dicapriData.machines
    .map(machine => {
      const id = machine['ID_Máquina']
      const model = machine['Modelo']

      return `
        <option value="${id}">
          ${id} — ${model}
        </option>
      `
    })
    .join('')

  const initialMachine =
    dicapriData.machines.some(
      machine => machine['ID_Máquina'] === 'M04'
    )
      ? 'M04'
      : dicapriData.machines[0]?.['ID_Máquina']

  if (initialMachine) {
    elements.machineSelect.value = initialMachine
    renderMachineData(initialMachine)
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
        color: '#aebed0',
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        font: {
          size: 10
        }
      }
    },
    tooltip: {
      backgroundColor: '#07111f',
      borderColor: '#2c4866',
      borderWidth: 1,
      titleColor: '#ffffff',
      bodyColor: '#c8d6e5'
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#66809b',
        maxTicksLimit: 6,
        font: {
          size: 9
        }
      },
      grid: {
        color: 'rgba(72, 104, 135, 0.12)'
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#66809b',
        font: {
          size: 9
        }
      },
      grid: {
        color: 'rgba(72, 104, 135, 0.12)'
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

  document.querySelector('#speedValue').textContent =
    Math.max(0, Math.round(values.speed + randomNoise(2)))

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

  setCardStatus('speedCard',
    values.speed < 60 ? 'critical' : values.speed < 90 ? 'warning' : 'normal'
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
      diagnosis: 'Posible rotura de aguja',
      action: 'Detener máquina y sustituir la aguja',
      status: 'critical',
      statusText: 'Rotura de aguja detectada',
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
  inducedScenario === 'brokenNeedle' ||
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

      addRecoveryEvent(data, recoveryTime)
    }, 10000)
  }
}

function updateMachineAnimation() {
  const moving =
  running &&
  currentScenario !== 'brokenThread' &&
  currentScenario !== 'jam' &&
  currentScenario !== 'brokenNeedle' &&
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

function addEvent(scenario, data) {
  const emptyRow = elements.eventTable.querySelector('.empty-row')
  if (emptyRow) emptyRow.remove()

  const labels = {
    normal: 'Operación normal',
    lowTension: 'Tensión insuficiente',
    highTension: 'Sobretensión',
    brokenThread: 'Rotura de hilo',
    jam: 'Atascamiento',
    brokenNeedle: 'Rotura de aguja',
    elasticTrigger: 'Falla del disparador elástico',
    oilStain: 'Lubricante sobre la prenda'
  }

  const time = elements.simulationTime.textContent

  const action = elements.automaticControl.checked
    ? data.action
    : 'Sin actuación'

  const criticalScenarios = [
  'brokenThread',
  'jam',
  'brokenNeedle',
  'elasticTrigger'
]

const result =
  criticalScenarios.includes(scenario)
      ? 'Parada crítica'
      : elements.automaticControl.checked
        ? 'Acción iniciada'
        : 'Pendiente'

  eventRecords.push({
    tiempo: time,
    escenario: labels[scenario] || scenario,
    diagnostico: data.diagnosis,
    accion: action,
    resultado: result
  })

  const row = document.createElement('tr')

  const resultClass =
    result === 'Acción iniciada'
      ? 'success'
      : result === 'Parada crítica'
        ? 'critical'
        : 'pending'

  row.innerHTML = `
    <td>${time}</td>
    <td>${labels[scenario] || scenario}</td>
    <td>${data.diagnosis}</td>
    <td>${action}</td>
    <td>
      <span class="result-tag ${resultClass}">
        ${result}
      </span>
    </td>
  `

  elements.eventTable.prepend(row)
}
function addRecoveryEvent(originalData, recoveryTime) {
  const emptyRow = elements.eventTable.querySelector('.empty-row')
  if (emptyRow) emptyRow.remove()

  const time = elements.simulationTime.textContent

  eventRecords.push({
    tiempo: time,
    escenario: 'Recuperación automática',
    diagnostico: `${originalData.diagnosis} controlada`,
    accion: originalData.action,
    resultado: `Recuperación verificada en ${recoveryTime} s`
  })

  const row = document.createElement('tr')

  row.innerHTML = `
    <td>${time}</td>
    <td>Recuperación automática</td>
    <td>${originalData.diagnosis} controlada</td>
    <td>${originalData.action}</td>
    <td>
      <span class="result-tag success">
        Recuperación verificada
      </span>
    </td>
  `

  elements.eventTable.prepend(row)
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
    'Tiempo',
    'Escenario',
    'Diagnóstico',
    'Acción',
    'Resultado'
  ]

  const rows = eventRecords.map(record => [
    record.tiempo,
    record.escenario,
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
function startSimulation() {
  if (running) return

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
}

function pauseSimulation() {
  running = false
  clearInterval(timer)
  timer = null
  setSystemStatus('warning', 'Simulación pausada')
  elements.actionText.textContent = 'Simulación detenida temporalmente'
  updateMachineAnimation()
}

function resetSimulation() {
  cancelScheduledCorrections()
  running = false
  clearInterval(timer)
  timer = null
  seconds = 0
  currentScenario = 'normal'
  metrics.totalAnomalies = 0
  metrics.recoverableEvents = 0
  metrics.controlledEvents = 0
  metrics.criticalStops = 0
  metrics.responseTimes = []
  metrics.recoveryTimes = []

  eventRecords.length = 0
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
  elements.eventTable.innerHTML = `
    <tr class="empty-row">
      <td colspan="5">Todavía no se han registrado eventos.</td>
    </tr>
  `

  updateTimer()
  renderValues()
  clearCharts()
  updateMachineAnimation()
  setSystemStatus('normal', 'Sistema preparado')
}

elements.startButton.addEventListener('click', startSimulation)
elements.pauseButton.addEventListener('click', pauseSimulation)
elements.resetButton.addEventListener('click', resetSimulation)
elements.applyScenarioButton.addEventListener('click', applyScenario)
elements.exportButton.addEventListener('click', exportCsv)
elements.machineSelect.addEventListener('change', event => {
  renderMachineData(event.target.value)
})
elements.scenarioSelect.addEventListener('change', () => {
  currentScenario = elements.scenarioSelect.value
  renderAmefScenarioInfo(currentScenario)
})
renderValues()
loadDicapriData()