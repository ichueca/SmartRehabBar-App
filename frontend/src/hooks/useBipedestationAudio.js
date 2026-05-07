import { useEffect, useRef } from 'react'

const AudioContextClass = typeof window !== 'undefined'
  ? window.AudioContext || window.webkitAudioContext
  : null

const PAN_BY_RECOMMENDATION = {
  more_left: -1,
  more_right: 1
}

export const useBipedestationAudio = (enabled) => {
  const audioContextRef = useRef(null)
  const lastCueAtRef = useRef(0)
  const lastMessageKeyRef = useRef('')

  const unlockAudio = async () => {
    if (!enabled || !AudioContextClass) return

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass()
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume().catch(() => {})
    }
  }

  const playDirectionalBeep = (recommendation) => {
    const audioContext = audioContextRef.current
    const panValue = PAN_BY_RECOMMENDATION[recommendation]

    if (!audioContext || panValue === undefined) return

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    const stereoPanner = typeof audioContext.createStereoPanner === 'function'
      ? audioContext.createStereoPanner()
      : null

    oscillator.type = 'sine'
    oscillator.frequency.value = recommendation === 'more_left' ? 480 : 620
    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.28)

    if (stereoPanner) {
      stereoPanner.pan.value = panValue
      oscillator.connect(gainNode)
      gainNode.connect(stereoPanner)
      stereoPanner.connect(audioContext.destination)
    } else {
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
    }

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  const speakMessage = (message) => {
    if (!enabled || typeof window === 'undefined' || !window.speechSynthesis || !message) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.lang = 'es-ES'
    utterance.rate = 0.95
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  const announceUpdate = async (update) => {
    if (!enabled || !update) return

    const messageKey = `${update.status}:${update.recommendation}:${update.voiceMessage || update.message}`
    const now = Date.now()
    const minDelay = messageKey === lastMessageKeyRef.current ? 3000 : 1000

    if (now - lastCueAtRef.current < minDelay) return

    lastCueAtRef.current = now
    lastMessageKeyRef.current = messageKey

    await unlockAudio()
    playDirectionalBeep(update.recommendation)
    speakMessage(update.voiceMessage || update.message)
  }

  const stopAudio = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  useEffect(() => () => stopAudio(), [])

  return {
    unlockAudio,
    announceUpdate,
    stopAudio
  }
}