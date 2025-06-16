import { FlipWords } from '@conar/ui/components/aceternity/flip-words'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'

const words = ['Postgres']

export function Hero() {
  return (
    <div className="container mx-auto pt-[min(20svh,20rem)] pb-[10svh] flex justify-between items-center gap-2">
      <div
        className={cn(
          'text-[clamp(2rem,min(10vh,10vw),6rem)] leading-none font-medium text-balance',
          'bg-gradient-to-b from-foreground to-foreground/80 bg-clip-text text-transparent',
        )}
      >
        Manage
        <FlipWords
          words={words}
          duration={1000}
        />
        <br />
        quickly&nbsp;and&nbsp;easily
      </div>
      <div className="max-w-md flex flex-col items-end gap-4">
        <p className="text-muted-foreground text-balance text-lg text-right">
          Conar is an AI-powered data management tool that lets you focus on working with your data while it handles the complexity
        </p>
        <Button>
          Download
        </Button>
      </div>
    </div>
  )
}
