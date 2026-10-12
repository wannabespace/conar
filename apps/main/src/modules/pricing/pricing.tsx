import { Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { Tabs, TabsList, TabsTrigger } from '@tamery/ui/components/tabs'
import { cn } from '@tamery/ui/lib/utils'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { Reveal } from '~/components/reveal'
import { SectionHeading } from '~/components/section-heading'
import { useSubscription } from '~/hooks/use-subscription'
import { authClient } from '~/lib/auth'
import type { PricingPlan } from '~/utils/pricing'
import { HOBBY_PLAN, PRO_PLAN } from '~/utils/pricing'

import { ContactSalesDialog } from './contact-sales-dialog'

type Period = 'monthly' | 'yearly'

const ENTERPRISE_FEATURES = [
  'Volume pricing on one invoice',
  'Priority support from the people who build it',
  'Self-hosting help (AGPL-3.0)',
]

const PlanCard = ({
  action,
  description,
  features,
  highlighted,
  includes,
  name,
  price,
}: {
  action: ReactNode
  description: string
  features: string[]
  highlighted?: boolean
  includes?: string
  name: string
  price: ReactNode
}) => (
  <article
    className={cn(
      'ring-foreground/4 flex flex-col rounded-2xl p-6 ring sm:p-8',
      highlighted ? 'bg-popover shadow-md' : 'bg-background shadow-xs'
    )}
  >
    <h3 className="font-medium">{name}</h3>
    <p className="text-muted-foreground mt-1 text-sm">{description}.</p>
    <div className="mt-6 flex h-10 items-baseline gap-1">{price}</div>
    <div className="mt-6 grid">{action}</div>
    <div className="mt-8 flex flex-col gap-3 border-t pt-6 text-sm">
      {includes && (
        <p className="text-muted-foreground">Everything in {includes}, plus</p>
      )}
      <ul className="flex flex-col gap-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2.5">
            <HugeiconsIcon
              icon={Tick02Icon}
              strokeWidth={2}
              className="text-primary mt-0.5 size-4 shrink-0"
            />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  </article>
)

const Price = ({ period, plan }: { period: Period; plan: PricingPlan }) => (
  <>
    <NumberFlow
      value={plan.price[period]}
      className="text-4xl font-semibold tracking-tight [--number-flow-mask-height:0px]"
      format={{
        currency: 'USD',
        currencyDisplay: 'narrowSymbol',
        maximumFractionDigits: 0,
        style: 'currency',
      }}
    />
    <span className="text-muted-foreground text-sm">
      {period === 'monthly' ? '/ month' : '/ year'}
    </span>
  </>
)

export const Pricing = () => {
  const { data: session } = authClient.useSession()
  const { subscription } = useSubscription()
  const [period, setPeriod] = useState<Period>('monthly')

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6"
    >
      <Reveal className="flex flex-col items-start gap-6">
        <SectionHeading id="pricing-heading" title="Start free.">
          Upgrade for more AI.
        </SectionHeading>
        <Tabs
          value={period}
          onValueChange={(value: Period) => setPeriod(value)}
        >
          <TabsList aria-label="Billing period">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly, 2 months free</TabsTrigger>
          </TabsList>
        </Tabs>
      </Reveal>
      <Reveal className="mt-10 grid gap-4 lg:grid-cols-3">
        <PlanCard
          name={HOBBY_PLAN.name}
          description={HOBBY_PLAN.description}
          features={HOBBY_PLAN.features}
          price={<Price period={period} plan={HOBBY_PLAN} />}
          action={
            <Button
              size="lg"
              variant="outline"
              render={<Link to="/download" />}
            >
              Download
            </Button>
          }
        />
        <PlanCard
          highlighted
          name={PRO_PLAN.name}
          description={PRO_PLAN.description}
          features={PRO_PLAN.features}
          includes={HOBBY_PLAN.name}
          price={<Price period={period} plan={PRO_PLAN} />}
          action={
            subscription ? (
              <Button size="lg" render={<Link to="/account" />}>
                Manage plan
              </Button>
            ) : (
              <Button
                size="lg"
                render={
                  <Link
                    to={session ? '/account' : '/sign-in'}
                    search={{ period }}
                  />
                }
              >
                Try free for 7 days
              </Button>
            )
          }
        />
        <PlanCard
          name="Enterprise"
          description="Tamery for your whole team, on your terms"
          features={ENTERPRISE_FEATURES}
          includes={PRO_PLAN.name}
          price={
            <span className="text-4xl leading-none font-semibold tracking-tight">
              Custom
            </span>
          }
          action={<ContactSalesDialog />}
        />
      </Reveal>
    </section>
  )
}
