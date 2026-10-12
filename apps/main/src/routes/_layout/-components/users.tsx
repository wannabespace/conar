import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'

import { Reveal } from '~/components/reveal'
import { orpc } from '~/lib/orpc'

export const Users = () => {
  const { data } = useQuery(orpc.userCount.queryOptions())

  return (
    <section
      aria-labelledby="users-heading"
      className="mx-auto max-w-6xl px-4 py-20 sm:px-6"
    >
      <Reveal>
        <h2
          id="users-heading"
          className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
        >
          <NumberFlow
            value={data ?? 0}
            format={{ notation: 'compact' }}
            suffix="+"
            className={cn('tabular-nums', !data && 'animate-pulse')}
          />{' '}
          people already use Tamery.{' '}
          <span className="text-muted-foreground">
            Free to start, on every platform.
          </span>
        </h2>
      </Reveal>
    </section>
  )
}
