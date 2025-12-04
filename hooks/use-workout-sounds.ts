"use client"

import { useCallback, useRef } from "react"

// Sound frequencies for different alerts
const SOUNDS = {
  tick: { frequency: 800, duration: 50, type: "sine" as OscillatorType },
  exerciseComplete: { frequency: 523.25, duration: 200, type: "sine" as OscillatorType }, // C5
  restComplete: { frequency: 659.25, duration: 300, type: "sine" as OscillatorType }, // E5
  workoutComplete: { frequency: 783.99, duration: 500, type: "sine" as OscillatorType }, // G5
  countdown: { frequency: 440, duration: 100, type: "square" as OscillatorType }, // A4
  finalCountdown: { frequency: 880, duration: 150, type: "square" as OscillatorType }, // A5
}

export function useWorkoutSounds() {
  const audioContextRef = useRef<AudioContext | null>(null)

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) => {
      try {
        const audioContext = getAudioContext()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.type = type
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)

        // Fade in/out for smoother sound
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration / 1000)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration / 1000)
      } catch (error) {
        console.warn("Audio playback failed:", error)
      }
    },
    [getAudioContext],
  )

  const playTick = useCallback(() => {
    playTone(SOUNDS.tick.frequency, SOUNDS.tick.duration, SOUNDS.tick.type, 0.1)
  }, [playTone])

  const playExerciseComplete = useCallback(() => {
    // Play a pleasant chord
    playTone(523.25, 200, "sine", 0.2) // C5
    setTimeout(() => playTone(659.25, 200, "sine", 0.2), 100) // E5
    setTimeout(() => playTone(783.99, 300, "sine", 0.2), 200) // G5
  }, [playTone])

  const playRestComplete = useCallback(() => {
    // Three ascending beeps
    playTone(440, 150, "square", 0.2)
    setTimeout(() => playTone(554.37, 150, "square", 0.2), 200)
    setTimeout(() => playTone(659.25, 200, "square", 0.3), 400)
  }, [playTone])

  const playWorkoutComplete = useCallback(() => {
    // Triumphant fanfare
    const notes = [
      { freq: 523.25, delay: 0 }, // C5
      { freq: 659.25, delay: 150 }, // E5
      { freq: 783.99, delay: 300 }, // G5
      { freq: 1046.5, delay: 450 }, // C6
    ]
    notes.forEach(({ freq, delay }) => {
      setTimeout(() => playTone(freq, 300, "sine", 0.3), delay)
    })
  }, [playTone])

  const playCountdown = useCallback(
    (secondsLeft: number) => {
      if (secondsLeft <= 3 && secondsLeft > 0) {
        playTone(SOUNDS.finalCountdown.frequency, SOUNDS.finalCountdown.duration, SOUNDS.finalCountdown.type, 0.3)
      } else if (secondsLeft <= 10 && secondsLeft > 0) {
        playTone(SOUNDS.countdown.frequency, SOUNDS.countdown.duration, SOUNDS.countdown.type, 0.15)
      }
    },
    [playTone],
  )

  return {
    playTick,
    playExerciseComplete,
    playRestComplete,
    playWorkoutComplete,
    playCountdown,
  }
}
