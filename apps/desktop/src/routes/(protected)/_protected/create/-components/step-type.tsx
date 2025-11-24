import { databaseLabels, DatabaseType } from '@conar/shared/enums/database-type'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { ToggleGroup, ToggleGroupItem } from '@conar/ui/components/toggle-group'
import { DatabaseIcon } from '~/entities/database'
import { MongoIcon } from '~/icons/mongo'

export function StepType({ type, setType }: { type: DatabaseType | null, setType: (type: DatabaseType) => void }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Type of connection</CardTitle>
        <CardDescription>Choose the type of connection you want to create.</CardDescription>
      </CardHeader>
      <CardContent>
        <ToggleGroup
          type="single"
          variant="outline"
          value={type ?? undefined}
          onValueChange={value => setType(value as DatabaseType)}
        >
          <ToggleGroupItem value={DatabaseType.Postgres} aria-label="Postgres">
            <DatabaseIcon type={DatabaseType.Postgres} className="size-4 shrink-0 text-primary" />
            {databaseLabels[DatabaseType.Postgres]}
          </ToggleGroupItem>
          <ToggleGroupItem value={DatabaseType.MySQL} aria-label="MySQL">
            <DatabaseIcon type={DatabaseType.MySQL} className="size-4 shrink-0 text-primary" />
            {databaseLabels[DatabaseType.MySQL]}
          </ToggleGroupItem>
          <ToggleGroupItem value="" disabled aria-label="MongoDB">
            <MongoIcon />
            MongoDB (soon)
          </ToggleGroupItem>
        </ToggleGroup>
      </CardContent>
    </Card>
  )
}
