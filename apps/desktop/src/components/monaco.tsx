import type { RefObject } from 'react'
import { noop } from '@conar/shared/utils/helpers'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { useTheme } from '@conar/ui/theme-observer'
import * as monaco from 'monaco-editor'
import { vsPlusTheme } from 'monaco-sql-languages'
import { useEffect, useEffectEvent, useRef } from 'react'

// Sync with packages/ui/src/styles/monaco.css
vsPlusTheme.darkThemeData.colors['editor.selectionBackground'] = '#5081f150'
vsPlusTheme.lightThemeData.colors['editor.selectionBackground'] = '#5081f150'

vsPlusTheme.darkThemeData.colors['editor.background'] = '#1e1f21'

monaco.editor.defineTheme('sql-dark', vsPlusTheme.darkThemeData)
monaco.editor.defineTheme('sql-light', vsPlusTheme.lightThemeData)

function useMonacoTheme() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    monaco.editor.setTheme(resolvedTheme === 'dark' ? 'sql-dark' : 'sql-light')
  }, [resolvedTheme])
}

export function Monaco({
  ref,
  value,
  language,
  options,
  onChange = noop,
  ...props
}: {
  ref?: RefObject<monaco.editor.IStandaloneCodeEditor | null>
  className?: string
  style?: React.CSSProperties
  value: string
  language?: string
  onChange?: (value: string) => void
  options?: monaco.editor.IStandaloneEditorConstructionOptions
}) {
  const elementRef = useRef<HTMLDivElement>(null)
  const monacoInstance = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const preventTriggerChangeEvent = useRef(false)

  useMonacoTheme()

  const onChangeEvent = useEffectEvent(onChange)
  const getOptionsEvent = useEffectEvent(() => ({
    value: (() => {
      if (language?.includes('json')) {
        try {
          return JSON.stringify(JSON.parse(value), null, 2)
        }
        catch {
          return value
        }
      }

      return value
    })(),
    language,
    automaticLayout: true,
    minimap: { enabled: false },
    fontFamily: '"Geist Mono", monospace',
    tabSize: 2,
    ...options,
  } satisfies monaco.editor.IStandaloneEditorConstructionOptions))

  useEffect(() => {
    if (!elementRef.current)
      return

    monacoInstance.current = monaco.editor.create(elementRef.current, getOptionsEvent())

    if (ref) {
      ref.current = monacoInstance.current
    }

    monacoInstance.current?.getAction('editor.action.formatDocument')?.run()

    const subscription = monacoInstance.current.onDidChangeModelContent(() => {
      if (!preventTriggerChangeEvent.current) {
        const val = monacoInstance.current?.getValue()
        onChangeEvent(val ?? '')
      }
    })

    return () => {
      subscription.dispose()
      monacoInstance.current?.dispose()
    }
  }, [elementRef, language, ref])

  useMountedEffect(() => {
    if (!monacoInstance.current || !options)
      return

    monacoInstance.current.updateOptions(options)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options)])

  useMountedEffect(() => {
    if (!monacoInstance.current)
      return

    const editor = monacoInstance.current
    const model = editor.getModel()

    if (!model)
      return

    const currentValue = editor.getValue()

    if (currentValue === value) {
      return
    }

    if (options?.readOnly) {
      editor.setValue(value)
    }
    else {
      preventTriggerChangeEvent.current = true
      editor.executeEdits('', [
        {
          range: model.getFullModelRange(),
          text: value,
          forceMoveMarkers: true,
        },
      ])
      editor.pushUndoStop()
      preventTriggerChangeEvent.current = false
    }
  }, [value, options?.readOnly, language])

  return <div ref={elementRef} {...props} />
}

export function MonacoDiff({
  ref,
  originalValue,
  modifiedValue,
  language,
  options,
  ...props
}: {
  ref?: RefObject<monaco.editor.IStandaloneDiffEditor | null>
  className?: string
  style?: React.CSSProperties
  originalValue: string
  modifiedValue: string
  language?: string
  options?: monaco.editor.IStandaloneDiffEditorConstructionOptions
}) {
  const elementRef = useRef<HTMLDivElement>(null)
  const diffEditorInstance = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)

  useMonacoTheme()

  const getOptionsEvent = useEffectEvent(() => ({
    automaticLayout: true,
    minimap: { enabled: false },
    fontFamily: '"Geist Mono", monospace',
    readOnly: true,
    ...options,
  } satisfies monaco.editor.IStandaloneDiffEditorConstructionOptions))

  const getValuesEvent = useEffectEvent(() => ({
    originalValue,
    modifiedValue,
  }))

  useEffect(() => {
    if (!elementRef.current)
      return

    diffEditorInstance.current = monaco.editor.createDiffEditor(
      elementRef.current,
      getOptionsEvent(),
    )

    const { originalValue, modifiedValue } = getValuesEvent()
    diffEditorInstance.current.setModel({
      original: monaco.editor.createModel(originalValue, language),
      modified: monaco.editor.createModel(modifiedValue, language),
    })

    if (ref) {
      ref.current = diffEditorInstance.current
    }

    return () => {
      diffEditorInstance.current?.dispose()
    }
  }, [elementRef, language, ref])

  useMountedEffect(() => {
    if (!diffEditorInstance.current || !options)
      return

    diffEditorInstance.current.updateOptions(options)
  }, [options])

  useMountedEffect(() => {
    if (!diffEditorInstance.current)
      return

    const editor = diffEditorInstance.current
    const originalModel = editor.getModel()?.original
    const modifiedModel = editor.getModel()?.modified

    if (originalModel && originalModel.getValue() !== originalValue) {
      originalModel.setValue(originalValue)
    }

    if (modifiedModel && modifiedModel.getValue() !== modifiedValue) {
      modifiedModel.setValue(modifiedValue)
    }
  }, [originalValue, modifiedValue])

  return <div ref={elementRef} {...props} />
}
