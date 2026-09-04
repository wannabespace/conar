import { ViewIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SafeURL } from '@tamery/shared/utils/safe-url'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useState } from 'react'

export const ConnectionDetails = ({
  className,
  connectionString,
  type,
}: {
  className?: string
  connectionString: string
  type: ConnectionType
}) => {
  const url = new SafeURL(connectionString)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <table
      className={cn('w-full border-collapse font-mono text-xs', className)}
    >
      <tbody>
        <tr>
          <td className="text-muted-foreground py-1 pr-4">Type</td>
          <td data-mask>{type}</td>
        </tr>
        <tr>
          <td className="text-muted-foreground py-1 pr-4">User</td>
          <td data-mask>{url.username}</td>
        </tr>
        {url.password && (
          <tr>
            <td className="text-muted-foreground py-1 pr-4">Password</td>
            <td data-mask>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground mr-2 inline-block translate-y-0.5 rounded-md p-1 [&_svg]:size-3"
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  }
                >
                  <HugeiconsIcon
                    icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                    strokeWidth={2}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  {showPassword ? 'Hide password' : 'Show password'}
                </TooltipContent>
              </Tooltip>
              {showPassword
                ? url.password
                : Array.from({ length: url.password.length })
                    .map(() => '*')
                    .join('')}
            </td>
          </tr>
        )}
        <tr>
          <td className="text-muted-foreground py-1 pr-4">Host</td>
          <td data-mask>{url.hostname}</td>
        </tr>
        <tr>
          <td className="text-muted-foreground py-1 pr-4">Port</td>
          <td data-mask>{url.port}</td>
        </tr>
        <tr>
          <td className="text-muted-foreground py-1 pr-4">Database</td>
          <td data-mask>{url.pathname.slice(1)}</td>
        </tr>
        {Object.keys(url.searchParams.entries()).length > 0 && (
          <>
            <tr>
              <td className="text-muted-foreground py-1 pr-4">Options</td>
            </tr>
            {Object.entries(url.searchParams.entries()).map(([key, value]) => (
              <tr key={key}>
                <td className="text-muted-foreground py-1 pr-4">{key}</td>
                <td data-mask>
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </td>
              </tr>
            ))}
          </>
        )}
      </tbody>
    </table>
  )
}
