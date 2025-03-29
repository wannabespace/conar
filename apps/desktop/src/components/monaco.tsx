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
  ref,
  options,
  ...props
}: Omit<ComponentProps<'div'>, 'onChange' | 'ref'> & {
  initialValue: string
  language?: 'sql'
  onChange: (value: string) => void
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

    monacoInstance.current.onDidChangeModelContent(() => {
      const value = monacoInstance.current?.getValue()

      onChange(value ?? '')
    })

    if (!monacoInstance.current?.getValue()) {
      if (language === 'sql') {
        monacoInstance.current.setValue(
          '-- Write your SQL query here\n'
          + '\n'
          + '-- Examples:\n'
          + '-- Basic query with limit\n'
          + 'SELECT * FROM users LIMIT 10;\n'
          + '\n'
          + '-- Query with filtering\n'
          + 'SELECT id, name, email FROM users WHERE created_at > \'2023-01-01\' ORDER BY name;\n'
          + '\n'
          + '-- Join example\n'
          + 'SELECT u.id, u.name, p.title FROM users u\n'
          + 'JOIN posts p ON u.id = p.user_id\n'
          + 'WHERE p.published = true\n'
          + 'LIMIT 10;\n'
          + '\n'
          + '-- You can run multiple queries at once by separating them with semicolons',
        )
      }
    }

    return () => {
      monacoInstance.current?.dispose()
    }
  }, [elementRef, language, options])

  return <div ref={elementRef} {...props} />
}
