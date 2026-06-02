import { useEffect, useMemo, useState } from 'react'
import { useSocket } from '../context/SocketContext'
import { hardwareDebugAPI } from '../services/api'

const OPTIONS = {
  modes: ['all', 'gait', 'sit_to_stand', 'bipedestation', 'none', 'invalid', 'error'],
  feet: ['all', 'left', 'right'],
  outcomes: ['all', 'stored', 'partial', 'filtered_time', 'filtered_weight', 'no_active_session', 'no_active_bipedestation', 'invalid_foot', 'invalid_weight', 'invalid_battery', 'exception']
}

const getOutcomeClasses = (outcome) => {
  if (outcome === 'stored') return 'bg-green-100 text-green-700'
  if (outcome?.startsWith('filtered')) return 'bg-yellow-100 text-yellow-700'
  if (outcome?.startsWith('invalid') || outcome === 'exception') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-700'
}

const HardwareDebug = () => {
  const { socket, connected } = useSocket()
  const [enabled, setEnabled] = useState(false)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ mode: 'all', foot: 'all', outcome: 'all', search: '' })

  useEffect(() => {
    loadDebugState()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleEvent = (event) => {
      setEvents(prev => [event, ...prev].slice(0, 200))
    }

    const handleState = (state) => {
      setEnabled(state.enabled)
      if (state.count === 0) {
        setEvents([])
      }
    }

    socket.on('hardware-debug:event', handleEvent)
    socket.on('hardware-debug:state', handleState)

    return () => {
      socket.off('hardware-debug:event', handleEvent)
      socket.off('hardware-debug:state', handleState)
    }
  }, [socket])

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filters.mode !== 'all' && event.mode !== filters.mode) return false
      if (filters.foot !== 'all' && event.foot !== filters.foot) return false
      if (filters.outcome !== 'all' && event.outcome !== filters.outcome) return false
      if (filters.search && !JSON.stringify(event).toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  }, [events, filters])

  const loadDebugState = async () => {
    try {
      setLoading(true)
      const data = await hardwareDebugAPI.getState()
      setEnabled(data.enabled)
      setEvents(data.events || [])
      setError('')
    } catch (loadError) {
      console.error('Error loading hardware debug:', loadError)
      setError('No se ha podido cargar el estado de depuración HW')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (nextEnabled) => {
    try {
      setUpdating(true)
      const data = await hardwareDebugAPI.setEnabled(nextEnabled)
      setEnabled(data.enabled)
      setError('')
    } catch (toggleError) {
      console.error('Error toggling hardware debug:', toggleError)
      setError('No se ha podido cambiar el estado de depuración')
    } finally {
      setUpdating(false)
    }
  }

  const handleClear = async () => {
    try {
      setUpdating(true)
      await hardwareDebugAPI.clear()
      setEvents([])
      setError('')
    } catch (clearError) {
      console.error('Error clearing hardware debug:', clearError)
      setError('No se ha podido limpiar el log')
    } finally {
      setUpdating(false)
    }
  }

  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(filteredEvents, null, 2))
    } catch (copyError) {
      console.error('Error copying logs:', copyError)
      setError('No se ha podido copiar el log al portapapeles')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Cargando depuración de hardware...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Depuración Hardware</h2>
        <p className="text-gray-600 mt-1">Herramienta técnica oculta para verificar qué mediciones llegan al backend y cómo se procesan.</p>
      </div>

      {error && <div className="card border border-red-200 bg-red-50 text-red-700">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Socket</p>
              <p className="text-lg font-semibold text-gray-900">{connected ? 'Conectado' : 'Sin conexión'}</p>
            </div>
            <span className={`inline-block h-4 w-4 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Captura de depuración</p>
              <p className="text-lg font-semibold text-gray-900">{enabled ? 'Activada' : 'Desactivada'}</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only" checked={enabled} onChange={(e) => handleToggle(e.target.checked)} disabled={updating} />
              <div className={`relative w-14 h-8 rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`}></span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={loadDebugState} className="btn-secondary" disabled={updating}>Refrescar</button>
            <button onClick={handleClear} className="btn-danger" disabled={updating}>Limpiar log</button>
          </div>

          <button onClick={copyLogs} className="btn-primary w-full" disabled={filteredEvents.length === 0}>Copiar JSON filtrado</button>
        </div>

        <div className="card space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <select className="input-field" value={filters.mode} onChange={(e) => setFilters(prev => ({ ...prev, mode: e.target.value }))}>
              {OPTIONS.modes.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
            <select className="input-field" value={filters.foot} onChange={(e) => setFilters(prev => ({ ...prev, foot: e.target.value }))}>
              {OPTIONS.feet.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
            <select className="input-field" value={filters.outcome} onChange={(e) => setFilters(prev => ({ ...prev, outcome: e.target.value }))}>
              {OPTIONS.outcomes.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
            <input className="input-field" placeholder="Buscar" value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} />
          </div>

          <div className="text-sm text-gray-600">Eventos visibles: <span className="font-semibold text-gray-900">{filteredEvents.length}</span></div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Hora</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Modo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Pie</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Peso</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Batería</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Resultado</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No hay eventos de hardware para mostrar.</td>
                </tr>
              ) : filteredEvents.map(event => (
                <tr key={event.id} className="align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{new Date(event.timestamp).toLocaleTimeString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{event.mode}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{event.foot || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{event.parsed?.weight ?? '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{event.parsed?.batteryLevel ?? '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getOutcomeClasses(event.outcome)}`}>{event.outcome}</span></td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs max-w-xl break-words">{JSON.stringify(event.details || event.error || {}, null, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default HardwareDebug