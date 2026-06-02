import fs from 'fs'

const modelPath = new URL('../ai-models/sitToStandModel.json', import.meta.url)
const model = JSON.parse(fs.readFileSync(modelPath, 'utf8'))

const round = (value, decimals = 1) => Number(value.toFixed(decimals))

const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

const std = (values) => {
  if (values.length === 0) return 0
  const avg = mean(values)
  const variance = values.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / values.length
  return Math.sqrt(variance)
}

const getFeatureVector = (session) => {
  const maxWeightLeft = session?.maxWeightLeft ?? 0
  const maxWeightRight = session?.maxWeightRight ?? 0
  const totalMaxWeight = maxWeightLeft + maxWeightRight

  if (totalMaxWeight <= 0) {
    return null
  }

  const measurements = (session.measurements || []).filter(measurement => (measurement.weightLeft || 0) + (measurement.weightRight || 0) > 0)
  const leftShares = measurements.map(measurement => {
    const left = measurement.weightLeft || 0
    const right = measurement.weightRight || 0
    return (left / (left + right)) * 100
  })

  return {
    symmetryPercentage: round(session.symmetryPercentage ?? 0, 1),
    leftDominance: round(((maxWeightLeft - maxWeightRight) / totalMaxWeight) * 100, 1),
    durationSeconds: round(session.durationSeconds ?? 0, 2),
    distributionStd: round(std(leftShares), 2)
  }
}

const normalizeFeatures = (features) => Object.fromEntries(model.featureOrder.map(feature => {
  const stats = model.normalization[feature]
  return [feature, (features[feature] - stats.mean) / stats.std]
}))

const distanceToCentroid = (normalizedFeatures, centroid) => Math.sqrt(model.featureOrder.reduce((sum, feature) => {
  const diff = normalizedFeatures[feature] - centroid[feature]
  const weight = model.featureWeights?.[feature] ?? 1
  return sum + ((diff ** 2) * weight)
}, 0))

const getSeverity = (label, features) => {
  const magnitude = Math.abs(features.leftDominance)
  if (label === 'balanced') {
    return features.symmetryPercentage >= 95 ? 'estable' : 'leve'
  }
  if (magnitude >= 22 || features.symmetryPercentage < 65) return 'marcada'
  if (magnitude >= 12 || features.symmetryPercentage < 78) return 'moderada'
  return 'leve'
}

const describeLabel = (label) => ({
  balanced: 'Equilibrado',
  compensate_left: 'Compensación hacia la izquierda',
  compensate_right: 'Compensación hacia la derecha'
}[label] || label)

const getRecommendation = (label) => ({
  balanced: 'El patrón es estable. Mantener el control bilateral actual.',
  compensate_left: 'Existe mayor carga en el lado izquierdo. Conviene trabajar una transferencia algo mayor hacia la derecha.',
  compensate_right: 'Existe mayor carga en el lado derecho. Conviene trabajar una transferencia algo mayor hacia la izquierda.'
}[label] || 'Sin recomendación específica.')

export const interpretSitToStandSession = (session) => {
  const features = getFeatureVector(session)

  if (!features) {
    return {
      available: false,
      modelId: model.modelId,
      message: 'No hay datos suficientes para generar una interpretación IA.'
    }
  }

  const normalizedFeatures = normalizeFeatures(features)
  const distances = Object.entries(model.classCentroids)
    .map(([label, centroid]) => ({ label, distance: distanceToCentroid(normalizedFeatures, centroid) }))
    .sort((a, b) => a.distance - b.distance)

  const best = distances[0]
  const second = distances[1] ?? best
  const confidence = round((1 - (best.distance / (best.distance + second.distance + 0.0001))) * 100, 1)
  const severity = getSeverity(best.label, features)

  return {
    available: true,
    experimental: true,
    modelId: model.modelId,
    algorithm: model.algorithm,
    label: best.label,
    labelText: describeLabel(best.label),
    severity,
    confidence,
    recommendation: getRecommendation(best.label),
    explanation: `La predicción se basa en simetría (${features.symmetryPercentage}%), dominancia lateral (${features.leftDominance}%) y estabilidad del reparto (${features.distributionStd}).`,
    features
  }
}