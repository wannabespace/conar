import { parseConnectionString } from '@connnect/shared/utils/connections'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { useState } from 'react'

export function ConnectionDetails({ connectionString }: { connectionString: string }) {
  const connection = parseConnectionString(connectionString)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <table className="text-xs font-mono w-full border-collapse">
      <tbody>
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">Protocol</td>
          <td>{connection.protocol}</td>
        </tr>
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">Username</td>
          <td>{connection.username}</td>
        </tr>
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">Password</td>
          <td>
            <button
              type="button"
              className="p-1 rounded-md hover:bg-accent translate-y-0.4 cursor-pointer mr-2 inline-block [&_svg]:size-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
            </button>
            {showPassword ? connection.password : '••••••••'}
          </td>
        </tr>
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">Host</td>
          <td>{connection.host}</td>
        </tr>
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">Port</td>
          <td>{connection.port}</td>
        </tr>
        <tr>
          <td className="py-1 pr-4 text-muted-foreground">Database</td>
          <td>{connection.database}</td>
        </tr>
        {connection.options && (
          <tr>
            <td className="py-1 pr-4 text-muted-foreground">Options</td>
            <td>{connection.options}</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
