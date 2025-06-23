import { useInViewport } from '@conar/ui/hookas/use-in-viewport'
import { useMediaControls } from '@conar/ui/hookas/use-media-controls'
import { cn } from '@conar/ui/lib/utils'
import { RiPlayCircleFill } from '@remixicon/react'
import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'

export function Video() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const inView = useInViewport(videoRef)
  const { isPlaying, pause, play } = useMediaControls(videoRef)

  useEffect(() => {
    if (inView) {
      play()
    }
    else {
      pause()
    }
  }, [inView])

  return (
    <motion.div
      transition={{ duration: 0.5, delay: 0.3 }}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
    >
      <div
        className="relative rounded-3xl"
        onClick={() => (isPlaying ? pause() : play())}
      >
        <RiPlayCircleFill
          className={cn(
            'absolute z-10 left-1/2 top-1/2 size-20 lg:size-32 -translate-x-1/2 duration-300 -translate-y-1/2 text-black/70',
            isPlaying && 'opacity-0',
          )}
        />
        <div className={cn('duration-300', (!inView || !isPlaying) && 'opacity-60')}>
          <video
            ref={videoRef}
            muted
            loop
            preload="auto"
            playsInline
            className="mx-auto dark:brightness-80 size-full rounded-2xl"
            poster="/demo.jpg"
            src="/demo.mp4"
          />
        </div>
      </div>
    </motion.div>
  )
}
