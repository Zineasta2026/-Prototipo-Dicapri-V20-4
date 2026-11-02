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
          <option value="lowTension">Tensión insuficiente</option>
          <option value="highTension">Sobretensión</option>
          <option value="brokenThread">Rotura de hilo</option>
          <option value="jam">Atascamiento</option>
        </select>

        <button class="button danger" id="applyScenarioButton">
          Inducir escenario
        </button>

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
    <section class="event-panel panel">
      <div class="panel-heading">
        <span>05</span>
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

const values = {
  tension: 42,
  speed: 105,
  vibration: 1.8,
  temperature: 38,
  current: 1.1,
  threadPresent: true
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
  threadFive: document.querySelector('#threadFive')
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
  currentScenario = elements.scenarioSelect.value

  const scenarioData = {
    normal: {
      anomaly: 'Ninguna',
      diagnosis: 'Operación dentro de parámetros',
      action: 'Mantener condiciones actuales',
      status: 'normal',
      statusText: 'Operación normal'
    },
    lowTension: {
      anomaly: 'Tensión por debajo del límite',
      diagnosis: 'Tensión insuficiente',
      action: 'Incrementar posición del servotensor',
      status: 'warning',
      statusText: 'Advertencia de tensión'
    },
    highTension: {
      anomaly: 'Tensión por encima del límite',
      diagnosis: 'Sobretensión del hilo',
      action: 'Liberar tensor y reducir velocidad',
      status: 'warning',
      statusText: 'Sobretensión detectada'
    },
    brokenThread: {
      anomaly: 'Ausencia de hilo',
      diagnosis: 'Rotura de hilo',
      action: 'Detener máquina y activar alarma',
      status: 'critical',
      statusText: 'Parada por rotura'
    },
    jam: {
      anomaly: 'Corriente y vibración elevadas',
      diagnosis: 'Posible atascamiento',
      action: 'Ejecutar parada de protección',
      status: 'critical',
      statusText: 'Atascamiento detectado'
    }
  }

  const data = scenarioData[currentScenario]

  elements.anomalyText.textContent = data.anomaly
  elements.diagnosisText.textContent = data.diagnosis
  elements.actionText.textContent = elements.automaticControl.checked
    ? data.action
    : 'Control automático desactivado'

  setSystemStatus(data.status, data.statusText)
  updateMachineAnimation()
  addEvent(currentScenario, data)
}

function updateMachineAnimation() {
  const moving = running &&
    currentScenario !== 'brokenThread' &&
    currentScenario !== 'jam'

  elements.spool.classList.toggle('rotating', moving)
  elements.weavingUnit.classList.toggle('rotating', moving)

  const broken = currentScenario === 'brokenThread'
  elements.threadFour.classList.toggle('broken', broken)
  elements.threadFive.classList.toggle('broken', broken)

  elements.servo.classList.toggle(
    'adjusting',
    currentScenario === 'lowTension' || currentScenario === 'highTension'
  )
}

function addEvent(scenario, data) {
  const emptyRow = elements.eventTable.querySelector('.empty-row')
  if (emptyRow) emptyRow.remove()

  const labels = {
    normal: 'Operación normal',
    lowTension: 'Tensión insuficiente',
    highTension: 'Sobretensión',
    brokenThread: 'Rotura de hilo',
    jam: 'Atascamiento'
  }

  const time = elements.simulationTime.textContent
  const action = elements.automaticControl.checked
    ? data.action
    : 'Sin actuación'

  const result = elements.automaticControl.checked
    ? 'Acción ejecutada'
    : 'Pendiente'

  const row = document.createElement('tr')

  row.innerHTML = `
    <td>${time}</td>
    <td>${labels[scenario]}</td>
    <td>${data.diagnosis}</td>
    <td>${action}</td>
    <td>
      <span class="result-tag ${result === 'Acción ejecutada' ? 'success' : 'pending'}">
        ${result}
      </span>
    </td>
  `

  elements.eventTable.prepend(row)
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
  running = false
  clearInterval(timer)
  timer = null
  seconds = 0
  currentScenario = 'normal'

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

renderValues()