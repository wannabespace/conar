import type { ComponentProps } from 'react'
import { useTheme } from '@connnect/ui/theme-provider'
import { editor } from 'monaco-editor'
import ghDark from 'monaco-themes/themes/GitHub Dark.json'
import ghLight from 'monaco-themes/themes/GitHub Light.json'
import { useEffect, useRef, useState } from 'react'

ghDark.colors['editor.background'] = '#1e1f20'
ghDark.colors['editor.selectionBackground'] = '#4fb0ba50'
ghDark.colors['editor.lineHighlightBackground'] = '#4fb0ba10'
ghLight.colors['editor.selectionBackground'] = '#4fb0ba50'

// @ts-expect-error wrong type
editor.defineTheme('github-dark', ghDark)
// @ts-expect-error wrong type
editor.defineTheme('github-light', ghLight)

export function Monaco({
  value,
  language = 'sql',
  onChange,
  ref,
  ...props
}: Omit<ComponentProps<'div'>, 'onChange' | 'ref'> & {
  value: string
  language?: 'sql'
  onChange: (value: string) => void
  ref?: React.RefObject<editor.IStandaloneCodeEditor | null>
}) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    editor.setTheme(resolvedTheme === 'dark' ? 'github-dark' : 'github-light')
  }, [resolvedTheme])

  useEffect(() => {
    if (!elementRef.current)
      return

    const e = editor.create(elementRef.current, {
      value,
      language,
      automaticLayout: true,
      minimap: { enabled: false },
    })

    setEditorInstance(e)

    if (ref)
      ref.current = e

    e.onDidChangeModelContent(() => {
      onChange(e.getValue())
    })

    return () => {
      e.dispose()
    }
  }, [elementRef])

  useEffect(() => {
    if (!editorInstance || editorInstance.getValue() === value)
      return

    editorInstance.setValue(value)
  }, [value])

  return <div ref={elementRef} {...props} />
}
