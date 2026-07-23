// oxlint-disable jsx-a11y/anchor-has-content, jsx-a11y/no-static-element-interactions
import type { LinkComponent } from '@tanstack/react-router'
import { createLink } from '@tanstack/react-router'
import type { ComponentProps } from 'react'
import { forwardRef, useRef } from 'react'

import { isPlainPress } from '~/lib/press-nav'

interface PressAnchorProps extends ComponentProps<'a'> {
  activateOn?: 'press' | 'click'
}

const PressAnchor = forwardRef<HTMLAnchorElement, PressAnchorProps>(
  ({ activateOn = 'press', onMouseDown, onClickCapture, ...props }, ref) => {
    const pressNavRef = useRef(false)

    if (activateOn === 'click') {
      return <a ref={ref} onMouseDown={onMouseDown} onClickCapture={onClickCapture} {...props} />
    }

    return (
      <a
        ref={ref}
        {...props}
        onMouseDown={e => {
          onMouseDown?.(e)
          if (e.defaultPrevented || !isPlainPress(e)) return
          if (props.target && props.target !== '_self') return
          pressNavRef.current = true
          e.currentTarget.click()
        }}
        onClickCapture={e => {
          onClickCapture?.(e)
          if (e.detail === 0) return
          if (pressNavRef.current) {
            pressNavRef.current = false
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      />
    )
  },
)

const CreatedLink = createLink(PressAnchor)

export const Link: LinkComponent<typeof PressAnchor> = props => <CreatedLink {...props} />
