import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import type { DateRange } from '@tamery/ui/components/calendar'
import { Calendar } from '@tamery/ui/components/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'
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
import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { endOfMonth, format, parse, startOfMonth, subMonths } from 'date-fns'
import { useState } from 'react'

import { orpc } from '~/lib/orpc'

const MONTHS_SHOWN = 12

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
    return `${format(range.from, 'MMM d, yyyy')} — …`
  }
  return `${format(range.from, 'MMM d, yyyy')} — ${format(range.to, 'MMM d, yyyy')}`
}

const RouteComponent = () => {
  const [range, setRange] = useState<DateRange | undefined>(defaultRange)
  const { data: usage = [], isPending } = useQuery(
    orpc.account.aiUsage.queryOptions({
      input: { from: range?.from, to: range?.to },
    })
  )

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">AI Usage</h2>
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                {formatRange(range)}
              </Button>
            }
          />
          <PopoverContent align="end" className="w-auto p-2">
            <Calendar
              autoFocus
              mode="range"
              numberOfMonths={2}
              onSelect={setRange}
              selected={range}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Monthly usage</CardTitle>
          <CardDescription>
            Tokens and estimated cost of your AI requests, per month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isPending && usage.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              No AI usage in this period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Input tokens</TableHead>
                  <TableHead className="text-right">Output tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending
                  ? Array.from({ length: 3 }).map((_, index) => (
                      // oxlint-disable-next-line react/no-array-index-key
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        {Array.from({ length: 4 }).map((__, cell) => (
                          // oxlint-disable-next-line react/no-array-index-key
                          <TableCell key={`skeleton-${index}-${cell}`}>
                            <Skeleton className="ml-auto h-4 w-16" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : usage.map((row) => (
                      <TableRow key={row.month}>
                        <TableCell>{formatMonth(row.month)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatTokens(row.calls)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatTokens(row.inputTokens ?? 0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatTokens(row.outputTokens ?? 0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.cost === null ? '—' : formatCost(row.cost)}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export const Route = createLazyFileRoute('/account/ai-usage')({
  component: RouteComponent,
})
