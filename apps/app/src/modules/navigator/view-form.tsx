import { Monaco } from '@tamery/monaco/editor'
import { sqlLanguageIds } from '@tamery/monaco/sql-language'
import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { KbdCtrlEnter } from '@tamery/ui/components/custom/shortcuts'
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { Field, FieldError, FieldLabel } from '@tamery/ui/components/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tamery/ui/components/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { Switch } from '@tamery/ui/components/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useHotkey } from '@tanstack/react-hotkeys'
import { getRouteApi } from '@tanstack/react-router'
import type { editor } from 'monaco-editor'
import { useEffect, useRef, useState } from 'react'

import { OptionField } from '~/components/option-field'
import { capabilitiesOf } from '~/core/catalog/capabilities'
import {
  FIELD_EDITOR_OPTIONS,
  SQL_COMPLETION_OPTIONS,
} from '~/core/sql-editor/options'
import { attachSqlSource } from '~/core/sql-editor/sql-source'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const FORM_ID = 'view-dialog'

const QUERY_EDITOR_OPTIONS = {
  ...SQL_COMPLETION_OPTIONS,
  ...FIELD_EDITOR_OPTIONS,
  ariaLabel: 'Query',
}

export interface NewView {
  materialized: boolean
  query: string
  schema: string
  view: string
}

export const ViewForm = ({
  error,
  initialSchema,
  isTaken,
  onSubmit,
  pending,
  schemas,
}: {
  error: Error | null
  initialSchema: string
  isTaken: (schema: string, name: string) => boolean
  onSubmit: (view: NewView) => void
  pending: boolean
  schemas: string[]
}) => {
  const { connection, connectionResource } = useRouteContext()
  const formRef = useRef<HTMLFormElement>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor>(null)
  const [schema, setSchema] = useState(initialSchema)
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [materialized, setMaterialized] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const trimmed = name.trim()
  const statement = query.trim().replace(/;+$/u, '')
  const taken = isTaken(schema, trimmed)
  let nameError: string | null = null
  if (taken) {
    nameError =
      schemas.length > 1
        ? `${schema} already has a table or view with this name`
        : 'A table or view with this name already exists'
  } else if (submitted && !trimmed) {
    nameError = 'Give the view a name.'
  }
  const queryError =
    submitted && !statement ? 'Write the query the view selects.' : null

  useHotkey('Mod+Enter', () => formRef.current?.requestSubmit(), {
    enabled: !pending,
    target: formRef,
  })
  useEffect(() => {
    const codeEditor = editorRef.current
    return codeEditor
      ? attachSqlSource(codeEditor, connectionResource, connection.type)
      : undefined
  }, [connectionResource, connection.type])

  return (
    <>
      <DialogHeader>
        <DialogTitle>New view</DialogTitle>
        <DialogDescription>
          A saved query that reads like a table.
        </DialogDescription>
      </DialogHeader>
      <form
        ref={formRef}
        id={FORM_ID}
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitted(true)
          if (trimmed && !taken && statement) {
            onSubmit({ materialized, query: statement, schema, view: trimmed })
          }
        }}
      >
        {schemas.length > 1 && (
          <Field>
            <FieldLabel htmlFor="view-dialog-schema">Schema</FieldLabel>
            <Select value={schema} onValueChange={(v) => v && setSchema(v)}>
              <SelectTrigger
                id="view-dialog-schema"
                data-mask
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent data-mask>
                {schemas.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {entry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="view-dialog-name">Name</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="view-dialog-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!nameError}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              data-mask
            />
            <InputGroupAddon align="inline-end">
              {nameError && <FieldError>{nameError}</FieldError>}
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>Query</FieldLabel>
            {queryError && <FieldError>{queryError}</FieldError>}
          </div>
          <Monaco
            ref={editorRef}
            data-mask
            className="ring-foreground/4 h-40 rounded-xl ring"
            language={sqlLanguageIds[connection.type]}
            value={query}
            options={QUERY_EDITOR_OPTIONS}
            onChange={setQuery}
            onSubmit={() => formRef.current?.requestSubmit()}
          />
        </Field>
        {capabilitiesOf(connection.type).materializedViews && (
          <OptionField
            htmlFor="view-dialog-materialized"
            title="Materialized"
            description="Stores the query's rows instead of running it on every read."
          >
            <Switch
              id="view-dialog-materialized"
              size="sm"
              checked={materialized}
              onCheckedChange={setMaterialized}
            />
          </OptionField>
        )}
      </form>
      {error && (
        <Alert variant="destructive">
          <AlertDescription data-mask className="wrap-break-word">
            {error.message}
          </AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Tooltip
          shortcut={
            !pending && <KbdCtrlEnter userAgent={navigator.userAgent} />
          }
        >
          <TooltipTrigger
            render={<Button type="submit" form={FORM_ID} disabled={pending} />}
          >
            <LoadingContent loading={pending}>Create view</LoadingContent>
          </TooltipTrigger>
          <TooltipContent />
        </Tooltip>
      </DialogFooter>
    </>
  )
}
