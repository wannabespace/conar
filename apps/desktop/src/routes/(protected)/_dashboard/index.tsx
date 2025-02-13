import { Button } from '@connnect/ui/components/button'
import { DotPattern } from '@connnect/ui/components/magicui/dot-pattern'
import { cn } from '@connnect/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import React from 'react'
import { databasesQuery } from '~/queries/databases'

export const Route = createFileRoute('/(protected)/_dashboard/')({
  component: DashboardComponent,
})

function DashboardComponent() {
  const { data: databases } = useQuery(databasesQuery())
  const router = useRouter()

  if (databases?.length) {
    return (
      <div>
        <h3>Welcome Home!</h3>
      </div>
    )
  }

  return (
    <div className="text-center bg-background border-2 border-dashed border-foreground/10 rounded-xl p-14 w-full max-w-[620px] m-auto group">
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className="absolute -z-10 top-0 left-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <h2 className="text-foreground font-medium mt-6">
        No connections found
      </h2>
      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
        Create a new connection to get started.
      </p>
      <Button
        onClick={() => router.navigate({ to: '/databases/create' })}
        className={cn(
          'mt-4',
          'shadow-sm active:shadow-none',
        )}
      >
        Create a new connection
      </Button>
    </div>
  )
}
