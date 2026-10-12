import { ArrowUpRight01Icon, Invoice01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { uppercaseFirst } from '@tamery/shared/utils'
import { Button } from '@tamery/ui/components/button'
import { cardClass } from '@tamery/ui/components/card.utils'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
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
import { createLazyFileRoute, useRouter } from '@tanstack/react-router'
import { format } from 'date-fns'

import { AccountPage } from '~/components/account-page'
import { useBillingPortal } from '~/hooks/use-subscription'
import { orpc } from '~/lib/orpc'

const SKELETON_ROWS = 4

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(amount / 100)

const RouteComponent = () => {
  const { data: invoices = [], isPending } = useQuery(
    orpc.account.invoices.queryOptions()
  )
  const router = useRouter()
  const returnHref = router.buildLocation({ to: '/account/billing' }).href
  const { openBillingPortal, isOpening } = useBillingPortal({ returnHref })

  return (
    <AccountPage
      title="Billing"
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={() => openBillingPortal()}
          disabled={isOpening}
        >
          <LoadingContent loading={isOpening}>Manage billing</LoadingContent>
        </Button>
      }
    >
      <div className={cn(cardClass, 'overflow-x-auto')}>
        {!isPending && invoices.length === 0 ? (
          <Empty size="sm">
            <EmptyHeader>
              <EmptyMedia variant="muted">
                <HugeiconsIcon icon={Invoice01Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No invoices yet</EmptyTitle>
              <EmptyDescription>
                Invoices appear here after your first payment.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table className="min-w-md table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/5">Date</TableHead>
                <TableHead className="w-1/4 text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending
                ? Array.from({ length: SKELETON_ROWS }, (_, row) => (
                    <TableRow key={row}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                : invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        {format(invoice.createdAt, 'MMMM d, yyyy')}
                      </TableCell>
                      <TableCell variant="numeric">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        {uppercaseFirst(invoice.status ?? 'unknown')}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.url && (
                          <Button
                            variant="ghost-muted"
                            size="xs"
                            render={
                              <a
                                href={invoice.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="View invoice"
                              />
                            }
                          >
                            View
                            <HugeiconsIcon
                              icon={ArrowUpRight01Icon}
                              strokeWidth={2}
                              data-icon="inline-end"
                            />
                          </Button>
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

export const Route = createLazyFileRoute('/account/billing')({
  component: RouteComponent,
})
