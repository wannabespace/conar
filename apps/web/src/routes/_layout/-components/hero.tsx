import { FlipWords } from '@conar/ui/components/aceternity/flip-words'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import { motion, useScroll, useTransform } from 'motion/react'

const words = ['Postgres']

export function Hero({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll()

  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <motion.div
      style={{ opacity }}
      className={cn('py-20 px-10 flex justify-between items-center gap-2', className)}
    >
      <div
        className="text-[clamp(2rem,min(8vh,8vw),5rem)] leading-none font-medium text-balance"
      >
        Manage
        <FlipWords
          words={words}
          duration={1000}
        />
        <br />
        quickly&nbsp;and&nbsp;easily
      </div>
      <div className="max-w-md flex flex-col items-end gap-4">
        <p className="text-muted-foreground text-balance text-lg text-right">
          Conar is an AI-powered data management tool that lets you focus on working with your data while it handles the complexity
        </p>
        <Button>
          Download
        </Button>
      </div>
    </motion.div>
  )
}
