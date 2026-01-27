/**
 * Componente para mostrar el nivel de batería de los sensores
 * Muestra un icono de batería con color según el nivel
 */

const BatteryIndicator = ({ level, foot }) => {
  // Si no hay nivel de batería, no mostrar nada
  if (level === null || level === undefined) {
    return null
  }

  // Determinar color y estado según el nivel
  const getBatteryStatus = (level) => {
    if (level >= 80) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '🔋',
        label: 'Excelente'
      }
    } else if (level >= 50) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '🔋',
        label: 'Bueno'
      }
    } else if (level >= 20) {
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        icon: '🪫',
        label: 'Bajo'
      }
    } else {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '🪫',
        label: 'Crítico'
      }
    }
  }

  const status = getBatteryStatus(level)
  const footLabel = foot === 'left' ? 'Izq' : 'Der'

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
      <span>{status.icon}</span>
      <span>{footLabel}: {level.toFixed(0)}%</span>
    </div>
  )
}

export default BatteryIndicator

