// Constantes configurables del sistema

export const WEIGHT_THRESHOLD_START = parseFloat(process.env.WEIGHT_THRESHOLD_START) || 5
export const WEIGHT_THRESHOLD_END = parseFloat(process.env.WEIGHT_THRESHOLD_END) || 3
export const SYNC_WINDOW_MS = parseInt(process.env.SYNC_WINDOW_MS) || 3000
export const DISPLAY_STEPS = parseInt(process.env.DISPLAY_STEPS) || 20

// Umbrales de balance (porcentaje de diferencia)
export const BALANCE_THRESHOLDS = {
  GOOD: 10,      // < 10% diferencia = verde
  WARNING: 20    // 10-20% = amarillo, > 20% = rojo
}

// Rangos de validación
export const WEIGHT_RANGE = {
  MIN: 1,
  MAX: 300
}

export const DURATION_RANGE = {
  MIN: 100,      // 100ms mínimo
  MAX: 5000      // 5 segundos máximo
}
