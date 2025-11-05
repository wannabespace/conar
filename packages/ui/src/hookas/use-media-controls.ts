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
  const [state, setState] = React.useState({
    isPlaying: false,
    isMuted: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
  })

  React.useEffect(() => {
    const media = mediaRef.current

    if (!media)
      return

    const abortController = new AbortController()

    media.addEventListener('play', () => setState(s => ({ ...s, isPlaying: true })), { signal: abortController.signal })
    media.addEventListener('pause', () => setState(s => ({ ...s, isPlaying: false })), { signal: abortController.signal })
    media.addEventListener('volumechange', () => setState(s => ({
      ...s,
      volume: media.volume,
      isMuted: media.muted,
    })), { signal: abortController.signal })
    media.addEventListener('timeupdate', () => setState(s => ({ ...s, currentTime: media.currentTime })), { signal: abortController.signal })
    media.addEventListener('durationchange', () => setState(s => ({ ...s, duration: media.duration })), { signal: abortController.signal })
    media.addEventListener('ended', () => setState(s => ({ ...s, isPlaying: false })), { signal: abortController.signal })

    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setState({
      isPlaying: !media.paused,
      isMuted: media.muted,
      volume: media.volume,
      currentTime: media.currentTime,
      duration: media.duration || 0,
    })

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
      if (state.isPlaying) {
        mediaRef.current.pause()
      }
      else {
        await mediaRef.current.play()
      }
    }
  }, [mediaRef, state.isPlaying])

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
      mediaRef.current.currentTime = Math.max(0, Math.min(state.duration, time))
    }
  }, [mediaRef, state.duration])

  return {
    play,
    pause,
    toggle,
    stop,
    toggleMute,
    setVolume: setVolumeValue,
    setCurrentTime: setCurrentTimeValue,
    ...state,
  }
}
