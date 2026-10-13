import { BREW_INSTALL_COMMAND } from '@tamery/shared/constants'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyIconButton } from '@tamery/ui/components/custom/copy-button'
import { smallItemInsetClassName } from '@tamery/ui/components/item'
import { cn } from '@tamery/ui/lib/utils'

export const HomebrewInstall = () => (
  <div className="border-foreground/6 border-t">
    <div
      className={cn(
        smallItemInsetClassName,
        'flex h-11 items-center justify-between gap-2 pr-2'
      )}
    >
      <span className="text-muted-foreground text-sm">
        Or install with Homebrew
      </span>
      <CopyIconButton text={BREW_INSTALL_COMMAND} label="Copy command" />
    </div>
    <CodeBlock
      variant="inset"
      padding="item"
      size="xs"
      language="bash"
      code={BREW_INSTALL_COMMAND}
    />
  </div>
)
