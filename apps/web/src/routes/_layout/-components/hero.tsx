import { FlipWords } from '@conar/ui/components/aceternity/flip-words'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import { Link } from '@tanstack/react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import { DownloadButton } from '~/components/download-button'

const words = ['Postgres']

export function Hero({ className }: { className?: string }) {
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 200, 500], [1, 1, 0])

  return (
    <motion.div
      style={{ opacity }}
      className={cn('py-20 px-10 flex justify-between items-center gap-2', className)}
    >
      <div className="text-[clamp(2rem,min(8vh,8vw),5rem)] leading-none font-medium text-balance">
        <motion.span
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5 }}
        >
          Manage
        </motion.span>
        <motion.span
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <FlipWords
            words={words}
            duration={1000}
          />
        </motion.span>
        <br />
        <motion.span
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          quickly
        </motion.span>
        &nbsp;
        <motion.span
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          and
        </motion.span>
        &nbsp;
        <motion.span
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          easily
        </motion.span>
      </div>
      <div className="max-w-md flex flex-col items-end gap-4">
        <motion.p
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-muted-foreground text-balance text-lg text-right"
        >
          Conar is an AI-powered data management tool that lets you focus on working with your data while it handles the complexity
        </motion.p>
        <motion.div
          initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex gap-2"
        >
          <DownloadButton />
          <Button
            variant="secondary"
            asChild
            size="lg"
          >
            <Link to="/download">
              All platforms
            </Link>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}
