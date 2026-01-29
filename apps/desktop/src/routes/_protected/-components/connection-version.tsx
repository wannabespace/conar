import type { connections } from '~/drizzle'
import { Badge } from '@conar/ui/components/badge'

export function ConnectionVersion({ connection }: { connection: typeof connections.$inferSelect }) {
  const version = connection.version

  if (!version)
    return null

  return (
    <Badge variant="outline" className="font-mono text-[10px]">
      v-
      {version}
    </Badge>
  )
}
