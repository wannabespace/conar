import { GithubIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { SOCIAL_LINKS } from '@tamery/shared/constants'
import { Button } from '@tamery/ui/components/button'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'

import { orpc } from '~/lib/orpc'

export const GithubStars = ({ className }: { className?: string }) => {
  const { data } = useQuery(orpc.repo.queryOptions())

  return (
    <Button
      variant="ghost-muted"
      size="sm"
      className={className}
      render={
        <a
          href={SOCIAL_LINKS.GITHUB}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Tamery on GitHub"
        />
      }
    >
      <HugeiconsIcon icon={GithubIcon} strokeWidth={2} />
      <NumberFlow
        value={data?.stargazers_count ?? 0}
        className={cn('tabular-nums', !data && 'animate-pulse')}
      />
    </Button>
  )
}
