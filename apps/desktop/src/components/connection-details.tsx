import type { DatabaseType } from '@connnect/shared/enums/database-type'
import { parseConnectionString } from '@connnect/shared/utils/connections'
import { cn } from '@connnect/ui/lib/utils'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { useState } from 'react'

export function ConnectionDetails({ className, connectionString, type }: { className?: string, connectionString: string, type: DatabaseType }) {
  const connection = parseConnectionString(type, connectionString)
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
          <td data-mask>{connection.user}</td>
        </tr>
        {connection.password && (
          <tr>
            <td className="py-1 pr-4 text-muted-foreground">Password</td>
            <td data-mask>
              <button
                type="button"
                className="p-1 rounded-md hover:bg-accent translate-y-0.4 cursor-pointer mr-2 inline-block [&_svg]:size-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
              {showPassword ? connection.password : Array.from({ length: connection.password.length }).map(() => '*').join('')}
            </td>
          </tr>
        )}
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">Host</td>
          <td data-mask>{connection.host}</td>
        </tr>
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">Port</td>
          <td data-mask>{connection.port}</td>
        </tr>
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">Database</td>
          <td data-mask>{connection.database}</td>
        </tr>
        {connection.options && (
          <tr>
            <td className="py-1 pr-4 text-muted-foreground">Options</td>
            <td data-mask>{connection.options}</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
