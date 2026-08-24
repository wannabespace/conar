import { cn } from '@tamery/ui/lib/utils'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useEffectEvent, useState } from 'react'

export const FlipWords = ({
  words,
  duration = 3000,
  className,
}: {
  words: string[]
  duration?: number
  className?: string
}) => {
  const [currentWord, setCurrentWord] = useState(() => words[0] ?? '')
  const [isAnimating, setIsAnimating] = useState(false)

  const startAnimation = useEffectEvent(() => {
    const word = words[words.indexOf(currentWord) + 1] ?? words[0] ?? ''
    setCurrentWord(word)
    setIsAnimating(true)
  })

  useEffect(() => {
    if (!isAnimating) {
      const timeout = setTimeout(() => {
        startAnimation()
      }, duration)

      return () => clearTimeout(timeout)
    }
  }, [isAnimating, duration])

  return (
    <AnimatePresence
      onExitComplete={() => {
        setIsAnimating(false)
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{
          filter: 'blur(4px)',
          opacity: 0,
          position: 'absolute',
          scale: 0.8,
        }}
        transition={{ duration: 0.5 }}
        className={cn(
          `text-foreground relative z-10 inline-block px-2 text-left`,
          className
        )}
        key={currentWord}
      >
        {currentWord.split(' ').map((word, wordIndex) => (
          <motion.span
            // oxlint-disable-next-line react/no-array-index-key
            key={word + wordIndex}
            initial={{ filter: 'blur(8px)', opacity: 0, y: 10 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{
              delay: wordIndex * 0.3,
              duration: 0.3,
            }}
            className="inline-block whitespace-nowrap"
          >
            {[...word].map((letter, letterIndex) => (
              <motion.span
                // oxlint-disable-next-line react/no-array-index-key
                key={word + letterIndex}
                initial={{ filter: 'blur(8px)', opacity: 0, y: 10 }}
                animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                transition={{
                  delay: wordIndex * 0.3 + letterIndex * 0.05,
                  duration: 0.2,
                }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
            <span className="inline-block">&nbsp;</span>
          </motion.span>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
