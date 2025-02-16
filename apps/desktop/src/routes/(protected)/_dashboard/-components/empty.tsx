import { Button } from '@connnect/ui/components/button'
import { useRouter } from '@tanstack/react-router'

export function Empty() {
  const router = useRouter()

  return (
    <div className="text-center bg-background border-2 border-dashed border-foreground/10 rounded-xl p-14 w-full m-auto group">
      <h2 className="text-foreground font-medium mt-6">
        No connections found
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4 whitespace-pre-line">
        Create a new connection to get started.
      </p>
      <Button onClick={() => router.navigate({ to: '/create' })}>
        Create a new connection
      </Button>
    </div>
  )
}
