import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  DrawerClose,
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
import { Form, formContext } from '@tamery/ui/components/tanstack-form'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import type { AnyFormApi } from '@tanstack/react-form'
import { useHotkeys } from '@tanstack/react-hotkeys'
import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'

import type { DefinitionsState } from '../-hooks/use-definitions-state'

export interface InspectorWarning {
  action: string
  description: ReactNode
}

// The footer sits outside the scrolling form, so its save button points back
// at it by id.
const FORM_ID = 'definition-inspector'

export type SectionInspectorProps<T> = DefinitionsState & {
  item: T | null
  onOpenChange: (open: boolean) => void
  queryKey: readonly unknown[]
}

export const Inspector = ({
  canSave,
  children,
  description,
  form,
  item,
  mutation,
  noun,
  readOnly,
  saveLabel,
  warning,
}: {
  canSave: boolean
  children: ReactNode
  description: string
  form: AnyFormApi
  item: { name: string } | null
  mutation: { error: Error | null; isPending: boolean }
  noun: string
  readOnly: boolean
  saveLabel?: string
  warning?: InspectorWarning | undefined
}) => {
  const saveEnabled = !(readOnly || mutation.isPending) && canSave

  useHotkeys(
    [
      {
        callback: () => form.handleSubmit(),
        hotkey: 'Mod+Enter',
        options: { enabled: saveEnabled },
      },
    ],
    { preventDefault: true }
  )

  const saveButton = (
    <Button
      type="submit"
      form={FORM_ID}
      variant={warning ? 'warning' : 'default'}
      disabled={!saveEnabled}
    >
      <LoadingContent loading={mutation.isPending}>
        {warning?.action ?? saveLabel ?? (item ? 'Save' : `Create ${noun}`)}
      </LoadingContent>
    </Button>
  )

  return (
    <>
      <DrawerHeader showCloseButton>
        <DrawerTitle data-mask className="truncate">
          {item ? item.name : `New ${noun}`}
        </DrawerTitle>
        <DrawerDescription data-mask className="truncate">
          {description}
        </DrawerDescription>
      </DrawerHeader>
      <formContext.Provider value={form}>
        <Form
          id={FORM_ID}
          form={form}
          className="scroll-fade no-scrollbar flex min-h-0 flex-1 flex-col divide-y overflow-y-auto"
        >
          {children}
        </Form>
      </formContext.Provider>
      <AnimatePresence initial={false}>
        {mutation.error && (
          <MotionCollapse key="error" className="shrink-0">
            <Alert variant="destructive" className="mx-3 mb-3">
              <AlertDescription data-mask className="wrap-break-word">
                {mutation.error.message}
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

// Submitting owns the trip to the problem, so a form that refuses to submit
// moves focus to the first field that said no.
export const focusInvalidField = ({ formApi }: { formApi: AnyFormApi }) => {
  const invalid = Object.keys(formApi.state.fieldMeta).find(
    (name) => !formApi.state.fieldMeta[name]?.isValid
  )

  if (invalid) {
    document.querySelector<HTMLElement>(`#${invalid}`)?.focus()
  }
}

export const mysqlReplaceWarning = ({
  name,
  noun,
}: {
  name: string
  noun: string
}): InspectorWarning => ({
  action: `Replace ${noun}`,
  description: (
    <>
      MySQL cannot roll DDL back, so we drop{' '}
      <span data-mask className="font-medium">
        {name}
      </span>{' '}
      and create it again. If the new statement fails, it stays dropped.
    </>
  ),
})

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
              className="text-muted-foreground hover:text-foreground -mt-0.5"
              aria-label="Copy SQL"
              text={code}
            />
          }
        />
        <TooltipContent side="left">Copy SQL</TooltipContent>
      </Tooltip>
    }
  >
    <CodeBlock code={code} language="sql" size="xs" variant="field" wrap />
  </InspectorSection>
)

// What the database stored, fetched per object; sections with the definition
// already in the row render InspectorDefinition straight.
export const InspectorSql = ({
  query,
}: {
  query: UseQueryOptions<string, Error, string, string[]>
}) => {
  const { data: definition } = useQuery(query)

  return definition ? <InspectorDefinition code={definition} /> : null
}
