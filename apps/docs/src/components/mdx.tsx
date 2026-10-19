import {
  Alert02Icon,
  InformationCircleIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@tamery/ui/components/alert'
import { Badge } from '@tamery/ui/components/badge'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyIconButton } from '@tamery/ui/components/custom/copy-button'
import { Kbd } from '@tamery/ui/components/kbd'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tamery/ui/components/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@tamery/ui/components/tabs'
import { cn } from '@tamery/ui/lib/utils'
import type { MDXComponents } from 'mdx/types'
import { isValidElement, useState } from 'react'
import type { ReactNode } from 'react'

import { DocsLink } from './docs-link'

const LANGUAGE_LABELS: Record<string, string> = {
  bash: 'Bash',
  sql: 'SQL',
  text: 'Text',
  ts: 'TypeScript',
  tsx: 'TSX',
}

const nodeText = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(nodeText).join('')
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return nodeText(node.props.children)
  }

  return ''
}

const Fence = ({ children }: { children?: ReactNode }) => {
  const codeElement = isValidElement<{
    children?: ReactNode
    className?: string
  }>(children)
    ? children
    : null
  const code = nodeText(codeElement?.props.children ?? children).replace(
    /\n$/u,
    ''
  )
  const language =
    codeElement?.props.className?.match(/language-(?<language>[\w-]+)/u)?.groups
      ?.language ?? 'text'

  return (
    <div className="bg-foreground/3 my-4 overflow-hidden rounded-lg">
      <div className="text-muted-foreground text-2xs flex h-6 items-center gap-0.5 pr-0.5 pl-2">
        <span className="min-w-0 flex-1 truncate">
          {LANGUAGE_LABELS[language] ?? language}
        </span>
        <CopyIconButton label="Copy" text={code} />
      </div>
      <div className="max-h-96 overflow-auto pb-2">
        <CodeBlock code={code} language={language} size="xs" />
      </div>
    </div>
  )
}

const Callout = ({
  children,
  icon,
  title,
  variant,
}: {
  children?: ReactNode
  icon: IconSvgElement
  title: string
  variant?: 'default' | 'destructive' | 'success'
}) => (
  <div className="my-4">
    <Alert variant={variant}>
      <HugeiconsIcon icon={icon} strokeWidth={2} />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="[&_p]:my-0">{children}</AlertDescription>
    </Alert>
  </div>
)

const DocsCard = ({
  children,
  href,
  title,
}: {
  children?: ReactNode
  href?: string
  title: string
}) => {
  const body = (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <div className="[&_p]:my-0">{children}</div>
        </CardDescription>
      </CardHeader>
    </Card>
  )

  if (!href) {
    return body
  }

  return (
    <DocsLink
      className="text-foreground focus-visible:focus-ring [&:hover>[data-slot=card]]:bg-accent cursor-default rounded-4xl"
      href={href}
    >
      {body}
    </DocsLink>
  )
}

const nodesOf = (children: ReactNode) =>
  Array.isArray(children) ? children : [children]

const Steps = ({ children }: { children?: ReactNode }) => (
  <ol className="my-6 flex flex-col">
    {nodesOf(children).map((child, index) => {
      if (!isValidElement<{ children?: ReactNode; title?: string }>(child)) {
        return child
      }

      return (
        <li
          className="flex gap-3 pb-6 last:pb-0"
          key={child.props.title ?? index}
        >
          <span className="bg-secondary text-secondary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
            {index + 1}
          </span>
          <div className="min-w-0">
            {child.props.title && (
              <div className="text-foreground font-medium">
                {child.props.title}
              </div>
            )}
            <div className="[&_p]:my-2">{child.props.children}</div>
          </div>
        </li>
      )
    })}
  </ol>
)

const Step = ({ children }: { children?: ReactNode; title?: string }) =>
  children

const DocsTabs = ({ children }: { children?: ReactNode }) => {
  const tabs = nodesOf(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode; title?: string }>(child) &&
    child.props.title
      ? [{ body: child.props.children, title: child.props.title }]
      : []
  )
  const [selected, setSelected] = useState(tabs[0]?.title ?? '')

  return (
    <Tabs className="my-6" onValueChange={setSelected} value={selected}>
      <TabsList variant="line">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.title} value={tab.title}>
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.title} value={tab.title}>
          <div className="mt-4">{tab.body}</div>
        </TabsContent>
      ))}
    </Tabs>
  )
}

const Tab = ({ children }: { children?: ReactNode; title?: string }) => children

const ParamField = ({
  body,
  children,
  header,
  path,
  query,
  type: valueType,
}: {
  body?: string
  children?: ReactNode
  header?: string
  path?: string
  query?: string
  type?: string
}) => (
  <div className="border-border flex flex-col gap-1 border-b py-3 first:mt-4">
    <div className="flex flex-wrap items-center gap-2">
      <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
        {query ?? path ?? body ?? header}
      </code>
      {valueType && (
        <Badge size="sm" variant="outline">
          {valueType}
        </Badge>
      )}
    </div>
    <div className="text-muted-foreground text-sm [&_p]:my-0">{children}</div>
  </div>
)

export const mdxComponents = {
  Card: DocsCard,
  CardGroup: ({ children, cols }: { children?: ReactNode; cols?: number }) => (
    <div
      className={cn(
        'my-6 grid gap-3',
        cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
      )}
    >
      {children}
    </div>
  ),
  Note: ({ children }: { children?: ReactNode }) => (
    <Callout icon={InformationCircleIcon} title="Note">
      {children}
    </Callout>
  ),
  ParamField,
  Step,
  Steps,
  Tab,
  Tabs: DocsTabs,
  Tip: ({ children }: { children?: ReactNode }) => (
    <Callout icon={Tick02Icon} title="Tip" variant="success">
      {children}
    </Callout>
  ),
  Warning: ({ children }: { children?: ReactNode }) => (
    <Callout icon={Alert02Icon} title="Warning" variant="destructive">
      {children}
    </Callout>
  ),
  a: ({ children, href }: { children?: ReactNode; href?: string }) =>
    href ? <DocsLink href={href}>{children}</DocsLink> : children,
  code: ({
    children,
    className,
  }: {
    children?: ReactNode
    className?: string
  }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
        {children}
      </code>
    ),
  kbd: ({ children }: { children?: ReactNode }) => (
    <Kbd variant="keycap">{children}</Kbd>
  ),
  pre: Fence,
  table: Table,
  tbody: TableBody,
  td: TableCell,
  th: TableHead,
  thead: TableHeader,
  tr: TableRow,
} satisfies MDXComponents
