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
      className={cn('bg-card border p-8 rounded-2xl', className)}
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
      <h3 className="flex text-muted-foreground items-center gap-2 font-medium mb-3 text-sm tracking-wide">
        {icon}
        {title}
      </h3>
      <p className="text-xl font-semibold leading-7 text-foreground">{description}</p>
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
    <div className="flex items-center border rounded-md overflow-hidden h-7 dark:bg-input/30 transition-colors">
      <div className="text-xs flex items-center gap-1 px-2 h-full font-medium text-foreground">
        <RiDatabase2Line className="size-3 text-primary/70" aria-hidden="true" />
        {name}
      </div>
      <Separator orientation="vertical" />
      <div className="text-xs px-2 py-0.5 h-full text-muted-foreground font-mono">
        {operator}
      </div>
      <Separator orientation="vertical" />
      <div className="text-xs px-2 font-mono truncate max-w-20 sm:max-w-40 lg:max-w-60 text-foreground">
        {value}
      </div>
      <Separator orientation="vertical" className="h-7" />
      <button
        type="button"
        className="flex items-center justify-center h-full w-7 hover:bg-muted/50 transition-colors"
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
    <div className="space-y-4 sm:space-y-6">
      <FeatureCardTitle
        className="mb-6 sm:mb-8"
        title="Smart AI Data Filtering"
        description="Let AI help you create filters naturally - no more manual entry needed."
        icon={<RiFilterLine className="size-4" aria-hidden="true" />}
      />
      <div className="space-y-3 sm:space-y-4">
        <div className="relative w-full">
          <RiBardLine className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            className="pl-10 pr-12 w-full focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary text-sm"
            value="price between 500 and 1000"
            readOnly
            aria-label="AI filter input"
          />
          <Button
            variant="secondary"
            size="icon-xs"
            className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="Send filter request"
          >
            <RiSendPlaneLine className="size-3" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <FilterItem name="price" operator=">=" value="500" />
          <FilterItem name="price" operator="<=" value="1000" />
          <Button
            variant="outline"
            size="icon-xs"
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="Add new filter"
          >
            <RiAddLine className="size-3" aria-hidden="true" />
          </Button>
        </div>
        <div className="border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-xs min-w-[400px]" role="table" aria-label="Filtered data results">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 sm:p-3 font-medium text-foreground">ID</th>
                <th className="text-left p-2 sm:p-3 font-medium text-foreground">Name</th>
                <th className="text-left p-2 sm:p-3 font-medium text-foreground">Price</th>
                <th className="text-left p-2 sm:p-3 font-medium text-foreground">Category</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t hover:bg-muted/30 transition-colors">
                <td className="p-2 sm:p-3 font-mono">1</td>
                <td className="p-2 sm:p-3">Laptop</td>
                <td className="p-2 sm:p-3 font-mono">899</td>
                <td className="p-2 sm:p-3">Electronics</td>
              </tr>
              <tr className="border-t hover:bg-muted/30 transition-colors">
                <td className="p-2 sm:p-3 font-mono">2</td>
                <td className="p-2 sm:p-3">Coffee Maker</td>
                <td className="p-2 sm:p-3 font-mono">650</td>
                <td className="p-2 sm:p-3">Kitchen</td>
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
      <div className="w-7 h-7 bg-muted rounded-full flex-shrink-0 flex items-center justify-center">
        <RiUserLine className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="bg-muted rounded-lg px-4 py-3 text-sm text-foreground max-w-[85%]">
        {children}
      </div>
    </div>
  )
}

function AIMessage({ children, ...props }: MessageProps) {
  return (
    <div className="flex gap-3 justify-end" {...props}>
      <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 text-sm max-w-[85%] shadow-sm">
        {children}
      </div>
      <div className="flex justify-center items-center size-7 bg-primary rounded-full flex-shrink-0 text-white text-xs font-medium shadow-sm">
        AI
      </div>
    </div>
  )
}

function ChatWithDB() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <FeatureCardTitle
        className="mb-6 sm:mb-8"
        title="Chat with Your Database"
        description="Ask questions in natural language and get instant answers from your data."
        icon={<RiChatAiLine className="size-4" aria-hidden="true" />}
      />
      <div className="space-y-3 sm:space-y-4">
        <UserMessage aria-label="User query">Show me users with orders</UserMessage>
        <AIMessage aria-label="AI response">
          Here's a query that might help you:
          <br />
          <code className="font-mono text-xs bg-primary-foreground/20 px-2 py-1 rounded mt-2 inline-block break-all">
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
    <div className="space-y-4 sm:space-y-6">
      <FeatureCardTitle
        className="mb-6 sm:mb-8"
        title="Reliable Cloud Sync"
        description="Sync your connections with the cloud to keep them safe and accessible from any device."
        icon={<RiCloudLine className="size-4" aria-hidden="true" />}
      />
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl border border-border/50">
          <div className="size-10 sm:size-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
            <RiDatabase2Line className="size-5 sm:size-6 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Local Database</div>
            <div className="text-xs text-muted-foreground font-mono truncate">postgresql://localhost:5432</div>
          </div>
          <div className="text-xs flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-green-600 dark:text-green-400 font-medium">Synced</span>
            <span className="text-muted-foreground hidden sm:block">without password</span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl border border-border/50">
          <div className="size-10 sm:size-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
            <RiDatabase2Line className="size-5 sm:size-6 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Production Database</div>
            <div className="text-xs text-muted-foreground font-mono truncate">postgresql://prod.example.com:5432</div>
          </div>
          <div className="text-xs flex items-center gap-1 flex-shrink-0">
            <span className="text-green-600 dark:text-green-400 font-medium">Synced</span>
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
      'p-3 sm:p-4 bg-gradient-to-br rounded-lg border hover:shadow-md transition-all duration-300 cursor-pointer',
      colorClasses[color],
    )}
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className={cn(
          'size-6 sm:size-7 rounded-md flex items-center justify-center flex-shrink-0',
          bgColorClasses[color],
        )}
        >
          <div className={cn(iconColorClasses[color])} aria-hidden="true">
            {icon}
          </div>
        </div>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed">{description}</div>
    </div>
  )
}

function ManageData() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <FeatureCardTitle
        className="mb-6 sm:mb-8"
        title="Comprehensive Data Management"
        description="Manage your data with ease. Add, edit, and delete data with a few clicks."
        icon={<RiDatabase2Line className="size-4" aria-hidden="true" />}
      />
      <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
    <section aria-labelledby="features-heading" className="py-8 sm:py-12 lg:py-16">
      <div className="mb-12 sm:mb-16 text-center">
        <h2 id="features-heading" className="text-center mb-3 text-muted-foreground text-sm uppercase tracking-wide font-medium">
          Features
        </h2>
        <p className="text-center text-balance text-3xl sm:text-4xl md:text-5xl font-bold max-w-3xl mx-auto leading-tight">
          All the basic features you expect, plus powerful capabilities that set us apart
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-7xl mx-auto px-4">
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
