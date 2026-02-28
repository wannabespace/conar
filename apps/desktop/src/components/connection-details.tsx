import type { ConnectionType } from '@conar/shared/enums/connection-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { cn } from '@conar/ui/lib/utils'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { useState } from 'react'

export function ConnectionDetails({ className, connectionString, type }: { className?: string, connectionString: string, type: ConnectionType }) {
  const url = new SafeURL(connectionString)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <table className={cn('w-full border-collapse font-mono text-xs', className)}>
      <tbody>
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">Type</td>
          <td data-mask>{type}</td>
        </tr>
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">User</td>
          <td data-mask>{url.username}</td>
        </tr>
        {url.password && (
          <tr>
            <td className="py-1 pr-4 text-muted-foreground">Password</td>
            <td data-mask>
              <button
                type="button"
                className="
                  mr-2 inline-block translate-y-0.5 cursor-pointer rounded-md
                  p-1
                  hover:bg-accent/50
                  [&_svg]:size-3
                "
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
              {showPassword ? url.password : Array.from({ length: url.password.length }).map(() => '*').join('')}
            </td>
          </tr>
        )}
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">Host</td>
          <td data-mask>{url.hostname}</td>
        </tr>
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">Port</td>
          <td data-mask>{url.port}</td>
        </tr>
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">Database</td>
          <td data-mask className="w-full max-w-0 truncate">{url.pathname.slice(1)}</td>
        </tr>
        {Object.keys(url.searchParams.entries()).length > 0 && (
          <>
            <tr>
              <td className="py-1 pr-4 text-muted-foreground">Options</td>
            </tr>
            {Object.entries(url.searchParams.entries()).map(([key, value]) => (
              <tr key={key}>
                <td className="py-1 pr-4 text-muted-foreground">{key}</td>
                <td data-mask>{typeof value === 'string' ? value : JSON.stringify(value)}</td>
              </tr>
            ))}
          </>
        )}
      </tbody>
    </table>
  )
}
