import { useMediaControls } from '@connnect/ui/hookas/use-media-controls'
import { cn } from '@connnect/ui/lib/utils'
import { RiPlayCircleFill } from '@remixicon/react'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

export function Video({ className, ...props }: Omit<React.ComponentProps<'div'>, 'children'>) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const inView = useInView(videoRef, { amount: 'all' })
  const { isPlaying, pause, play } = useMediaControls(videoRef)

  return (
    <div className={cn('w-full', className)} {...props}>
      <motion.div
        transition={{ duration: 0.5, delay: 0.3 }}
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
      >
        <div
          className="relative mx-auto aspect-video rounded-3xl border lg:w-2/3 lg:p-2"
          onClick={() => (isPlaying ? pause() : play())}
        >
          <RiPlayCircleFill
            className={cn(
              'absolute z-10 left-1/2 top-1/2 size-20 lg:size-32 -translate-x-1/2 duration-300 -translate-y-1/2 text-black/50',
              isPlaying && 'opacity-0',
            )}
          />
          <div className={cn('duration-300', (!inView || !isPlaying) && 'opacity-30')}>
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              className="mx-auto aspect-video size-full rounded-2xl object-cover"
              poster="/demo.jpg"
              src="/demo.mp4"
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
