#!/usr/bin/env node

import fs from 'fs'

const outputPath = new URL('../ai-models/sitToStandModel.json', import.meta.url)
const featureOrder = ['symmetryPercentage', 'leftDominance', 'durationSeconds', 'distributionStd']
const featureWeights = {
  symmetryPercentage: 1.3,
  leftDominance: 1.8,
  durationSeconds: 0.4,
  distributionStd: 0.4
}

const cartesian = (...arrays) => arrays.reduce((acc, values) => acc.flatMap(item => values.map(value => [...item, value])), [[]])

const generateClassSamples = (label, symmetryValues, dominanceValues, durationValues, stdValues) => {
  return cartesian(symmetryValues, dominanceValues, durationValues, stdValues).map(([symmetryPercentage, leftDominance, durationSeconds, distributionStd]) => ({
    label,
    symmetryPercentage,
    leftDominance,
    durationSeconds,
    distributionStd
  }))
}

const samples = [
  ...generateClassSamples('balanced', [88, 92, 96, 99], [-4, -2, 0, 2, 4], [2.5, 4, 5.5], [2, 4, 6, 8]),
  ...generateClassSamples('compensate_left', [55, 65, 75, 82], [10, 16, 22, 30], [3.5, 5, 7], [4, 7, 10, 13]),
  ...generateClassSamples('compensate_right', [55, 65, 75, 82], [-30, -22, -16, -10], [3.5, 5, 7], [4, 7, 10, 13])
]

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length
const std = (values) => {
  const avg = mean(values)
  const variance = values.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / values.length
  return Math.sqrt(variance) || 1
}

const normalization = Object.fromEntries(featureOrder.map(feature => {
  const values = samples.map(sample => sample[feature])
  return [feature, { mean: Number(mean(values).toFixed(4)), std: Number(std(values).toFixed(4)) }]
}))

const normalizeSample = (sample) => Object.fromEntries(featureOrder.map(feature => {
  const stats = normalization[feature]
  return [feature, Number((((sample[feature] - stats.mean) / stats.std)).toFixed(6))]
}))

const labels = ['balanced', 'compensate_left', 'compensate_right']
const classCentroids = Object.fromEntries(labels.map(label => {
  const normalized = samples.filter(sample => sample.label === label).map(normalizeSample)
  const centroid = Object.fromEntries(featureOrder.map(feature => [
    feature,
    Number(mean(normalized.map(sample => sample[feature])).toFixed(6))
  ]))
  return [label, centroid]
}))

const model = {
  modelId: 'sit_to_stand_centroid_v1',
  algorithm: 'weighted_nearest_centroid',
  featureOrder,
  featureWeights,
  normalization,
  classCentroids,
  trainingSummary: {
    syntheticSamples: samples.length,
    classes: Object.fromEntries(labels.map(label => [label, samples.filter(sample => sample.label === label).length])),
    generatedAt: new Date().toISOString(),
    note: 'Modelo experimental entrenado con muestras sintéticas deterministas para interpretación simple de patrones Sit-to-Stand.'
  }
}

fs.writeFileSync(outputPath, `${JSON.stringify(model, null, 2)}\n`, 'utf8')
console.log(`Modelo guardado en ${outputPath.pathname}`)