import { Button } from '@tamery/ui/components/button'
import { Input } from '@tamery/ui/components/input'
import { Textarea } from '@tamery/ui/components/textarea'
import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { inputGroupAddonVariants, inputGroupButtonVariants } from './input-group.utils'

function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        `
          group/input-group relative flex h-8 w-full min-w-0 items-center
          rounded-2xl border border-transparent bg-input
          transition-[color,box-shadow] duration-200 outline-none
          focus-within:in-data-[slot=combobox-content]:border-inherit
          focus-within:in-data-[slot=combobox-content]:ring-0
          has-[[data-slot=input-group-control]:focus-visible]:border-ring
          has-[[data-slot=input-group-control]:focus-visible]:ring-3
          has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30
          has-[[data-slot][aria-invalid=true]]:border-destructive
          has-[[data-slot][aria-invalid=true]]:ring-3
          has-[[data-slot][aria-invalid=true]]:ring-destructive/20
          has-[>[data-align=block-end]]:h-auto
          has-[>[data-align=block-end]]:flex-col
          has-[>[data-align=block-start]]:h-auto
          has-[>[data-align=block-start]]:flex-col
          has-[>textarea]:h-auto
          dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40
          has-[>[data-align=block-end]]:[&>input]:pt-3
          has-[>[data-align=block-start]]:[&>input]:pb-3
          has-[>[data-align=inline-end]]:[&>input]:pr-1.5
          has-[>[data-align=inline-start]]:[&>input]:pl-1.5
        `,
        className,
      )}
      {...props}
    />
  )
}

function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    // Mouse-only convenience: clicking the addon focuses the input; keyboard users tab to it directly
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={e => {
        if ((e.target as HTMLElement).closest('button')) {
          return
        }
        e.currentTarget.parentElement?.querySelector('input')?.focus()
      }}
      {...props}
    />
  )
}

function InputGroupButton({
  className,
  type = 'button',
  variant = 'ghost',
  size = 'xs',
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'size' | 'type'> &
  VariantProps<typeof inputGroupButtonVariants> & {
    type?: 'button' | 'submit' | 'reset'
  }) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        `
          flex items-center gap-2 text-sm text-muted-foreground
          [&_svg]:pointer-events-none
          [&_svg:not([class*='size-'])]:size-4
        `,
        className,
      )}
      {...props}
    />
  )
}

function InputGroupInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        `
          flex-1 rounded-none border-0 bg-transparent shadow-none ring-0
          focus-visible:ring-0
          aria-invalid:ring-0
          dark:bg-transparent
        `,
        className,
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        `
          flex-1 resize-none rounded-none border-0 bg-transparent py-2
          shadow-none ring-0
          focus-visible:ring-0
          aria-invalid:ring-0
          dark:bg-transparent
        `,
        className,
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
}
