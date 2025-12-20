import { databaseLabels, DatabaseType } from '@conar/shared/enums/database-type'
import { Button } from '@conar/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@conar/ui/components/card'
import { DatabaseIcon } from '~/entities/database'
import { MongoIcon } from '~/icons/mongo'

export function StepType({
  type,
  setType,
}: {
  type: DatabaseType | null
  setType: (type: DatabaseType) => void
}) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Type of connection</CardTitle>
        <CardDescription>Choose the type of connection you want to create.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {Object.values(DatabaseType).map((dbType) => (
            <Button
              key={dbType}
              variant={type === dbType ? 'default' : 'outline'}
              onClick={() => setType(dbType)}
              className="flex items-center gap-2 px-4 py-2"
            >
              <DatabaseIcon type={dbType} className="size-4 shrink-0 text-primary" />
              {databaseLabels[dbType]}
            </Button>
          ))}
          <Button
            variant="outline"
            disabled
            className="flex items-center gap-2 px-4 py-2 opacity-60"
          >
            <MongoIcon />
            MongoDB (soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
