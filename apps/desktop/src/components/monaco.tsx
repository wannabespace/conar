import type { ComponentProps } from 'react'
import { useTheme } from '@connnect/ui/theme-provider'
import * as monaco from 'monaco-editor'
import ghDark from 'monaco-themes/themes/GitHub Dark.json'
import ghLight from 'monaco-themes/themes/GitHub Light.json'
import { useEffect, useRef } from 'react'

ghDark.colors['editor.background'] = '#181919'
ghDark.colors['editor.lineHighlightBackground'] = '#212222'
ghDark.colors['editor.selectionBackground'] = '#4fb0ba50'
ghLight.colors['editor.selectionBackground'] = '#4fb0ba50'

// @ts-expect-error wrong type
monaco.editor.defineTheme('github-dark', ghDark)
// @ts-expect-error wrong type
monaco.editor.defineTheme('github-light', ghLight)

export function Monaco({
  initialValue,
  language = 'sql',
  onChange,
  onEnter,
  ref,
  options,
  ...props
}: Omit<ComponentProps<'div'>, 'onChange' | 'ref'> & {
  initialValue: string
  language?: 'sql'
  onChange: (value: string) => void
  onEnter?: () => void
  ref?: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>
  options?: monaco.editor.IStandaloneEditorConstructionOptions
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
      value: initialValue,
      language,
      automaticLayout: true,
      minimap: { enabled: false },
      ...options,
    })

    if (ref)
      ref.current = monacoInstance.current

    monacoInstance.current?.onDidChangeModelContent(() => {
      onChange(monacoInstance.current?.getValue() ?? '')
    })

    if (!monacoInstance.current?.getValue()) {
      if (language === 'sql') {
        monacoInstance.current?.setValue(
          '-- Write your SQL query here'
          + '\n'
          + '\n'
          + '-- Example:'
          + '\n'
          + 'SELECT * FROM users LIMIT 10;',
        )
      }
    }

    return () => {
      monacoInstance.current?.dispose()
    }
  }, [elementRef, language, options, onEnter])

  useEffect(() => {
    if (!monacoInstance.current || initialValue === monacoInstance.current.getValue())
      return

    monacoInstance.current.setValue(initialValue)
  }, [initialValue])

  return <div ref={elementRef} {...props} />
}
