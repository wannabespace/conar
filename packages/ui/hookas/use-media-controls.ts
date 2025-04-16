import * as React from 'react'

interface MediaControls {
  play: () => Promise<void>
  pause: () => void
  toggle: () => Promise<void>
  stop: () => void
  toggleMute: (isMuted?: boolean) => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  isPlaying: boolean
  isMuted: boolean
  volume: number
  currentTime: number
  duration: number
}

export function useMediaControls(
  mediaRef: React.RefObject<HTMLMediaElement | null>,
): MediaControls {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false)
  const [volume, setVolume] = React.useState(1)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)

  React.useEffect(() => {
    const media = mediaRef.current

    if (!media)
      return

    const abortController = new AbortController()

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setVolume(media.volume)
      setIsMuted(media.muted)
    }
    const handleTimeUpdate = () => setCurrentTime(media.currentTime)
    const handleDurationChange = () => setDuration(media.duration)
    const handleEnded = () => setIsPlaying(false)

    media.addEventListener('play', handlePlay, { signal: abortController.signal })
    media.addEventListener('pause', handlePause, { signal: abortController.signal })
    media.addEventListener('volumechange', handleVolumeChange, { signal: abortController.signal })
    media.addEventListener('timeupdate', handleTimeUpdate, { signal: abortController.signal })
    media.addEventListener('durationchange', handleDurationChange, { signal: abortController.signal })
    media.addEventListener('ended', handleEnded, { signal: abortController.signal })

    setVolume(media.volume)
    setIsMuted(media.muted)
    setCurrentTime(media.currentTime)
    setDuration(media.duration || 0)
    setIsPlaying(!media.paused)

    return () => {
      abortController.abort()
    }
  }, [mediaRef])

  const play = React.useCallback(async () => {
    if (mediaRef.current) {
      await mediaRef.current.play()
    }
  }, [mediaRef])

  const pause = React.useCallback(() => {
    if (mediaRef.current) {
      mediaRef.current.pause()
    }
  }, [mediaRef])

  const toggle = React.useCallback(async () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause()
      }
      else {
        await mediaRef.current.play()
      }
    }
  }, [mediaRef, isPlaying])

  const stop = React.useCallback(() => {
    if (mediaRef.current) {
      mediaRef.current.pause()
      mediaRef.current.currentTime = 0
    }
  }, [mediaRef])

  const toggleMute = React.useCallback((isMuted?: boolean) => {
    if (mediaRef.current) {
      mediaRef.current.muted = isMuted ?? !mediaRef.current.muted
    }
  }, [mediaRef])

  const setVolumeValue = React.useCallback((value: number) => {
    if (mediaRef.current) {
      mediaRef.current.volume = Math.max(0, Math.min(1, value))
    }
  }, [mediaRef])

  const setCurrentTimeValue = React.useCallback((time: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = Math.max(0, Math.min(duration, time))
    }
  }, [mediaRef, duration])

  return {
    play,
    pause,
    toggle,
    stop,
    toggleMute,
    setVolume: setVolumeValue,
    setCurrentTime: setCurrentTimeValue,
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
  }
}
