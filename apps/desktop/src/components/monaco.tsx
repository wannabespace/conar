import type { RefObject } from 'react'
import { noop } from '@conar/shared/utils/helpers'
import { formatXml } from '@conar/shared/utils/xml'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import * as monaco from 'monaco-editor'
import { vsPlusTheme } from 'monaco-sql-languages'
import { useEffect, useEffectEvent, useRef } from 'react'
import { useResolvedTheme } from '../../../../packages/ui/src/theme-store'

// Sync with packages/ui/src/styles/monaco.css
vsPlusTheme.darkThemeData.colors['editor.selectionBackground'] = '#5081f150'
vsPlusTheme.lightThemeData.colors['editor.selectionBackground'] = '#5081f150'

vsPlusTheme.darkThemeData.colors['editor.background'] = '#1e1f21'

monaco.editor.defineTheme('sql-dark', vsPlusTheme.darkThemeData)
monaco.editor.defineTheme('sql-light', vsPlusTheme.lightThemeData)

function useMonacoTheme() {
  const resolvedTheme = useResolvedTheme()

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
  const monacoInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const preventTriggerChangeEventRef = useRef(false)

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

      if (language?.includes('xml')) {
        try {
          return formatXml(value)
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

    monacoInstanceRef.current = monaco.editor.create(elementRef.current, getOptionsEvent())

    if (ref) {
      ref.current = monacoInstanceRef.current
    }

    monacoInstanceRef.current?.getAction('editor.action.formatDocument')?.run()

    const subscription = monacoInstanceRef.current.onDidChangeModelContent(() => {
      if (!preventTriggerChangeEventRef.current) {
        const val = monacoInstanceRef.current?.getValue()
        onChangeEvent(val ?? '')
      }
    })

    return () => {
      subscription.dispose()
      monacoInstanceRef.current?.dispose()
    }
  }, [elementRef, language, ref])

  useMountedEffect(() => {
    if (!monacoInstanceRef.current || !options)
      return

    monacoInstanceRef.current.updateOptions(options)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options)])

  useMountedEffect(() => {
    if (!monacoInstanceRef.current)
      return

    const editor = monacoInstanceRef.current
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
      preventTriggerChangeEventRef.current = true
      editor.executeEdits('', [
        {
          range: model.getFullModelRange(),
          text: value,
          forceMoveMarkers: true,
        },
      ])
      editor.pushUndoStop()
      preventTriggerChangeEventRef.current = false
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
  const diffEditorInstanceRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)

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

    diffEditorInstanceRef.current = monaco.editor.createDiffEditor(
      elementRef.current,
      getOptionsEvent(),
    )

    const { originalValue, modifiedValue } = getValuesEvent()
    diffEditorInstanceRef.current.setModel({
      original: monaco.editor.createModel(originalValue, language),
      modified: monaco.editor.createModel(modifiedValue, language),
    })

    if (ref) {
      ref.current = diffEditorInstanceRef.current
    }

    return () => {
      diffEditorInstanceRef.current?.dispose()
    }
  }, [elementRef, language, ref])

  useMountedEffect(() => {
    if (!diffEditorInstanceRef.current || !options)
      return

    diffEditorInstanceRef.current.updateOptions(options)
  }, [options])

  useMountedEffect(() => {
    if (!diffEditorInstanceRef.current)
      return

    const editor = diffEditorInstanceRef.current
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
