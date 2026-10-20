import { motion } from 'motion/react'
import type { Variants } from 'motion/react'

// An untyped character takes no width, so a caret after the text follows what is typed so far.
const typeIn = (delay: number): Variants => ({
  hidden: { display: 'none' },
  shown: { display: 'inline', transition: { delay } },
})

export const Typed = ({
  at,
  step,
  text,
}: {
  at: number
  step: number
  text: string
}) =>
  [...text].map((char, index) => (
    // oxlint-disable-next-line react/no-array-index-key -- a typed string's characters repeat; their position is their identity
    <motion.span key={index} variants={typeIn(at + index * step)}>
      {char}
    </motion.span>
  ))

export const typedEnd = (at: number, step: number, text: string) =>
  at + text.length * step
