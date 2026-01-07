import type { ComponentProps } from 'react'
import { Button } from '@conar/ui/components/button'
import { Input } from '@conar/ui/components/input'
import { Separator } from '@conar/ui/components/separator'
import { cn } from '@conar/ui/lib/utils'
import { RiAddLine, RiBardLine, RiChatAiLine, RiCloseLine, RiCloudLine, RiDatabase2Line, RiDeleteBinLine, RiEditLine, RiEyeLine, RiFilterLine, RiSendPlaneLine, RiUserLine } from '@remixicon/react'

interface FeatureCardProps extends ComponentProps<'article'> {
  featureId: string
}

function FeatureCard({ className, children, featureId, ...props }: FeatureCardProps) {
  return (
    <article
      className={cn('rounded-2xl border bg-card p-8', className)}
      data-feature={featureId}
      {...props}
    >
      {children}
    </article>
  )
}

interface FeatureCardTitleProps {
  title: string
  description: string
  icon: React.ReactNode
  className?: string
}

function FeatureCardTitle({ title, description, icon, className }: FeatureCardTitleProps) {
  return (
    <header className={cn('flex flex-col', className)}>
      <h3 className={`
        mb-3 flex items-center gap-2 text-sm font-medium tracking-wide
        text-muted-foreground
      `}
      >
        {icon}
        {title}
      </h3>
      <p className="text-xl leading-7 font-semibold text-foreground">{description}</p>
    </header>
  )
}

interface FilterItemProps {
  name: string
  operator: string
  value: string
  onRemove?: () => void
}

function FilterItem({ name, operator, value, onRemove }: FilterItemProps) {
  return (
    <div className={`
      flex h-7 items-center overflow-hidden rounded-md border transition-colors
      dark:bg-input/30
    `}
    >
      <div className={`
        flex h-full items-center gap-1 px-2 text-xs font-medium text-foreground
      `}
      >
        <RiDatabase2Line className="size-3 text-primary/70" aria-hidden="true" />
        {name}
      </div>
      <Separator orientation="vertical" />
      <div className={`
        h-full px-2 py-0.5 font-mono text-xs text-muted-foreground
      `}
      >
        {operator}
      </div>
      <Separator orientation="vertical" />
      <div className={`
        max-w-20 truncate px-2 font-mono text-xs text-foreground
        sm:max-w-40
        lg:max-w-60
      `}
      >
        {value}
      </div>
      <Separator orientation="vertical" className="h-7" />
      <button
        type="button"
        className={`
          flex h-full w-7 items-center justify-center transition-colors
          hover:bg-muted/50
        `}
        onClick={onRemove}
        aria-label={`Remove filter ${name} ${operator} ${value}`}
      >
        <RiCloseLine className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

function FilterWithAI() {
  return (
    <div className={`
      space-y-4
      sm:space-y-6
    `}
    >
      <FeatureCardTitle
        className={`
          mb-6
          sm:mb-8
        `}
        title="Smart AI Data Filtering"
        description="Let AI help you create filters naturally - no more manual entry needed."
        icon={<RiFilterLine className="size-4" aria-hidden="true" />}
      />
      <div className={`
        space-y-3
        sm:space-y-4
      `}
      >
        <div className="relative w-full">
          <RiBardLine
            className={`
              pointer-events-none absolute top-1/2 left-3 size-4
              -translate-y-1/2 text-muted-foreground
            `}
            aria-hidden="true"
          />
          <Input
            className={`
              w-full pr-12 pl-10 text-sm
              focus-visible:border-primary focus-visible:ring-2
              focus-visible:ring-primary/20
            `}
            value="price between 500 and 1000"
            readOnly
            aria-label="AI filter input"
          />
          <Button
            variant="secondary"
            size="icon-xs"
            className={`
              absolute top-1/2 right-2 -translate-y-1/2 transition-colors
              hover:bg-primary hover:text-primary-foreground
            `}
            aria-label="Send filter request"
          >
            <RiSendPlaneLine className="size-3" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterItem name="price" operator=">=" value="500" />
          <FilterItem name="price" operator="<=" value="1000" />
          <Button
            variant="outline"
            size="icon-xs"
            className={`
              transition-colors
              hover:bg-primary hover:text-primary-foreground
            `}
            aria-label="Add new filter"
          >
            <RiAddLine className="size-3" aria-hidden="true" />
          </Button>
        </div>
        <div className="overflow-hidden overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[400px] text-xs" role="table" aria-label="Filtered data results">
            <thead className="bg-muted/50">
              <tr>
                <th className={`
                  p-2 text-left font-medium text-foreground
                  sm:p-3
                `}
                >
                  ID
                </th>
                <th className={`
                  p-2 text-left font-medium text-foreground
                  sm:p-3
                `}
                >
                  Name
                </th>
                <th className={`
                  p-2 text-left font-medium text-foreground
                  sm:p-3
                `}
                >
                  Price
                </th>
                <th className={`
                  p-2 text-left font-medium text-foreground
                  sm:p-3
                `}
                >
                  Category
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className={`
                border-t transition-colors
                hover:bg-muted/30
              `}
              >
                <td className={`
                  p-2 font-mono
                  sm:p-3
                `}
                >
                  1
                </td>
                <td className={`
                  p-2
                  sm:p-3
                `}
                >
                  Laptop
                </td>
                <td className={`
                  p-2 font-mono
                  sm:p-3
                `}
                >
                  899
                </td>
                <td className={`
                  p-2
                  sm:p-3
                `}
                >
                  Electronics
                </td>
              </tr>
              <tr className={`
                border-t transition-colors
                hover:bg-muted/30
              `}
              >
                <td className={`
                  p-2 font-mono
                  sm:p-3
                `}
                >
                  2
                </td>
                <td className={`
                  p-2
                  sm:p-3
                `}
                >
                  Coffee Maker
                </td>
                <td className={`
                  p-2 font-mono
                  sm:p-3
                `}
                >
                  650
                </td>
                <td className={`
                  p-2
                  sm:p-3
                `}
                >
                  Kitchen
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface MessageProps {
  'children': React.ReactNode
  'aria-label'?: string
}

function UserMessage({ children, ...props }: MessageProps) {
  return (
    <div className="flex gap-3" {...props}>
      <div className={`
        flex size-7 shrink-0 items-center justify-center rounded-full bg-muted
      `}
      >
        <RiUserLine className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className={`
        max-w-[85%] rounded-lg bg-muted px-4 py-3 text-sm text-foreground
      `}
      >
        {children}
      </div>
    </div>
  )
}

function AIMessage({ children, ...props }: MessageProps) {
  return (
    <div className="flex justify-end gap-3" {...props}>
      <div className={`
        max-w-[85%] rounded-lg bg-primary px-4 py-3 text-sm
        text-primary-foreground shadow-sm
      `}
      >
        {children}
      </div>
      <div className={`
        flex size-7 shrink-0 items-center justify-center rounded-full bg-primary
        text-xs font-medium text-white shadow-sm
      `}
      >
        AI
      </div>
    </div>
  )
}

function ChatWithDB() {
  return (
    <div className={`
      space-y-4
      sm:space-y-6
    `}
    >
      <FeatureCardTitle
        className={`
          mb-6
          sm:mb-8
        `}
        title="Chat with Your Database"
        description="Ask questions in natural language and get instant answers from your data."
        icon={<RiChatAiLine className="size-4" aria-hidden="true" />}
      />
      <div className={`
        space-y-3
        sm:space-y-4
      `}
      >
        <UserMessage aria-label="User query">Show me users with orders</UserMessage>
        <AIMessage aria-label="AI response">
          Here's a query that might help you:
          <br />
          <code className={`
            mt-2 inline-block rounded bg-primary-foreground/20 px-2 py-1
            font-mono text-xs break-all
          `}
          >
            SELECT users.*, orders.* FROM users
            <br />
            INNER JOIN orders ON users.id = orders.user_id;
          </code>
        </AIMessage>
      </div>
    </div>
  )
}

function CloudSync() {
  return (
    <div className={`
      space-y-4
      sm:space-y-6
    `}
    >
      <FeatureCardTitle
        className={`
          mb-6
          sm:mb-8
        `}
        title="Reliable Cloud Sync"
        description="Sync your connections with the cloud to keep them safe and accessible from any device."
        icon={<RiCloudLine className="size-4" aria-hidden="true" />}
      />
      <div className={`
        space-y-3
        sm:space-y-4
      `}
      >
        <div className={`
          flex items-center gap-3 rounded-xl border border-border/50
          bg-linear-to-r from-muted/30 to-muted/50 p-3
          sm:gap-4 sm:p-4
        `}
        >
          <div className={`
            flex size-10 shrink-0 items-center justify-center rounded-md
            bg-linear-to-br from-primary/20 to-primary/10
            sm:size-12
          `}
          >
            <RiDatabase2Line
              className={`
                size-5 text-primary
                sm:size-6
              `}
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">Local Database</div>
            <div className="truncate font-mono text-xs text-muted-foreground">postgresql://localhost:5432</div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
            <span className={`
              font-medium text-green-600
              dark:text-green-400
            `}
            >
              Synced
            </span>
            <span className={`
              hidden text-muted-foreground
              sm:block
            `}
            >
              without password
            </span>
          </div>
        </div>
        <div className={`
          flex items-center gap-3 rounded-xl border border-border/50
          bg-linear-to-r from-muted/30 to-muted/50 p-3
          sm:gap-4 sm:p-4
        `}
        >
          <div className={`
            flex size-10 shrink-0 items-center justify-center rounded-md
            bg-linear-to-br from-primary/20 to-primary/10
            sm:size-12
          `}
          >
            <RiDatabase2Line
              className={`
                size-5 text-primary
                sm:size-6
              `}
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">Production Database</div>
            <div className="truncate font-mono text-xs text-muted-foreground">postgresql://prod.example.com:5432</div>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs">
            <span className={`
              font-medium text-green-600
              dark:text-green-400
            `}
            >
              Synced
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface DataActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  color: 'green' | 'blue' | 'yellow' | 'red'
}

function DataActionCard({ icon, title, description, color }: DataActionCardProps) {
  const colorClasses = {
    green: 'from-green-500/10 to-green-600/10 border-green-500/20 hover:border-green-500/40 text-green-700 dark:text-green-400',
    blue: 'from-blue-500/10 to-blue-600/10 border-blue-500/20 hover:border-blue-500/40 text-blue-700 dark:text-blue-400',
    yellow: 'from-yellow-500/10 to-yellow-600/10 border-yellow-500/20 hover:border-yellow-500/40 text-yellow-700 dark:text-yellow-400',
    red: 'from-red-500/10 to-red-600/10 border-red-500/20 hover:border-red-500/40 text-red-700 dark:text-red-400',
  }

  const bgColorClasses = {
    green: 'bg-green-500/20',
    blue: 'bg-blue-500/20',
    yellow: 'bg-yellow-500/20',
    red: 'bg-red-500/20',
  }

  const iconColorClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  }

  return (
    <div className={cn(
      `
        cursor-pointer rounded-lg border bg-linear-to-br p-3 transition-all
        duration-300
        hover:shadow-md
        sm:p-4
      `,
      colorClasses[color],
    )}
    >
      <div className={`
        mb-2 flex items-center gap-2
        sm:mb-3 sm:gap-3
      `}
      >
        <div className={cn(
          `
            flex size-6 shrink-0 items-center justify-center rounded-md
            sm:size-7
          `,
          bgColorClasses[color],
        )}
        >
          <div className={cn(iconColorClasses[color])} aria-hidden="true">
            {icon}
          </div>
        </div>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="text-xs leading-relaxed text-muted-foreground">{description}</div>
    </div>
  )
}

function ManageData() {
  return (
    <div className={`
      space-y-4
      sm:space-y-6
    `}
    >
      <FeatureCardTitle
        className={`
          mb-6
          sm:mb-8
        `}
        title="Comprehensive Data Management"
        description="Manage your data with ease. Add, edit, and delete data with a few clicks."
        icon={<RiDatabase2Line className="size-4" aria-hidden="true" />}
      />
      <div className={`
        space-y-3
        sm:space-y-4
      `}
      >
        <div className={`
          grid grid-cols-1 gap-3
          sm:grid-cols-2 sm:gap-4
        `}
        >
          <DataActionCard
            icon={<RiAddLine className="size-3" />}
            title="Create"
            description="Add new records with form validation and real-time feedback"
            color="green"
          />
          <DataActionCard
            icon={<RiEyeLine className="size-3" />}
            title="View"
            description="Browse and search through data with advanced filtering"
            color="blue"
          />
          <DataActionCard
            icon={<RiEditLine className="size-3" />}
            title="Edit"
            description="Modify existing records inline with instant updates"
            color="yellow"
          />
          <DataActionCard
            icon={<RiDeleteBinLine className="size-3" />}
            title="Delete"
            description="Remove records with confirmation dialogs and undo support"
            color="red"
          />
        </div>
      </div>
      <div className="mt-4 text-xs text-muted-foreground/70 italic">
        * Some features coming in nearest releases
      </div>
    </div>
  )
}

export function Features() {
  return (
    <section
      aria-labelledby="features-heading"
      className={`
        py-8
        sm:py-12
        lg:py-16
      `}
    >
      <div className={`
        mb-12 text-center
        sm:mb-16
      `}
      >
        <h2
          id="features-heading"
          className={`
            mb-3 text-center text-sm font-medium tracking-wide
            text-muted-foreground uppercase
          `}
        >
          Features
        </h2>
        <p className={`
          mx-auto max-w-3xl text-center text-2xl leading-tight font-bold
          text-balance
          sm:text-3xl
        `}
        >
          All the basic features you expect, plus powerful capabilities that set us apart
        </p>
      </div>
      <div className={`
        mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4
        sm:gap-6
        lg:grid-cols-2
      `}
      >
        <FeatureCard featureId="ai-filtering">
          <FilterWithAI />
        </FeatureCard>
        <FeatureCard featureId="ai-chat">
          <ChatWithDB />
        </FeatureCard>
        <FeatureCard featureId="data-management">
          <ManageData />
        </FeatureCard>
        <FeatureCard featureId="cloud-sync">
          <CloudSync />
        </FeatureCard>
      </div>
    </section>
  )
}
