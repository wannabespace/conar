import type { MotionProps } from 'motion/react'
import type { ComponentProps } from 'react'
import { cn } from '@conar/ui/lib/utils'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'

function imageProps(index: number) {
  return {
    alt: `Demo part ${index + 1}`,
  } satisfies ComponentProps<'img'>
}

function transitionProps(index: number) {
  return {
    initial: {
      opacity: 0,
      scale: 1.1,
      filter: 'blur(10px)',
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
    },
    transition: {
      type: 'spring',
      duration: 1.5,
      delay: index * 0.4 + 1,
    },
  } satisfies MotionProps
}

const imagesLight = [
  '/demo-light-1.png',
  '/demo-light-2.png',
  '/demo-light-3.png',
  '/demo-light-4.png',
]

const imagesDark = [
  '/demo-dark-1.png',
  '/demo-dark-2.png',
  '/demo-dark-3.png',
  '/demo-dark-4.png',
]

function Image({ className, image, index, type }: { className?: string, image: string, index: number, type: 'light' | 'dark' }) {
  const props = {
    src: image,
    className: cn(
      type === 'dark' ? 'dark:block hidden' : 'dark:hidden',
      index === 0 ? 'mx-auto' : 'absolute top-0 left-0 rounded-xl',
      className,
    ),
    ...imageProps(index),
  }

  if (index === 0) {
    return (
      <img key={image} {...props} />
    )
  }

  return (
    <motion.img
      key={image}
      {...props}
      {...transitionProps(index)}
    />
  )
}

function Images() {
  return (
    <div className="relative w-fit mx-auto rounded-xl">
      {imagesLight.map((image, index) => (
        <Image
          key={image}
          image={image}
          index={index}
          type="light"
        />
      ))}
      {imagesDark.map((image, index) => (
        <Image
          key={image}
          image={image}
          index={index}
          type="dark"
        />
      ))}
      <div className="absolute z-10 inset-x-0 bottom-0 h-full bg-gradient-to-t from-background to-transparent" />
    </div>
  )
}

export function Demo({ className }: { className?: string }) {
  const { scrollY } = useScroll()

  const rotateX = useSpring(useTransform(scrollY, [0, 600], [10, -10]), {
    damping: 15,
  })
  const scale = useTransform(scrollY, [0, 600], [1, 0.7])

  return (
    <section className={cn('perspective-[1200px]', className)}>
      <motion.div
        style={{ rotateX, scale }}
        initial={{
          y: 100,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <Images />
      </motion.div>
    </section>
  )
}
