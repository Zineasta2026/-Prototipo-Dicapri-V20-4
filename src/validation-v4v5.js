import './validation-v4v5.css'

const API = '/api/validation'
const fmt = (value, digits = 2) => {
  const n = Number(value)
  return Number.isFinite(n) ? n.toLocaleString('es-PE', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—'
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))

async function request(path, options = {}) {
  const response = await fetch(API + path, { headers: { Accept:'application/json', ...(options.headers || {}) }, ...options })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = payload.detail
    const message = typeof detail === 'string' ? detail : detail?.message || JSON.stringify(detail || payload)
    throw new Error(message || ('Error HTTP ' + response.status))
  }
  return payload
}

export function initV4V5Validation(container) {
  if (!container || container.querySelector('#v4v5Panel')) return
  const panel = document.createElement('div')
  panel.id = 'v4v5Panel'
  panel.className = 'v4v5-panel'
  panel.innerHTML = [
    '<div class="v4v5-heading"><div><span class="v4v5-eyebrow">MOTOR EXPERIMENTAL INTEGRADO</span>',
    '<h3>Validación de escenarios V4 / V5</h3>',
    '<p>Ejecuta los scripts versionados desde FastAPI y conserva los resultados de cada corrida.</p></div>',
    '<span class="v4v5-version">V4 v1.2 · V5</span></div>',
    '<div class="v4v5-source" id="v4v5Source" aria-live="polite">',
    '<strong id="v4v5SourceTitle">Comprobando el entorno…</strong>',
    '<span id="v4v5SourceDetail">Verificando backend, motores y base híbrida de entrada.</span>',
    '<button type="button" class="v4v5-button secondary" id="v4v5Check">Verificar entorno</button></div>',
    '<div class="v4v5-actions">',
    '<button type="button" class="v4v5-button secondary" id="v4v5RunV4" disabled>Ejecutar preparación V4</button>',
    '<button type="button" class="v4v5-button primary" id="v4v5RunV5" disabled>Ejecutar validación completa V4 + V5</button></div>',
    '<p class="v4v5-help">La validación completa ejecuta V4, el barrido TPR/FPR de V5 y la sensibilidad de supuestos. Puede tardar varios minutos según el equipo.</p>',
    '<div class="v4v5-progress" id="v4v5ProgressPanel" hidden>',
    '<div class="v4v5-progress-header"><strong id="v4v5Stage">En espera</strong><span id="v4v5Percent">0 %</span></div>',
    '<div class="v4v5-progress-track"><span id="v4v5ProgressBar"></span></div>',
    '<small id="v4v5JobStatus">La ejecución se realizará en segundo plano.</small></div>',
    '<div class="v4v5-error" id="v4v5Error" role="alert" hidden></div>',
    '<div class="v4v5-results" id="v4v5Results" hidden aria-live="polite"></div>'
  ].join('')
  container.appendChild(panel)

  const $ = id => panel.querySelector('#' + id)
  let isRunning = false
  let pollTimer = null

  function setError(message) {
    $('v4v5Error').hidden = !message
    $('v4v5Error').textContent = message || ''
  }

  function setSource(ready, title, detail) {
    $('v4v5Source').classList.toggle('is-ready', Boolean(ready))
    $('v4v5Source').classList.toggle('is-missing', !ready)
    $('v4v5SourceTitle').textContent = title
    $('v4v5SourceDetail').textContent = detail
    $('v4v5RunV4').disabled = !ready || isRunning
    $('v4v5RunV5').disabled = !ready || isRunning
  }

  function setProgress(job) {
    $('v4v5ProgressPanel').hidden = false
    $('v4v5Stage').textContent = job.stage || 'Procesando'
    const pct = Math.max(0, Math.min(100, Number(job.progress) || 0))
    $('v4v5Percent').textContent = Math.round(pct) + ' %'
    $('v4v5ProgressBar').style.width = pct + '%'
    $('v4v5JobStatus').textContent = job.status === 'queued' ? 'En cola de ejecución.'
      : job.status === 'running' ? 'El backend está ejecutando los scripts V4/V5.'
      : job.status === 'completed' ? 'Ejecución completada.' : (job.error || 'La ejecución terminó con errores.')
  }

  async function checkConfig() {
    setError('')
    try {
      const config = await request('/config')
      const enginesReady = config.engines?.v4 && config.engines?.v5 && config.engines?.sensitivity
      const ready = Boolean(config.ready && enginesReady)
      if (ready) setSource(true, 'Entorno listo para ejecutar', 'Base de entrada encontrada: ' + config.base_file_name + '. Motores V4, V5 y sensibilidad disponibles.')
      else {
        const detail = config.base_file_found
          ? 'Falta algún motor de validación en el backend.'
          : 'Falta la base híbrida V3.5. Colócala en backend/data o configura DICAPRI_VALIDATION_BASE_XLSX en el entorno local.'
        setSource(false, 'Validación no disponible todavía', detail)
      }
      return ready
    } catch (error) {
      setSource(false, 'No se pudo conectar con el backend experimental', error.message)
      return false
    }
  }

  function renderDownloads(job) {
    const files = job.kind === 'v4_v5'
      ? [['resumen_v5.csv','Resumen de políticas V5'],['recall_equilibrio.csv','Equilibrio TPR/FPR'],['sensibilidad_supuestos.csv','Sensibilidad de supuestos'],['resultados_brutos_v5.csv','Todas las corridas V5'],['orden_ejecucion.csv','Orden aleatorizado'],['ficha_escenarios.csv','Ficha de escenarios V4'],['anclas.csv','Anclas y procedencia V4']]
      : [['ficha_escenarios.csv','Ficha de escenarios V4'],['anclas.csv','Anclas y procedencia V4'],['bondad_ajuste.csv','Bondad de ajuste'],['semillas.csv','Semillas V4']]
    const links = files.map(item => '<a href="' + API + '/jobs/' + encodeURIComponent(job.job_id) + '/files/' + item[0] + '" target="_blank" rel="noopener">' + esc(item[1]) + '</a>').join('')
    return '<div class="v4v5-downloads"><strong>Archivos de la ejecución</strong><div>' + links + '</div></div>'
  }

  function renderSummary(summary, job) {
    const tables = summary.tables || {}
    const rows = tables['resumen_v5.csv'] || []
    const eq = tables['recall_equilibrio.csv'] || []
    const integrated = rows.find(row => row.escenario === 'tipico' && row.politica === 'integrada' && Math.abs(Number(row.tpr) - .8) < 1e-8 && Math.abs(Number(row.fpr) - .005) < 1e-8)
    const asis = rows.find(row => row.escenario === 'tipico' && row.politica === 'asis' && !String(row.tpr || '').trim())
    const balance = eq.find(row => row.escenario === 'tipico' && Math.abs(Number(row.tpr) - .8) < 1e-8 && Math.abs(Number(row.fpr) - .005) < 1e-8)
    const reduction = balance ? Number(balance.reduccion_relativa_vs_actual) * 100 : NaN
    const stopMean = integrated ? Number(integrated.parada_min) : NaN
    const alarmMean = integrated ? Number(integrated.falsas_turno) : NaN
    let cards = ''
    if (job.kind === 'v4_v5') {
      cards = '<div class="v4v5-metrics">' +
        '<div><small>AS-IS típico</small><strong>' + (asis ? fmt(asis.tasa_media,3) + ' %' : '—') + '</strong></div>' +
        '<div><small>Integrada · TPR 0,80 / FPR 0,005</small><strong>' + (integrated ? fmt(integrated.tasa_media,3) + ' %' : '—') + '</strong></div>' +
        '<div><small>Reducción relativa simulada</small><strong>' + (Number.isFinite(reduction) ? fmt(reduction,1) + ' %' : '—') + '</strong></div>' +
        '<div><small>Falsas alarmas medias / turno</small><strong>' + (Number.isFinite(alarmMean) ? fmt(alarmMean,3) : '—') + '</strong></div>' +
        '<div><small>Parada media · integrada</small><strong>' + (Number.isFinite(stopMean) ? fmt(stopMean,2) + ' min' : '—') + '</strong></div>' +
        '<div><small>Réplicas V5 por combinación</small><strong>50</strong></div></div>' +
        '<p class="v4v5-caveat">Indicadores sintéticos de la corrida actual. TPR/FPR son valores barridos, no desempeño medido de YOLO. La reducción de defectos debe interpretarse junto con falsas alarmas y tiempo de parada.</p>'
    }
    $('v4v5Results').innerHTML = '<div class="v4v5-complete"><strong>Validación finalizada</strong><span>' + esc(job.job_id) + '</span></div>' + cards + renderDownloads(job)
    $('v4v5Results').hidden = false
  }

  async function loadSummary(job) {
    try {
      const summary = await request('/jobs/' + encodeURIComponent(job.job_id) + '/summary')
      renderSummary(summary, job)
    } catch (error) {
      $('v4v5Results').hidden = false
      $('v4v5Results').innerHTML = '<p class="v4v5-caveat">La ejecución terminó, pero no se pudo cargar el resumen: ' + esc(error.message) + '</p>' + renderDownloads(job)
    }
  }

  async function pollJob(jobId) {
    try {
      const job = await request('/jobs/' + encodeURIComponent(jobId))
      setProgress(job)
      if (job.status === 'completed') {
        isRunning = false
        clearTimeout(pollTimer)
        await loadSummary(job)
        await checkConfig()
        return
      }
      if (job.status === 'failed') {
        isRunning = false
        clearTimeout(pollTimer)
        setError(job.error || 'La ejecución falló. Revisa los logs del backend.')
        await checkConfig()
        return
      }
      pollTimer = setTimeout(() => pollJob(jobId), 1800)
    } catch (error) {
      isRunning = false
      clearTimeout(pollTimer)
      setError('Se perdió la consulta de estado: ' + error.message)
      await checkConfig()
    }
  }

  async function start(kind) {
    if (isRunning) return
    setError('')
    $('v4v5Results').hidden = true
    isRunning = true
    $('v4v5RunV4').disabled = true
    $('v4v5RunV5').disabled = true
    try {
      const job = await request(kind === 'v4' ? '/run-v4' : '/run-v5', { method:'POST' })
      setProgress(job)
      pollJob(job.job_id)
    } catch (error) {
      isRunning = false
      setError(error.message)
      await checkConfig()
    }
  }

  $('v4v5Check').addEventListener('click', checkConfig)
  $('v4v5RunV4').addEventListener('click', () => start('v4'))
  $('v4v5RunV5').addEventListener('click', () => start('v5'))
  checkConfig()
}
