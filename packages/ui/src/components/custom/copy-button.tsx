import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { copy } from '@tamery/ui/lib/copy'
import type { ComponentProps, ReactNode } from 'react'
import { useState } from 'react'

import { Button } from '../button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip'
import { ContentSwitch } from './content-switch'

const defaultCopyIcon = <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
const defaultSuccessIcon = (
  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-success" />
)

export const CopyButton = ({
  text,
  copyIcon = defaultCopyIcon,
  successIcon = defaultSuccessIcon,
  children,
  ...props
}: {
  text: string | (() => string)
  copyIcon?: ReactNode
  successIcon?: ReactNode
} & ComponentProps<typeof Button>) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    copy(typeof text === 'function' ? text() : text)
    setCopied(true)
  }

  return (
    <Button
      {...props}
      onClick={(e) => {
        props.onClick?.(e)
        handleCopy()
      }}
    >
      <ContentSwitch
        active={copied}
        onSwitchEnd={() => setCopied(false)}
        activeContent={successIcon}
      >
        {copyIcon}
      </ContentSwitch>
      {children}
    </Button>
  )
}

export const CopyIconButton = ({
  label,
  side = 'bottom',
  ...props
}: {
  label: string
  side?: ComponentProps<typeof TooltipContent>['side']
} & ComponentProps<typeof CopyButton>) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <CopyButton
          size="icon-xs"
          variant="ghost-muted"
          aria-label={label}
          {...props}
        />
      }
    />
    <TooltipContent side={side}>{label}</TooltipContent>
  </Tooltip>
)
