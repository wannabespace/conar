import { FlipWords } from '@conar/ui/components/aceternity/flip-words'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import { Link } from '@tanstack/react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import { DownloadButton } from '~/components/download-button'

const words = ['Postgres', 'MySQL']

export function Hero({ className }: { className?: string }) {
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 200, 500], [1, 1, 0])

  return (
    <motion.section
      style={{ opacity }}
      className={cn('py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-8 lg:gap-12', className)}
    >
      <div className="w-full lg:w-auto lg:flex-1">
        <h1 className="text-[clamp(2.5rem,min(8vh,8vw),5rem)] leading-[0.9] font-medium text-balance">
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
          {' '}
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
        </h1>
      </div>
      <div className="w-full max-w-md lg:flex-1 flex flex-col items-start lg:items-end gap-4 sm:gap-6">
        <motion.h2
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-muted-foreground text-balance text-base sm:text-lg lg:text-xl text-left lg:text-right"
        >
          Conar is an AI-powered data management tool that lets you focus on working with your data while it handles the complexity
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto"
        >
          <DownloadButton />
          <Button
            variant="secondary"
            asChild
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link to="/download">
              All platforms
            </Link>
          </Button>
        </motion.div>
      </div>
    </motion.section>
  )
}
