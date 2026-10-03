import { GitBranchIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { Link } from '@tanstack/react-router'

export const ReleasesLink = () => (
  <Button
    variant="ghost"
    size="sm"
    className="hidden gap-1 sm:flex sm:gap-2"
    render={<Link to="/releases" />}
  >
    <HugeiconsIcon
      icon={GitBranchIcon}
      strokeWidth={2}
      className="size-3 sm:size-4"
    />
    Releases
  </Button>
)
