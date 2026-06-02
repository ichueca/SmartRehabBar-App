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
        fillClass: 'fill-green-500',
        label: 'Excelente'
      }
    } else if (level >= 50) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        fillClass: 'fill-yellow-500',
        label: 'Bueno'
      }
    } else if (level >= 20) {
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        fillClass: 'fill-orange-500',
        label: 'Bajo'
      }
    } else {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        fillClass: 'fill-red-500',
        label: 'Crítico'
      }
    }
  }

  const status = getBatteryStatus(level)
  const footLabel = foot === 'left' ? 'Izq' : 'Der'

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${status.bgColor} ${status.color}`}>
      <svg className={`w-4 h-4 ${status.fillClass}`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1v1a1 1 0 0 1-1 1H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12a1 1 0 0 1 1 1v1Zm-2 0H4v10h11V7Zm3 2v6h1V9h-1Z" />
      </svg>
      <span>{footLabel}: {level.toFixed(0)}%</span>
    </div>
  )
}

export default BatteryIndicator

