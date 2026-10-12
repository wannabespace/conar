import { Button } from '@tamery/ui/components/button'
import { cn } from '@tamery/ui/lib/utils'

import { DownloadButton } from '~/components/download-button'

export const GetStartedButtons = ({ className }: { className?: string }) => (
  <div className={cn('flex flex-wrap gap-2', className)}>
    <DownloadButton />
    <Button
      variant="outline"
      size="lg"
      render={
        <a
          href={import.meta.env.VITE_PUBLIC_WEB_URL}
          aria-label="Open Tamery in your browser"
        />
      }
    >
      Open in browser
    </Button>
  </div>
)
