import { AiChat02Icon, Calendar03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import type { DateRange } from '@tamery/ui/components/calendar'
import { Calendar } from '@tamery/ui/components/calendar'
import { cardClass } from '@tamery/ui/components/card.utils'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import { Skeleton } from '@tamery/ui/components/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tamery/ui/components/table'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { endOfMonth, format, parse, startOfMonth, subMonths } from 'date-fns'
import { useState } from 'react'

import { AccountPage } from '~/components/account-page'
import { orpc } from '~/lib/orpc'

const MONTHS_SHOWN = 12
const SKELETON_ROWS = 3
const NUMERIC_COLUMNS = 4

const defaultRange = (): DateRange => ({
  from: startOfMonth(subMonths(new Date(), MONTHS_SHOWN - 1)),
  to: endOfMonth(new Date()),
})

const formatTokens = (value: number) => value.toLocaleString('en-US')

const formatCost = (value: number) =>
  new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 4,
    style: 'currency',
  }).format(value)

const formatMonth = (month: string) =>
  format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy')

const formatRange = (range: DateRange | undefined) => {
  if (!range?.from) {
    return 'All time'
  }
  if (!range.to) {
    return `From ${format(range.from, 'MMM d, yyyy')}`
  }
  return `${format(range.from, 'MMM d, yyyy')} to ${format(range.to, 'MMM d, yyyy')}`
}

const RouteComponent = () => {
  const [range, setRange] = useState<DateRange | undefined>(defaultRange)
  const { data: usage = [], isPending } = useQuery(
    orpc.account.aiUsage.queryOptions({
      input: { from: range?.from, to: range?.to },
    })
  )

  return (
    <AccountPage
      title="AI usage"
      action={
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm">
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
                {formatRange(range)}
              </Button>
            }
          />
          <PopoverContent align="end" className="w-auto">
            <Calendar
              autoFocus
              mode="range"
              numberOfMonths={2}
              onSelect={setRange}
              selected={range}
            />
          </PopoverContent>
        </Popover>
      }
    >
      <div className={cn(cardClass, 'overflow-x-auto')}>
        {!isPending && usage.length === 0 ? (
          <Empty size="sm">
            <EmptyHeader>
              <EmptyMedia variant="muted">
                <HugeiconsIcon icon={AiChat02Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No AI usage in this period</EmptyTitle>
              <EmptyDescription>
                Requests you make with AI in Tamery are counted here by month.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table className="min-w-lg table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="w-1/6 text-right">Requests</TableHead>
                <TableHead className="w-1/5 text-right">Input tokens</TableHead>
                <TableHead className="w-1/5 text-right">
                  Output tokens
                </TableHead>
                <TableHead className="w-1/6 text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending
                ? Array.from({ length: SKELETON_ROWS }, (_, row) => (
                    <TableRow key={row}>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      {Array.from({ length: NUMERIC_COLUMNS }, (__, cell) => (
                        <TableCell key={cell}>
                          <Skeleton className="ml-auto h-4 w-12" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : usage.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell>{formatMonth(row.month)}</TableCell>
                      <TableCell variant="numeric">
                        {formatTokens(row.calls)}
                      </TableCell>
                      <TableCell variant="numeric">
                        {formatTokens(row.inputTokens ?? 0)}
                      </TableCell>
                      <TableCell variant="numeric">
                        {formatTokens(row.outputTokens ?? 0)}
                      </TableCell>
                      <TableCell variant="numeric">
                        {row.cost === null ? (
                          <span className="text-muted-foreground">Unknown</span>
                        ) : (
                          formatCost(row.cost)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AccountPage>
  )
}

export const Route = createLazyFileRoute('/account/ai-usage')({
  component: RouteComponent,
})
