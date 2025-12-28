import type { DatabaseType } from '@conar/shared/enums/database-type'
import { databaseLabels, DatabaseType as DatabaseTypeEnum } from '@conar/shared/enums/database-type'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Label } from '@conar/ui/components/label'
import { cn } from '@conar/ui/lib/utils'
import { RiCheckLine } from '@remixicon/react'
import { DatabaseIcon } from '~/entities/database'
import { MongoIcon } from '~/icons/mongo'

interface TypeSelectorProps {
  type: DatabaseType | null
  detectedType: DatabaseType | null
  setType: (type: DatabaseType | null) => void
}

export function TypeSelector({ type, detectedType, setType }: TypeSelectorProps) {
  const effectiveType = type || detectedType

  return (
    <div className="flex flex-col gap-2">
      <Label className="flex items-center gap-2">
        Database Type
        <span className="text-destructive">*</span>
        {detectedType && !type && (
          <Badge variant="outline" className="text-xs font-normal">
            Auto-detected
          </Badge>
        )}
      </Label>
      <div className="flex flex-wrap gap-2">
        {Object.values(DatabaseTypeEnum).map(dbType => (
          <Button
            key={dbType}
            type="button"
            variant={effectiveType === dbType ? 'default' : 'outline'}
            size="sm"
            onClick={() => setType(dbType)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5',
              effectiveType === dbType && 'ring-2 ring-primary/20',
            )}
          >
            <DatabaseIcon type={dbType} className="size-4 shrink-0" />
            {databaseLabels[dbType]}
            {effectiveType === dbType && (
              <RiCheckLine className="size-3 ml-1" />
            )}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="flex items-center gap-2 px-3 py-1.5 opacity-50"
        >
          <MongoIcon className="size-4" />
          MongoDB (soon)
        </Button>
      </div>
    </div>
  )
}
