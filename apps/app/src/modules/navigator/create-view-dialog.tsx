import { FIELD_EDITOR_OPTIONS, Monaco } from '@tamery/monaco/editor'
import {
  SQL_COMPLETION_OPTIONS,
  sqlLanguageIds,
} from '@tamery/monaco/sql-language'
import { dialects, splitStatements } from '@tamery/sql'
import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import { KbdCtrlEnter } from '@tamery/ui/components/custom/shortcuts'
import { Field, FieldError, FieldLabel } from '@tamery/ui/components/field'
import { Switch } from '@tamery/ui/components/switch'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import type { editor } from 'monaco-editor'
import type { RefObject } from 'react'
import {
  createRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { OptionField } from '~/components/option-field'
import { capabilitiesOf, defaultSchemaOf } from '~/core/catalog/capabilities'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { createViewQuery } from '~/core/queries/views/create'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import { attachSqlSource } from '~/core/sql-editor/sql-source'
import type { TableDialogRequest } from '~/core/table/table-dialog'
import { TableDialog } from '~/core/table/table-dialog'
import { openTab } from '~/core/tabs/actions'
import { tableTabId } from '~/core/tabs/ids'
import { queryClient } from '~/lib/query-client'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const QUERY_EDITOR_OPTIONS = {
  ...SQL_COMPLETION_OPTIONS,
  ...FIELD_EDITOR_OPTIONS,
  ariaLabel: 'Query',
}

export const createViewDialogRef = createRef<{
  create: (schema?: string) => void
}>()

const QueryField = ({
  editorRef,
  error,
  onChange,
  value,
}: {
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>
  error: string | null
  onChange: (value: string) => void
  value: string
}) => {
  const { connection, connectionResource } = useRouteContext()

  useEffect(() => {
    const codeEditor = editorRef.current
    return codeEditor
      ? attachSqlSource(codeEditor, connectionResource, connection.type)
      : undefined
  }, [editorRef, connectionResource, connection.type])

  return (
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel>Query</FieldLabel>
        {error && <FieldError>{error}</FieldError>}
      </div>
      <Monaco
        ref={editorRef}
        data-mask
        className="ring-foreground/4 h-40 rounded-xl ring"
        language={sqlLanguageIds[connection.type]}
        value={value}
        options={QUERY_EDITOR_OPTIONS}
        onChange={onChange}
        onSubmit={() =>
          editorRef.current
            ?.getContainerDomNode()
            .closest('form')
            ?.requestSubmit()
        }
      />
    </Field>
  )
}

export const CreateViewDialog = () => {
  const { connection, connectionResource } = useRouteContext()
  const router = useRouter()
  const editorRef = useRef<editor.IStandaloneCodeEditor>(null)
  const [request, setRequest] = useState<TableDialogRequest | null>(null)
  const [query, setQuery] = useState('')
  const [materialized, setMaterialized] = useState(false)
  const [queryRefused, setQueryRefused] = useState(false)
  const { data: tablesAndSchemas } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource })
  )
  const schemas = tablesAndSchemas?.schemas ?? []
  const statements = splitStatements(query, dialects[connection.type])
  let queryError: string | null = null
  if (queryRefused && statements.length === 0) {
    queryError = 'Write the query the view selects.'
  } else if (queryRefused && statements.length > 1) {
    queryError = 'A view saves a single query.'
  }

  const {
    error,
    isPending,
    mutate: createView,
    reset,
  } = useMutation({
    meta: { event: 'view_created' },
    mutationFn: async (view: {
      materialized: boolean
      query: string
      schema: string
      view: string
    }) => {
      await createViewQuery(view).run(
        await connectionResourceToQueryParams(connectionResource)
      )
    },
    onSuccess: async (_, { schema, view }) => {
      setRequest(null)
      await queryClient.invalidateQueries({
        queryKey: ['connection-resource', connectionResource.id],
      })
      openTab(connectionResource.id, tableTabId(schema, view))
      router.navigate({
        params: {
          resourceId: connectionResource.id,
          tabId: tableTabId(schema, view),
        },
        to: '/connection/$resourceId/$tabId',
      })
    },
  })

  useImperativeHandle(createViewDialogRef, () => ({
    create: (schema) => {
      reset()
      setQuery('')
      setMaterialized(false)
      setQueryRefused(false)
      setRequest({
        schema:
          schema ??
          defaultSchemaOf(connection.type, connectionResource.name) ??
          schemas[0]?.name ??
          '',
        table: null,
      })
    },
  }))

  return (
    <TableDialog
      noun="view"
      description="A saved query that reads like a table."
      shortcut={<KbdCtrlEnter userAgent={navigator.userAgent} />}
      request={request}
      schemas={schemas.map(({ name }) => name)}
      isTaken={(schema, name) =>
        schemas.some(
          (entry) =>
            entry.name === schema &&
            entry.tables.some((table) => table.name === name)
        )
      }
      pending={isPending}
      onOpenChange={(open) => !open && setRequest(null)}
      onSubmit={(_, schema, view) => {
        const [statement] = statements
        if (statement && statements.length === 1) {
          createView({ materialized, query: statement.text, schema, view })
        } else {
          setQueryRefused(true)
          editorRef.current?.focus()
        }
      }}
    >
      <QueryField
        editorRef={editorRef}
        error={queryError}
        value={query}
        onChange={setQuery}
      />
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
      {error && (
        <Alert variant="destructive">
          <AlertDescription data-mask className="wrap-break-word">
            {error.message}
          </AlertDescription>
        </Alert>
      )}
    </TableDialog>
  )
}
