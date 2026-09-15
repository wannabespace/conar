import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@tamery/ui/components/drawer'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@tamery/ui/components/field'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import type { AnyFormApi } from '@tanstack/react-form'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'

import type { DefinitionsState } from '../-hooks/use-definitions-state'

export interface InspectorProps<T> {
  item: T | null
  onOpenChange: (open: boolean) => void
}

export type SectionInspectorProps<T> = DefinitionsState &
  InspectorProps<T> & { queryKey: readonly unknown[] }

export const InspectorShell = ({
  children,
  onOpenChange,
  open,
}: {
  children: ReactNode
  onOpenChange: (open: boolean) => void
  open: boolean
}) => (
  <Drawer
    open={open}
    onOpenChange={onOpenChange}
    size="sm"
    swipeDirection="right"
  >
    <DrawerContent className="sm:[--drawer-content-width:36rem]!">
      {children}
    </DrawerContent>
  </Drawer>
)

export const InspectorHeader = ({
  description,
  title,
}: {
  description: string
  title: string
}) => (
  <DrawerHeader showCloseButton>
    <DrawerTitle data-mask className="truncate">
      {title}
    </DrawerTitle>
    <DrawerDescription data-mask className="truncate">
      {description}
    </DrawerDescription>
  </DrawerHeader>
)

export const InspectorSections = ({ children }: { children: ReactNode }) => (
  <div className="scroll-fade no-scrollbar flex min-h-0 flex-1 flex-col divide-y overflow-y-auto">
    {children}
  </div>
)

export const InspectorSection = ({
  action,
  children,
  className,
  description,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  className?: string
  description?: string
  title: string
}) => (
  <section className={cn('flex flex-col gap-3 p-4', className)}>
    <div className="flex items-start justify-between gap-2">
      <div className="flex flex-col gap-1">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {title}
        </h3>
        {description && (
          <FieldDescription size="sm">{description}</FieldDescription>
        )}
      </div>
      {action}
    </div>
    <FieldGroup size="sm" className="min-h-0 flex-1">
      {children}
    </FieldGroup>
  </section>
)

export const InspectorOption = ({
  children,
  description,
  htmlFor,
  title,
}: {
  children: ReactNode
  description: string
  htmlFor: string
  title: string
}) => (
  <FieldLabel htmlFor={htmlFor}>
    <Field orientation="horizontal">
      <FieldContent>
        <FieldTitle>{title}</FieldTitle>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      {children}
    </Field>
  </FieldLabel>
)

export const InspectorDefinition = ({ code }: { code: string }) => (
  <InspectorSection
    title="SQL"
    description="How the database defines this object today. Read-only."
    action={
      <Tooltip>
        <TooltipTrigger
          render={
            <CopyButton
              size="icon-xs"
              variant="ghost"
              tone="muted"
              aria-label="Copy SQL"
              className="-mt-0.5"
              text={code}
            />
          }
        />
        <TooltipContent side="left">Copy SQL</TooltipContent>
      </Tooltip>
    }
  >
    <CodeBlock code={code} language="sql" size="xs" surface="field" wrap />
  </InspectorSection>
)

export interface InspectorWarning {
  action: string
  description: ReactNode
}

export const InspectorFooter = ({
  canSave,
  error,
  form,
  readOnly,
  saveLabel,
  saving,
  warning,
}: {
  canSave: boolean
  error: Error | null
  form: AnyFormApi
  readOnly: boolean
  saveLabel: string
  saving: boolean
  warning?: InspectorWarning | undefined
}) => {
  const saveEnabled = !readOnly && canSave && !saving

  const onSave = async () => {
    await form.handleSubmit()

    const invalid = Object.keys(form.state.fieldMeta).find(
      (name) => !form.state.fieldMeta[name]?.isValid
    )

    if (invalid) {
      document.querySelector<HTMLElement>(`#${invalid}`)?.focus()
    }
  }

  useHotkeys(
    [
      {
        callback: onSave,
        hotkey: 'Mod+Enter',
        options: { enabled: saveEnabled },
      },
    ],
    { preventDefault: true }
  )

  const saveButton = (
    <Button
      variant={warning ? 'warning' : 'default'}
      disabled={!saveEnabled}
      onClick={onSave}
    >
      <LoadingContent loading={saving}>
        {warning ? warning.action : saveLabel}
      </LoadingContent>
    </Button>
  )

  return (
    <>
      <AnimatePresence initial={false}>
        {error && (
          <MotionCollapse key="error" className="shrink-0">
            <Alert variant="destructive" className="mx-3 mb-3">
              <AlertDescription data-mask className="wrap-break-word">
                {error.message}
              </AlertDescription>
            </Alert>
          </MotionCollapse>
        )}
      </AnimatePresence>
      <DrawerFooter>
        <DrawerClose render={<Button variant="outline" className="ml-auto" />}>
          {readOnly ? 'Close' : 'Cancel'}
        </DrawerClose>
        {!readOnly &&
          (warning ? (
            <Tooltip>
              <TooltipTrigger render={saveButton} />
              <TooltipContent>
                <span className="block text-pretty">{warning.description}</span>
              </TooltipContent>
            </Tooltip>
          ) : (
            saveButton
          ))}
      </DrawerFooter>
    </>
  )
}
