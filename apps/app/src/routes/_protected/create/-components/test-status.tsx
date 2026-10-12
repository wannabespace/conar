import { Spinner } from '@tamery/ui/components/spinner'
import type { MutationStatus } from '@tanstack/react-query'

export const TestStatus = ({
  reason,
  status,
}: {
  reason: string | null
  status: MutationStatus
}) => {
  if (status === 'pending') {
    return (
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Spinner />
        Testing…
      </span>
    )
  }
  if (status === 'success') {
    return (
      <span className="text-muted-foreground flex items-center gap-2 text-xs">
        <span className="bg-success size-1.5 rounded-full" />
        Connected
      </span>
    )
  }
  return reason ? (
    <p className="text-muted-foreground truncate text-xs">{reason}</p>
  ) : null
}
