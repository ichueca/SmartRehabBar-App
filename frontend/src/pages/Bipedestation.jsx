import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BatteryIndicator from '../components/BatteryIndicator'
import { useSocket } from '../context/SocketContext'
import { bipedestationAPI } from '../services/api'
import { useBipedestationAudio } from '../hooks/useBipedestationAudio'
import balanceOkImage from '../../images/balance_ok.webp'
import balanceLeftSoftImage from '../../images/balance_left_soft.webp'
import balanceLeftStrongImage from '../../images/balance_left_strong.webp'
import balanceRightSoftImage from '../../images/balance_right_soft.webp'
import balanceRightStrongImage from '../../images/balance_right_strong.webp'

const TARGET_PRESETS = [50, 60, 70, 80, 100, 0]
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const getStatusStyles = (status) => ({
  ok: 'bg-green-50 border-green-200 text-green-800',
  slight: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  large: 'bg-red-50 border-red-200 text-red-800',
  waiting_for_user: 'bg-blue-50 border-blue-200 text-blue-800'
}[status] || 'bg-gray-50 border-gray-200 text-gray-800')

const getChildIllustration = (update) => {
  if (!update || update.recommendation === 'balanced' || update.status === 'ok') {
    return {
      src: balanceOkImage,
      alt: 'Personaje equilibrado sobre el balancín'
    }
  }

  if (update.recommendation === 'more_left') {
    return update.status === 'large'
      ? {
          src: balanceLeftStrongImage,
          alt: 'Personaje inclinado con desequilibrio fuerte hacia la derecha y necesidad de cargar más el pie izquierdo'
        }
      : {
          src: balanceLeftSoftImage,
          alt: 'Personaje con desequilibrio leve y necesidad de cargar un poco más el pie izquierdo'
        }
  }

  return update.status === 'large'
    ? {
        src: balanceRightStrongImage,
        alt: 'Personaje inclinado con desequilibrio fuerte hacia la izquierda y necesidad de cargar más el pie derecho'
      }
    : {
        src: balanceRightSoftImage,
        alt: 'Personaje con desequilibrio leve y necesidad de cargar un poco más el pie derecho'
      }
}

const Bipedestation = () => {
  const navigate = useNavigate()
  const { socket, connected, batteryLevels } = useSocket()
  const [config, setConfig] = useState({
    targetLeftPercentage: 50,
    mode: 'adult',
    audioEnabled: false,
    thresholds: { ok: 3, warning: 7 }
  })
  const [status, setStatus] = useState({ active: false, exercise: null, latestUpdate: null })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { unlockAudio, announceUpdate } = useBipedestationAudio(config.audioEnabled)

  const latestUpdate = status.latestUpdate
  const displayBattery = latestUpdate?.batteryLevels || batteryLevels
  const childIllustration = useMemo(() => getChildIllustration(latestUpdate), [latestUpdate])

  useEffect(() => {
    loadStatus()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleStarted = (payload) => {
      setStatus(payload)
      syncConfigFromExercise(payload.exercise)
      setError('')
    }

    const handleUpdate = (payload) => {
      setStatus(prev => ({ ...prev, active: true, latestUpdate: payload }))
    }

    const handleEnded = (payload) => {
      setStatus(payload)
    }

    socket.on('bipedestation:started', handleStarted)
    socket.on('bipedestation:update', handleUpdate)
    socket.on('bipedestation:ended', handleEnded)

    return () => {
      socket.off('bipedestation:started', handleStarted)
      socket.off('bipedestation:update', handleUpdate)
      socket.off('bipedestation:ended', handleEnded)
    }
  }, [socket])

  useEffect(() => {
    if (status.exercise) {
      syncConfigFromExercise(status.exercise)
    }
  }, [status.exercise?.id])

  useEffect(() => {
    if (status.active && latestUpdate && config.audioEnabled) {
      announceUpdate(latestUpdate)
    }
  }, [status.active, latestUpdate?.timestamp, config.audioEnabled])

  const syncConfigFromExercise = (exercise) => {
    if (!exercise) return
    setConfig({
      targetLeftPercentage: exercise.targetLeftPercentage,
      mode: exercise.mode,
      audioEnabled: exercise.audioEnabled,
      thresholds: exercise.thresholds
    })
  }

  const loadStatus = async () => {
    try {
      setLoading(true)
      const data = await bipedestationAPI.getStatus()
      setStatus(data)
      syncConfigFromExercise(data.exercise)
    } catch (loadError) {
      console.error('Error loading bipedestation status:', loadError)
      setError('No se ha podido cargar el estado de bipedestación')
    } finally {
      setLoading(false)
    }
  }

  const updateTarget = (nextValue) => {
    setConfig(prev => ({ ...prev, targetLeftPercentage: clamp(nextValue, 0, 100) }))
  }

  const startExercise = async () => {
    try {
      setStarting(true)
      setError('')
      await unlockAudio()
      const data = await bipedestationAPI.start(config)
      setStatus(data)
    } catch (startError) {
      console.error('Error starting bipedestation:', startError)
      setError(startError.response?.data?.message || startError.message || 'No se ha podido iniciar el ejercicio')
    } finally {
      setStarting(false)
    }
  }

  const stopExercise = async () => {
    try {
      setStopping(true)
      const data = await bipedestationAPI.stop()
      setStatus(data)
    } catch (stopError) {
      console.error('Error stopping bipedestation:', stopError)
      setError(stopError.response?.data?.message || 'No se ha podido finalizar el ejercicio')
    } finally {
      setStopping(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Cargando ejercicio de bipedestación...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Bipedestación</h2>
          <p className="text-gray-600 mt-1">Ejercicio visual de equilibrio y reparto de carga en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">{connected ? 'Tiempo Real Activo' : 'Sin Conexión'}</span>
          </div>
          <button onClick={() => navigate('/')} className="btn-secondary">← Volver</button>
        </div>
      </div>

      {error && <div className="card border border-red-200 bg-red-50 text-red-700">{error}</div>}

      {!status.active ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="card space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Configuración del ejercicio</h3>
              <p className="text-gray-600 mt-1">Selecciona objetivo, modo visual y ayuda sonora.</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Objetivo de reparto</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TARGET_PRESETS.map(target => (
                  <button
                    key={target}
                    onClick={() => updateTarget(target)}
                    className={`p-4 rounded-lg border-2 text-lg font-bold transition-all ${config.targetLeftPercentage === target ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-primary-300'}`}
                  >
                    {target} / {100 - target}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[80px_1fr_80px] items-center gap-4">
              <button onClick={() => updateTarget(config.targetLeftPercentage - 5)} className="h-16 rounded-lg border text-3xl font-bold">−</button>
              <div className="rounded-lg bg-gray-50 border p-4 text-center">
                <p className="text-sm text-gray-500">Objetivo actual</p>
                <p className="text-4xl font-bold text-gray-900">{config.targetLeftPercentage}% / {100 - config.targetLeftPercentage}%</p>
              </div>
              <button onClick={() => updateTarget(config.targetLeftPercentage + 5)} className="h-16 rounded-lg border text-3xl font-bold">+</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button onClick={() => setConfig(prev => ({ ...prev, mode: 'adult' }))} className={`p-5 rounded-lg border-2 text-left ${config.mode === 'adult' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>
                <p className="text-xl font-bold">Adulto</p>
                <p className="text-sm text-gray-600 mt-1">Porcentajes grandes, mensajes directos y barra de equilibrio.</p>
              </button>
              <button onClick={() => setConfig(prev => ({ ...prev, mode: 'child' }))} className={`p-5 rounded-lg border-2 text-left ${config.mode === 'child' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>
                <p className="text-xl font-bold">Infantil</p>
                <p className="text-sm text-gray-600 mt-1">Visual amable con personaje y balancín.</p>
              </button>
            </div>

            <button onClick={() => setConfig(prev => ({ ...prev, audioEnabled: !prev.audioEnabled }))} className={`p-5 rounded-lg border-2 text-left ${config.audioEnabled ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>
              <p className="text-xl font-bold">Audio por auriculares: {config.audioEnabled ? 'Sí' : 'No'}</p>
              <p className="text-sm text-gray-600 mt-1">Pitido lateral + locución del mensaje de corrección.</p>
            </button>

            <div className="border rounded-lg">
              <button onClick={() => setShowAdvanced(prev => !prev)} className="w-full px-4 py-3 flex items-center justify-between font-semibold">
                Ajustes avanzados
                <span>{showAdvanced ? '▲' : '▼'}</span>
              </button>
              {showAdvanced && (
                <div className="grid md:grid-cols-2 gap-4 p-4 border-t bg-gray-50">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Tolerancia OK (%)</span>
                    <input type="number" min="0" max="20" className="input-field mt-1" value={config.thresholds.ok} onChange={(e) => setConfig(prev => ({ ...prev, thresholds: { ...prev.thresholds, ok: clamp(Number(e.target.value), 0, 20) } }))} />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Desvío grande (%)</span>
                    <input type="number" min="1" max="30" className="input-field mt-1" value={config.thresholds.warning} onChange={(e) => setConfig(prev => ({ ...prev, thresholds: { ...prev.thresholds, warning: clamp(Number(e.target.value), 1, 30) } }))} />
                  </label>
                </div>
              )}
            </div>

            <button onClick={startExercise} disabled={starting} className={`w-full py-5 text-xl btn-primary ${starting ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {starting ? 'Iniciando...' : '▶ Iniciar ejercicio'}
            </button>
          </div>

          <div className="card space-y-5">
            <h3 className="text-xl font-bold text-gray-900">Preparación</h3>
            {(displayBattery.left !== null || displayBattery.right !== null) && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Estado de sensores</p>
                <div className="flex gap-2 flex-wrap">
                  <BatteryIndicator level={displayBattery.left} foot="left" />
                  <BatteryIndicator level={displayBattery.right} foot="right" />
                </div>
              </div>
            )}
            <ul className="space-y-3 text-gray-700">
              <li>1. Coloca auriculares si vas a usar audio.</li>
              <li>2. Selecciona el reparto objetivo.</li>
              <li>3. Pulsa iniciar y sube a la plataforma.</li>
              <li>4. Corrige la carga según el color y el mensaje.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Objetivo</p>
              <p className="text-2xl font-bold text-gray-900">{config.targetLeftPercentage}% / {100 - config.targetLeftPercentage}%</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="px-3 py-1 rounded bg-gray-100 text-sm font-medium">Modo {config.mode === 'child' ? 'infantil' : 'adulto'}</span>
                <span className="px-3 py-1 rounded bg-gray-100 text-sm font-medium">Audio {config.audioEnabled ? 'activado' : 'desactivado'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {(displayBattery.left !== null || displayBattery.right !== null) && (
                <div className="flex gap-2 flex-wrap">
                  <BatteryIndicator level={displayBattery.left} foot="left" />
                  <BatteryIndicator level={displayBattery.right} foot="right" />
                </div>
              )}
              <button onClick={stopExercise} disabled={stopping} className="btn-danger">
                {stopping ? 'Finalizando...' : '⏹ Finalizar ejercicio'}
              </button>
            </div>
          </div>

          <div className={`card border ${getStatusStyles(latestUpdate?.status)}`}>
            <div className="text-center">
              <p className="text-sm uppercase tracking-wide font-semibold">Estado actual</p>
              <p className="text-4xl font-bold mt-2">{latestUpdate?.message || 'Esperando mediciones...'}</p>
              {latestUpdate?.distribution && <p className="mt-2 text-lg">Desvío respecto al objetivo: {latestUpdate.distribution.differenceFromTarget}%</p>}
            </div>
          </div>

          {latestUpdate?.status === 'waiting_for_user' || !latestUpdate?.distribution ? (
            <div className="card text-center py-16">
              <div className="text-7xl mb-4">👣</div>
              <p className="text-3xl font-bold text-gray-900">Súbete a la plataforma</p>
              <p className="text-gray-600 mt-2">El ejercicio empezará cuando detectemos suficiente carga.</p>
            </div>
          ) : config.mode === 'child' ? (
            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
              <div className="card text-center py-8 overflow-hidden bg-gradient-to-b from-sky-50 to-white">
                <div className="rounded-3xl bg-white/90 border border-sky-100 shadow-sm p-4 md:p-6">
                  <img
                    src={childIllustration.src}
                    alt={childIllustration.alt}
                    className="mx-auto h-80 w-auto max-w-full object-contain"
                  />
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-6">{latestUpdate.message}</p>
                <p className="text-gray-600 mt-2">Ayuda al zorro a mantenerse en equilibrio.</p>
              </div>
              <div className="card grid grid-cols-2 gap-4 content-start">
                <div className="rounded-xl bg-blue-50 p-6 text-center"><p className="text-sm text-blue-700">Izquierdo</p><p className="text-5xl font-bold text-blue-900">{latestUpdate.distribution.leftPercentage}%</p></div>
                <div className="rounded-xl bg-green-50 p-6 text-center"><p className="text-sm text-green-700">Derecho</p><p className="text-5xl font-bold text-green-900">{latestUpdate.distribution.rightPercentage}%</p></div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-blue-50 text-center"><p className="text-sm text-blue-700">Pie izquierdo</p><p className="text-6xl font-bold text-blue-900">{latestUpdate.distribution.leftPercentage}%</p><p className="text-blue-700 mt-2">{latestUpdate.weights.left} kg</p></div>
                <div className="card bg-green-50 text-center"><p className="text-sm text-green-700">Pie derecho</p><p className="text-6xl font-bold text-green-900">{latestUpdate.distribution.rightPercentage}%</p><p className="text-green-700 mt-2">{latestUpdate.weights.right} kg</p></div>
              </div>

              <div className="card space-y-4">
                <div className="flex justify-between text-sm font-medium text-gray-600">
                  <span>Objetivo: {latestUpdate.target.leftPercentage}% izquierdo</span>
                  <span>Actual: {latestUpdate.distribution.leftPercentage}% izquierdo</span>
                </div>
                <div className="relative h-8 rounded-full bg-gray-200 overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-blue-200" style={{ width: `${latestUpdate.distribution.leftPercentage}%` }}></div>
                  <div className="absolute inset-y-0 right-0 bg-green-200" style={{ width: `${latestUpdate.distribution.rightPercentage}%` }}></div>
                  <div className="absolute inset-y-0 w-1 bg-gray-900" style={{ left: `calc(${latestUpdate.target.leftPercentage}% - 2px)` }}></div>
                  <div className="absolute inset-y-0 w-3 rounded-full bg-primary-600" style={{ left: `calc(${latestUpdate.distribution.leftPercentage}% - 6px)` }}></div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg bg-gray-50 p-4"><p className="text-sm text-gray-500">Total</p><p className="text-3xl font-bold text-gray-900">{latestUpdate.weights.total} kg</p></div>
                  <div className="rounded-lg bg-gray-50 p-4"><p className="text-sm text-gray-500">Objetivo</p><p className="text-3xl font-bold text-gray-900">{latestUpdate.target.leftPercentage}/{latestUpdate.target.rightPercentage}</p></div>
                  <div className="rounded-lg bg-gray-50 p-4"><p className="text-sm text-gray-500">Corrección</p><p className="text-2xl font-bold text-gray-900">{latestUpdate.recommendation === 'balanced' ? '✅ OK' : latestUpdate.recommendation === 'more_left' ? '⬅ Izquierdo' : '➡ Derecho'}</p></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Bipedestation