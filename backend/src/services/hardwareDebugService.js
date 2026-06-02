const MAX_EVENTS = 200

class HardwareDebugService {
  enabled = false
  sequence = 0
  events = []

  setEnabled(enabled) {
    this.enabled = Boolean(enabled)
    return this.getState()
  }

  getState() {
    return {
      enabled: this.enabled,
      maxEvents: MAX_EVENTS,
      count: this.events.length
    }
  }

  addEvent(event) {
    if (!this.enabled) {
      return null
    }

    const entry = {
      id: ++this.sequence,
      timestamp: new Date().toISOString(),
      ...event
    }

    this.events.unshift(entry)
    if (this.events.length > MAX_EVENTS) {
      this.events.length = MAX_EVENTS
    }

    return entry
  }

  clear() {
    this.events = []
    return this.getState()
  }

  getEvents(filters = {}) {
    const { mode = 'all', outcome = 'all', foot = 'all', search = '', limit } = filters
    let filtered = [...this.events]

    if (mode !== 'all') {
      filtered = filtered.filter(event => event.mode === mode)
    }

    if (outcome !== 'all') {
      filtered = filtered.filter(event => event.outcome === outcome)
    }

    if (foot !== 'all') {
      filtered = filtered.filter(event => event.foot === foot)
    }

    if (search) {
      const term = search.toLowerCase()
      filtered = filtered.filter(event => JSON.stringify(event).toLowerCase().includes(term))
    }

    const numericLimit = Number(limit)
    if (!Number.isNaN(numericLimit) && numericLimit > 0) {
      filtered = filtered.slice(0, numericLimit)
    }

    return filtered
  }
}

export default new HardwareDebugService()