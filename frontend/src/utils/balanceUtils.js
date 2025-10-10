/**
 * Determina el nivel de balance según la diferencia porcentual
 * @param {number} difference - Diferencia porcentual entre pies
 * @returns {object} - Objeto con nivel, color, icono y clase CSS
 */
export const getBalanceLevel = (difference) => {
  if (difference < 5) {
    return {
      level: 'normal',
      color: 'green',
      icon: '🟢',
      bgClass: 'bg-green-50',
      borderClass: 'border-green-200',
      textClass: 'text-green-700'
    }
  } else if (difference < 15) {
    return {
      level: 'leve',
      color: 'yellow',
      icon: '🟡',
      bgClass: 'bg-yellow-50',
      borderClass: 'border-yellow-300',
      textClass: 'text-yellow-700'
    }
  } else {
    return {
      level: 'severa',
      color: 'red',
      icon: '🔴',
      bgClass: 'bg-red-50',
      borderClass: 'border-red-200',
      textClass: 'text-red-700'
    }
  }
}

/**
 * Calcula la diferencia porcentual entre dos pesos
 * @param {number} leftWeight - Peso del pie izquierdo
 * @param {number} rightWeight - Peso del pie derecho
 * @returns {number} - Diferencia porcentual
 */
export const calculateDifference = (leftWeight, rightWeight) => {
  const total = leftWeight + rightWeight
  const leftPercentage = (leftWeight / total) * 100
  const rightPercentage = (rightWeight / total) * 100
  return Math.abs(leftPercentage - rightPercentage)
}

