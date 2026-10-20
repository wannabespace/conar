import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyIconButton } from '@tamery/ui/components/custom/copy-button'
import { isValidElement } from 'react'
import type { ReactNode } from 'react'

const LANGUAGE_LABELS: Record<string, string> = {
  bash: 'Bash',
  sql: 'SQL',
  text: 'Text',
  ts: 'TypeScript',
  tsx: 'TSX',
}

export const Fence = ({ children }: { children?: ReactNode }) => {
  if (!isValidElement<{ children: string; className?: string }>(children)) {
    return null
  }

  const code = children.props.children.trimEnd()
  const language = children.props.className?.replace('language-', '') ?? 'text'

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
