import { Badge } from '@conar/ui/components/badge'

export function ConnectionVersion({ connectionVersion }: { connectionVersion: string | null }) {
  if (!connectionVersion)
    return null

  return (
    <Badge variant="outline" className="font-mono text-[10px]">
      v
      {connectionVersion}
    </Badge>
  )
}
