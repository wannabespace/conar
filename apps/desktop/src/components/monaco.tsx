import type { CompletionService } from 'monaco-sql-languages'
import type { RefObject } from 'react'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { useTheme } from '@conar/ui/theme-provider'
import * as monaco from 'monaco-editor'
import { LanguageIdEnum, setupLanguageFeatures } from 'monaco-sql-languages'
import ghDark from 'monaco-themes/themes/GitHub Dark.json'
import ghLight from 'monaco-themes/themes/GitHub Light.json'
import { useEffect, useRef } from 'react'

ghDark.colors['editor.background'] = '#1e1f21'
ghDark.colors['editor.lineHighlightBackground'] = '#252628'
ghDark.colors['editor.selectionBackground'] = '#5081f150'
ghLight.colors['editor.selectionBackground'] = '#5081f150'

// @ts-expect-error wrong type
monaco.editor.defineTheme('github-dark', ghDark)
// @ts-expect-error wrong type
monaco.editor.defineTheme('github-light', ghLight)

export function Monaco({
  ref,
  value,
  language,
  onChange,
  options,
  onEnter,
  completionService,
  ...props
}: {
  ref?: RefObject<monaco.editor.IStandaloneCodeEditor | null>
  className?: string
  style?: React.CSSProperties
  value: string
  language?: string
  onChange?: (value: string) => void
  options?: monaco.editor.IStandaloneEditorConstructionOptions
  onEnter?: (value: string) => void
  completionService?: CompletionService
}) {
  const elementRef = useRef<HTMLDivElement>(null)
  const monacoInstance = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const { resolvedTheme } = useTheme()
  const preventTriggerChangeEvent = useRef(false)

  useEffect(() => {
    monaco.editor.setTheme(resolvedTheme === 'dark' ? 'github-dark' : 'github-light')
  }, [resolvedTheme])

  useEffect(() => {
    if (!elementRef.current)
      return

    monacoInstance.current = monaco.editor.create(elementRef.current, {
      value: language?.includes('json') || language?.includes('sql')
        ? (() => {
            try {
              return JSON.stringify(JSON.parse(value), null, 2)
            }
            catch {
              return value
            }
          })()
        : value,
      language,
      automaticLayout: true,
      minimap: { enabled: false },
      fontFamily: '"Geist Mono", monospace',
      tabSize: 2,
      ...options,
    })

    if (ref) {
      ref.current = monacoInstance.current
    }

    const timeout = setTimeout(() => {
      monacoInstance.current?.getAction('editor.action.formatDocument')?.run()
    }, 50)

    if (onEnter) {
      monacoInstance.current.addAction({
        id: 'conar.execute-on-enter',
        label: 'Execute on Enter',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: (e) => {
          onEnter(e.getValue())
        },
      })
    }

    let subscription: monaco.IDisposable | undefined

    if (onChange) {
      subscription = monacoInstance.current.onDidChangeModelContent(() => {
        if (!preventTriggerChangeEvent.current) {
          const val = monacoInstance.current?.getValue()
          onChange(val ?? '')
        }
      })
    }

    return () => {
      clearTimeout(timeout)
      subscription?.dispose()
      monacoInstance.current?.dispose()
    }
  }, [elementRef, language, onChange, onEnter, ref])

  useEffect(() => {
    if (!monacoInstance.current || !options)
      return

    monacoInstance.current.updateOptions(options)
  }, [options])

  useEffect(() => {
    if (!Object.values(LanguageIdEnum).includes(language as LanguageIdEnum))
      return

    setupLanguageFeatures(language as LanguageIdEnum, {
      completionItems: {
        enable: true,
        completionService,
      },
    })
  }, [language, completionService])

  useMountedEffect(() => {
    if (!monacoInstance.current)
      return

    const editor = monacoInstance.current
    const model = editor.getModel()

    if (!model)
      return

    const currentValue = editor.getValue()

    if (currentValue !== value) {
      if (options?.readOnly || !onChange) {
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
    }
  }, [value])

  return <div ref={elementRef} {...props} />
}
