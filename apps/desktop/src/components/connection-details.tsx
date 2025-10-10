import type { DatabaseType } from '@conar/shared/enums/database-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { cn } from '@conar/ui/lib/utils'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { useState } from 'react'

export function ConnectionDetails({ className, connectionString, type }: { className?: string, connectionString: string, type: DatabaseType }) {
  const url = new SafeURL(connectionString)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <table className={cn('text-xs font-mono w-full border-collapse', className)}>
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
                className="p-1 rounded-md hover:bg-accent/50 translate-y-0.4 cursor-pointer mr-2 inline-block [&_svg]:size-3"
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
          <td data-mask>{url.pathname.slice(1)}</td>
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
