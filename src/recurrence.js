// V18: motor determinista de recurrencia; no atribuye defectos sintéticos a mediciones reales.
export const WINDOW_SIZE = 24
export const WARNING_COUNT = 3
export const STOP_COUNT = 6

export function recurrenceSummary(records, warning = WARNING_COUNT, stop = STOP_COUNT) {
  const window = records.slice(-WINDOW_SIZE)
  const inspected = window.length
  const defects = window.filter(item => item.defect).length
  const classes = {}
  window.filter(item => item.defect).forEach(item => {
    const code = item.classCode || 'NO_ESPECIFICADO'
    classes[code] = (classes[code] || 0) + 1
  })
  const dominant = Object.entries(classes).sort((a,b) => b[1] - a[1])[0]?.[0] || null
  return {
    inspected, defects, rate: inspected ? defects / inspected : 0,
    dominant, level: inspected < WINDOW_SIZE ? 'insufficient' : defects >= stop ? 'critical' : defects >= warning ? 'warning' : 'normal'
  }
}

export function recommendedMaintenance(classCode) {
  const actions = {
    D01: 'Mantenimiento correctivo dirigido: inspeccionar y sustituir agujas dañadas; revisar alineación.',
    D03: 'Mantenimiento correctivo dirigido: revisar alimentadores, guías, tensión y roturas de hilo.',
    D04: 'Mantenimiento correctivo dirigido: verificar disparador, alimentación y tensión del elástico.',
    D06: 'Mantenimiento correctivo dirigido: inspeccionar lubricación, posibles fugas y limpiar contaminación.',
    D09: 'Mantenimiento basado en condición: revisar y calibrar tensores, guiado y sincronización del tejido.'
  }
  return actions[classCode] || 'Inspección de mantenimiento basada en condición: diagnosticar la causa y corregir antes del reinicio.'
}
