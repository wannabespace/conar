import '~/monaco-worker'
import { noop } from '@tamery/shared/utils/helpers'
import { formatXml } from '@tamery/shared/utils/xml'
import { useMountedEffect } from '@tamery/ui/hookas/use-mounted-effect'
import { resolvedTheme } from '@tamery/ui/theme-store'
import * as monaco from 'monaco-editor'
import type { RefObject } from 'react'
import { useEffect, useEffectEvent, useRef } from 'react'

const githubTheme = (
  base: 'vs' | 'vs-dark',
  c: {
    background: string
    comment: string
    foreground: string
    function: string
    keyword: string
    number: string
    string: string
  }
): monaco.editor.IStandaloneThemeData => ({
  base,
  colors: {
    'editor.background': c.background,
    'editor.foreground': c.foreground,
    // Sync with packages/ui/src/styles/monaco.css
    'editor.selectionBackground': '#5081f150',
    'editorGutter.background': c.background,
  },
  inherit: false,
  rules: [
    { foreground: c.foreground, token: '' },
    { foreground: c.keyword, token: 'keyword' },
    { foreground: c.keyword, token: 'operator.keyword' },
    { foreground: c.string, token: 'string' },
    { foreground: c.string, token: 'identifier.quote' },
    { foreground: c.number, token: 'number' },
    { foreground: c.number, token: 'variable' },
    { foreground: c.number, token: 'string.key.json' },
    { foreground: c.string, token: 'string.value.json' },
    { foreground: c.function, token: 'predefined' },
    { foreground: c.function, token: 'type' },
    { foreground: c.comment, token: 'comment' },
    { foreground: c.foreground, token: 'operator' },
    { foreground: c.foreground, token: 'delimiter' },
    { foreground: c.foreground, token: 'identifier' },
  ],
})

monaco.editor.defineTheme(
  'github-light',
  githubTheme('vs', {
    background: '#fafafb',
    comment: '#6a737d',
    foreground: '#24292e',
    function: '#6f42c1',
    keyword: '#d73a49',
    number: '#005cc5',
    string: '#032f62',
  })
)
monaco.editor.defineTheme(
  'github-dark',
  githubTheme('vs-dark', {
    background: '#1e2023',
    comment: '#6a737d',
    foreground: '#e1e4e8',
    function: '#b392f0',
    keyword: '#f97583',
    number: '#79b8ff',
    string: '#9ecbff',
  })
)

resolvedTheme.subscribe(
  (theme) => {
    monaco.editor.setTheme(theme === 'dark' ? 'github-dark' : 'github-light')
  },
  { immediate: true }
)

export const Monaco = ({
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
}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const monacoInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null
  )
  const preventTriggerChangeEventRef = useRef(false)

  const onChangeEvent = useEffectEvent(onChange)
  const getOptionsEvent = useEffectEvent(
    (editorLanguage?: string) =>
      ({
        automaticLayout: true,
        fontFamily: '"Geist Mono Variable", monospace',
        language: editorLanguage,
        minimap: { enabled: false },
        tabSize: 2,
        value: (() => {
          if (editorLanguage?.includes('json')) {
            try {
              return JSON.stringify(JSON.parse(value), null, 2)
            } catch {
              return value
            }
          }

          if (editorLanguage?.includes('xml')) {
            try {
              return formatXml(value)
            } catch {
              return value
            }
          }

          return value
        })(),
        ...options,
      }) satisfies monaco.editor.IStandaloneEditorConstructionOptions
  )

  useEffect(() => {
    if (!elementRef.current) {
      return
    }

    monacoInstanceRef.current = monaco.editor.create(
      elementRef.current,
      getOptionsEvent(language)
    )

    if (ref) {
      ref.current = monacoInstanceRef.current
    }

    monacoInstanceRef.current?.getAction('editor.action.formatDocument')?.run()

    const subscription = monacoInstanceRef.current.onDidChangeModelContent(
      () => {
        if (!preventTriggerChangeEventRef.current) {
          const val = monacoInstanceRef.current?.getValue()
          onChangeEvent(val ?? '')
        }
      }
    )

    return () => {
      subscription.dispose()
      monacoInstanceRef.current?.dispose()
    }
  }, [language, ref])

  useMountedEffect(() => {
    if (!monacoInstanceRef.current || !options) {
      return
    }

    monacoInstanceRef.current.updateOptions(options)
  }, [options])

  useMountedEffect(() => {
    if (!monacoInstanceRef.current) {
      return
    }

    const editor = monacoInstanceRef.current
    const model = editor.getModel()

    if (!model) {
      return
    }

    const currentValue = editor.getValue()

    if (currentValue === value) {
      return
    }

    if (options?.readOnly) {
      editor.setValue(value)
    } else {
      preventTriggerChangeEventRef.current = true
      editor.executeEdits('', [
        {
          forceMoveMarkers: true,
          range: model.getFullModelRange(),
          text: value,
        },
      ])
      editor.pushUndoStop()
      preventTriggerChangeEventRef.current = false
    }
  }, [value, options?.readOnly, language])

  return <div ref={elementRef} {...props} />
}

export const MonacoDiff = ({
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
}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const diffEditorInstanceRef =
    useRef<monaco.editor.IStandaloneDiffEditor | null>(null)

  const getOptionsEvent = useEffectEvent(
    () =>
      ({
        automaticLayout: true,
        fontFamily: '"Geist Mono Variable", monospace',
        minimap: { enabled: false },
        readOnly: true,
        ...options,
      }) satisfies monaco.editor.IStandaloneDiffEditorConstructionOptions
  )

  const getValuesEvent = useEffectEvent(() => ({
    modifiedValue,
    originalValue,
  }))

  useEffect(() => {
    if (!elementRef.current) {
      return
    }

    diffEditorInstanceRef.current = monaco.editor.createDiffEditor(
      elementRef.current,
      getOptionsEvent()
    )

    const {
      originalValue: nextOriginalValue,
      modifiedValue: nextModifiedValue,
    } = getValuesEvent()
    diffEditorInstanceRef.current.setModel({
      modified: monaco.editor.createModel(nextModifiedValue, language),
      original: monaco.editor.createModel(nextOriginalValue, language),
    })

    if (ref) {
      ref.current = diffEditorInstanceRef.current
    }

    return () => {
      diffEditorInstanceRef.current?.dispose()
    }
  }, [elementRef, language, ref])

  useMountedEffect(() => {
    if (!diffEditorInstanceRef.current || !options) {
      return
    }

    diffEditorInstanceRef.current.updateOptions(options)
  }, [options])

  useMountedEffect(() => {
    if (!diffEditorInstanceRef.current) {
      return
    }

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
