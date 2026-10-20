import { cardClass } from '@tamery/ui/components/card.utils'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyIconButton } from '@tamery/ui/components/custom/copy-button'
import { cn } from '@tamery/ui/lib/utils'
import { isValidElement } from 'react'
import type { ReactNode } from 'react'

export const Fence = ({ children }: { children?: ReactNode }) => {
  if (!isValidElement<{ children: string; className?: string }>(children)) {
    return null
  }

  const code = children.props.children.trimEnd()
  const language = children.props.className?.replace('language-', '') ?? 'text'

  return (
    <div className={cn(cardClass, 'my-6 flex items-start')}>
      <CodeBlock
        className="max-h-96 min-w-0 flex-1"
        code={code}
        language={language}
        padding="popup"
        size="xs"
      />
      <CopyIconButton
        className="m-2 ml-0"
        label="Copy"
        side="left"
        text={code}
      />
    </div>
  )
}
