import { copy } from '@tamery/ui/lib/copy'
import { RiCheckLine, RiFileCopyLine } from '@remixicon/react'
import type { ComponentProps, ReactNode } from 'react'
import { useState } from 'react'

import { Button } from '../button'
import { ContentSwitch } from './content-switch'

const defaultCopyIcon = <RiFileCopyLine className="size-4" />
const defaultSuccessIcon = <RiCheckLine className="size-4 text-success" />

export function CopyButton({
  text,
  copyIcon = defaultCopyIcon,
  successIcon = defaultSuccessIcon,
  ...props
}: {
  text: string | (() => string)
  copyIcon?: ReactNode
  successIcon?: ReactNode
} & Omit<ComponentProps<typeof Button>, 'children'>) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    copy(typeof text === 'function' ? text() : text)
    setCopied(true)
  }

  return (
    <Button
      {...props}
      onClick={e => {
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
    </Button>
  )
}
