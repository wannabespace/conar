import { Skeleton } from '@tamery/ui/components/skeleton'
import { KeyCode, KeyMod } from 'monaco-editor'
import type * as monaco from 'monaco-editor'
import { useEffect, useEffectEvent, useRef } from 'react'

import { Monaco } from '~/components/monaco'

import { InspectorSection } from './inspector'

const editorOptions = {
  fontSize: 12,
  lineNumbersMinChars: 3,
  padding: { top: 8 },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
} satisfies monaco.editor.IStandaloneEditorConstructionOptions

const readOnlyOptions = {
  ...editorOptions,
  readOnly: true,
} satisfies monaco.editor.IStandaloneEditorConstructionOptions

export const SqlEditorSkeleton = () => (
  <InspectorSection title="Definition" className="min-h-0 flex-1">
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Skeleton className="h-3 w-3/5 rounded-full" />
      <Skeleton className="h-3 w-2/5 rounded-full" />
      <Skeleton className="h-3 w-1/2 rounded-full" />
      <Skeleton className="h-3 w-1/3 rounded-full" />
    </div>
  </InspectorSection>
)

export const SqlEditor = ({
  language,
  onChange,
  onSubmit,
  readOnly,
  value,
}: {
  language: string
  onChange: (value: string) => void
  onSubmit: () => void
  readOnly: boolean
  value: string
}) => {
  const ref = useRef<monaco.editor.IStandaloneCodeEditor>(null)
  const submit = useEffectEvent(onSubmit)

  useEffect(() => {
    // oxlint-disable-next-line no-bitwise -- monaco keybindings are bit flags
    const keybinding = KeyMod.CtrlCmd | KeyCode.Enter
    const disposable = ref.current?.addAction({
      id: 'tamery.definitions-save',
      keybindings: [keybinding],
      label: 'Save definition',
      run: () => submit(),
    })

    return () => disposable?.dispose()
  }, [])

  return (
    <Monaco
      ref={ref}
      data-mask
      className="ring-foreground/4 min-h-0 flex-1 overflow-hidden rounded-xl ring-[0.5px]"
      value={value}
      language={language}
      onChange={onChange}
      options={readOnly ? readOnlyOptions : editorOptions}
    />
  )
}
