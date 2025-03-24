import { Button } from '@connnect/ui/components/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { RiDatabase2Line, RiHome2Line, RiMoonLine, RiSunLine, RiTableLine } from '@remixicon/react'
import { Link, useMatches, useParams } from '@tanstack/react-router'
import { ThemeToggle } from '~/components/theme-toggle'
import { prefetchDatabaseCore, useDatabase } from '~/entities/database'
import { UserButton } from '~/entities/user'

export function DatabaseSidebar() {
  const { id } = useParams({ from: '/(protected)/_protected/database/$id' })
  const { data: database } = useDatabase(id)
  const matches = useMatches({
    select: matches => matches.map(match => match.routeId),
  })
  const isActiveSql = matches.includes('/(protected)/_protected/database/$id/sql')
  const isActiveTables = matches.includes('/(protected)/_protected/database/$id/tables')

  return (
    <>
      <div className="w-16" />
      <div
        className="bg-card flex flex-col border-r gap-4 items-center py-4 px-4 w-16 h-screen fixed left-0 inset-y-0"
        onMouseOver={() => prefetchDatabaseCore(database)}
      >
        <ul className="flex flex-col gap-1">
          <li>
            <Button
              asChild
              size="icon"
              variant="outline"
            >
              <Link to="/" className="text-foreground">
                <RiHome2Line className="size-4" />
              </Link>
            </Button>
          </li>
        </ul>
        <div className="relative flex flex-col items-center flex-1 gap-2 overflow-auto">
          <div className="w-full text-sm">
            <ul className="flex w-full flex-col gap-1">
              <li>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        size="icon"
                        variant={isActiveSql ? 'secondary' : 'ghost'}
                      >
                        <Link to="/database/$id/sql" params={{ id }} className="text-foreground">
                          <RiDatabase2Line className="size-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">SQL Runner</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </li>
              <li>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        size="icon"
                        variant={isActiveTables ? 'secondary' : 'ghost'}
                      >
                        <Link to="/database/$id/tables" params={{ id }} className="text-foreground">
                          <RiTableLine className="size-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Tables</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </li>
            </ul>
          </div>
        </div>
        <ul className="flex flex-col items-center gap-1">
          <li className="relative">
            <ThemeToggle>
              <Button size="icon" variant="ghost">
                <RiSunLine className="size-4 dark:hidden" />
                <RiMoonLine className="size-4 hidden dark:block" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </ThemeToggle>
          </li>
          <li>
            <UserButton />
          </li>
        </ul>
      </div>
    </>
  )
}
