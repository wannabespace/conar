import { parseConnectionString } from '@connnect/shared/utils/connections'
import { Label } from '@connnect/ui/components/label'
import { AnimatePresence, motion } from 'motion/react'

export function ConnectionDetails({ connectionString }: { connectionString: string }) {
  const connection = (() => {
    try {
      return parseConnectionString(connectionString)
    }
    catch {
      return null
    }
  })()

  return (
    <AnimatePresence>
      {connection && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="h-6" />
          <Label className="block mb-2">
            Connection details
          </Label>
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
                <td>{connection.password}</td>
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}
