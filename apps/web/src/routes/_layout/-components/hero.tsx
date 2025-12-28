import { DatabaseType } from '@conar/shared/enums/database-type'
import { FlipWords } from '@conar/ui/components/aceternity/flip-words'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import { Link } from '@tanstack/react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import { DownloadButton } from '~/components/download-button'

const words = {
  [DatabaseType.Postgres]: 'Postgres',
  [DatabaseType.MySQL]: 'MySQL',
  [DatabaseType.MSSQL]: 'MSSQL',
  [DatabaseType.ClickHouse]: 'ClickHouse',
} satisfies Record<DatabaseType, string>

export function Hero({ className }: { className?: string }) {
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 200, 500], [1, 1, 0])

  return (
    <motion.section
      style={{ opacity }}
      className={cn(`
        flex flex-col items-start justify-between gap-6 py-12
        sm:gap-8 sm:py-16
        md:py-20
        lg:flex-row lg:items-center lg:gap-12 lg:py-24
        xl:py-28
      `, className)}
    >
      <div className={`
        w-full
        lg:w-auto lg:flex-1
      `}
      >
        <h1 className={`
          text-[clamp(2.5rem,min(8vh,8vw),5rem)] leading-[0.9] font-medium
          text-balance
        `}
        >
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
              words={Object.values(words)}
              duration={2000}
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
      <div className={`
        flex w-full max-w-md flex-col items-start gap-4
        sm:gap-6
        lg:flex-1 lg:items-end
      `}
      >
        <motion.h2
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className={`
            text-left text-base text-balance text-muted-foreground
            sm:text-lg
            lg:text-right lg:text-xl
          `}
        >
          Conar is an AI-powered data management tool that lets you focus on working with your data while it handles the complexity
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`
            flex w-full flex-col gap-3
            sm:flex-row sm:gap-4
            lg:w-auto
          `}
        >
          <DownloadButton />
          <Button
            variant="secondary"
            asChild
            size="lg"
            className={`
              w-full
              sm:w-auto
            `}
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
