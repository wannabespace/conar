import type { ComponentProps } from 'react'
import { useTheme } from '@connnect/ui/theme-provider'
import * as monaco from 'monaco-editor'
import ghDark from 'monaco-themes/themes/GitHub Dark.json'
import ghLight from 'monaco-themes/themes/GitHub Light.json'
import { useEffect, useRef } from 'react'

ghDark.colors['editor.background'] = '#171718'
ghDark.colors['editor.lineHighlightBackground'] = '#212222'
ghDark.colors['editor.selectionBackground'] = '#4fb0ba50'
ghLight.colors['editor.selectionBackground'] = '#4fb0ba50'

// @ts-expect-error wrong type
monaco.editor.defineTheme('github-dark', ghDark)
// @ts-expect-error wrong type
monaco.editor.defineTheme('github-light', ghLight)

export function Monaco({
  value,
  language,
  onChange,
  options,
  onEnter,
  ...props
}: Omit<ComponentProps<'div'>, 'onChange' | 'ref'> & {
  value: string
  language?: string
  onChange: (value: string) => void
  options?: monaco.editor.IStandaloneEditorConstructionOptions
  onEnter?: (value: string) => void
}) {
  const elementRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    monaco.editor.setTheme(resolvedTheme === 'dark' ? 'github-dark' : 'github-light')
  }, [resolvedTheme])

  const monacoInstance = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (!elementRef.current)
      return

    monacoInstance.current = monaco.editor.create(elementRef.current, {
      value,
      language,
      automaticLayout: true,
      minimap: { enabled: false },
      fontFamily: '"Geist Mono", monospace',
      ...options,
    })

    if (onEnter) {
      monacoInstance.current.addAction({
        id: 'connnect.execute-on-enter',
        label: 'Execute on Enter',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: (e) => {
          onEnter(e.getValue())
        },
      })
    }

    monacoInstance.current.onDidChangeModelContent(() => {
      const value = monacoInstance.current?.getValue()

      onChange(value ?? '')
    })

    return () => {
      monacoInstance.current?.dispose()
    }
  }, [elementRef, language])

  useEffect(() => {
    if (!monacoInstance.current || !options)
      return

    monacoInstance.current.updateOptions(options)
  }, [options])

  useEffect(() => {
    if (monacoInstance.current && monacoInstance.current.getValue() !== value)
      monacoInstance.current.setValue(value)
  }, [value])

  return <div data-mask ref={elementRef} {...props} />
}
