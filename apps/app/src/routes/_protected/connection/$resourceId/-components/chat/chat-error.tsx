import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert,
  AlertAction,
  AlertDescription,
} from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'

export const ChatError = ({
  error,
  onRetry,
}: {
  error: Error
  onRetry: () => void
}) => (
  <div className="shrink-0 px-2">
    <Alert variant="destructive" size="sm">
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
      <AlertDescription>{error.message}</AlertDescription>
      <AlertAction>
        <Button size="xs" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </AlertAction>
    </Alert>
  </div>
)
