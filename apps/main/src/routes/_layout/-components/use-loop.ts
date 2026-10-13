import { useInView, useReducedMotion } from 'motion/react'
import type { RefObject } from 'react'
import { useEffect, useState } from 'react'

export const useLoop = (
  ref: RefObject<Element | null>,
  durationsMs: readonly number[]
) => {
  const [index, setIndex] = useState(0)
  const inView = useInView(ref, { amount: 0.5 })
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!inView || reduceMotion) {
      return
    }
    const timeout = setTimeout(
      () => setIndex((index + 1) % durationsMs.length),
      durationsMs[index]
    )
    return () => clearTimeout(timeout)
  }, [durationsMs, inView, index, reduceMotion])

  return reduceMotion ? null : index
}
