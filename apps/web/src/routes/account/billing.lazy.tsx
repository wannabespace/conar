import { uppercaseFirst } from '@conar/shared/utils/helpers'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Skeleton } from '@conar/ui/components/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@conar/ui/components/table'
import { RiExternalLinkLine, RiWalletLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute, useRouter } from '@tanstack/react-router'
import { format } from 'date-fns'
import { useBillingPortal } from '~/hooks/use-subscription'
import { orpcQuery } from '~/lib/orpc'

export const Route = createLazyFileRoute('/account/billing')({
  component: RouteComponent,
})

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100)
}

function RouteComponent() {
  const { data: invoices = [], isPending } = useQuery(orpcQuery.account.invoices.queryOptions())
  const router = useRouter()
  const returnHref = router.buildLocation({ to: '/account/billing' }).href
  const { openBillingPortal, isOpening } = useBillingPortal({ returnHref })

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Billing & Invoices</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openBillingPortal()}
          disabled={isOpening}
        >
          <LoadingContent loading={isOpening}>
            <RiWalletLine className="size-4" />
            Manage Billing
          </LoadingContent>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>View your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {!isPending && invoices.length === 0
            ? (
                <div className="py-8 text-center text-muted-foreground">
                  No invoices found
                </div>
              )
            : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: '35%' }}>Date</TableHead>
                      <TableHead style={{ width: '25%' }}>Amount</TableHead>
                      <TableHead style={{ width: '20%' }}>Status</TableHead>
                      <TableHead style={{ width: '20%' }} className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPending
                      ? Array.from({ length: 5 }).map((_, index) => (

                          (
                            // eslint-disable-next-line react/no-array-index-key
                            <TableRow key={`skeleton-${index}`}>
                              <TableCell style={{ width: '35%' }}>
                                <Skeleton className="h-4 w-40" />
                              </TableCell>
                              <TableCell style={{ width: '25%' }}>
                                <Skeleton className="h-4 w-20" />
                              </TableCell>
                              <TableCell style={{ width: '20%' }}>
                                <Skeleton className="h-4 w-16" />
                              </TableCell>
                              <TableCell style={{ width: '20%' }}>
                                <Skeleton className="ml-auto h-4 w-12" />
                              </TableCell>
                            </TableRow>
                          )
                        ))
                      : (
                          invoices.map(invoice => (
                            <TableRow key={invoice.id}>
                              <TableCell style={{ width: '35%' }}>
                                {format(invoice.createdAt, 'MMMM d, yyyy')}
                              </TableCell>
                              <TableCell style={{ width: '25%' }}>
                                {formatCurrency(invoice.amount)}
                              </TableCell>
                              <TableCell style={{ width: '20%' }}>
                                {uppercaseFirst(invoice.status ?? 'unknown')}
                              </TableCell>
                              <TableCell style={{ width: '20%' }}>
                                {invoice.url
                                  ? (
                                      <div className="flex justify-end">
                                        <a
                                          href={invoice.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`
                                            flex items-center gap-1
                                            text-foreground
                                            hover:underline
                                          `}
                                        >
                                          View
                                          <RiExternalLinkLine className="size-3" />
                                        </a>
                                      </div>
                                    )
                                  : null}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                  </TableBody>
                </Table>
              )}
        </CardContent>
      </Card>
    </>
  )
}
