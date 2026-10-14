import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyIconButton } from '@tamery/ui/components/custom/copy-button'
import type { ReactNode } from 'react'

export const TerminalLine = ({
  children,
  code,
  display = code,
  glyph,
  language,
  onCopy,
}: {
  children?: ReactNode
  code: string
  display?: string
  glyph?: string
  language: string
  onCopy: () => void
}) => (
  <div className="flex flex-col gap-1 py-2.5 pr-2 pl-3.5">
    {children}
    <div className="flex items-center gap-1">
      {glyph && (
        <span
          aria-hidden
          className="text-success self-start font-mono text-xs/5"
        >
          {glyph}
        </span>
      )}
      <CodeBlock
        code={display}
        language={language}
        size="xs"
        wrap
        className="min-w-0 flex-1"
      />
      <CopyIconButton label="Copy" text={code} onClick={onCopy} />
    </div>
  </div>
)
