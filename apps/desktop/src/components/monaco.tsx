import { useTheme } from '@connnect/ui/theme-provider'
import { editor } from 'monaco-editor'
import ghDark from 'monaco-themes/themes/GitHub Dark.json'
import ghLight from 'monaco-themes/themes/GitHub Light.json'
import { useEffect, useRef } from 'react'

// @ts-expect-error wrong type
editor.defineTheme('github-dark', ghDark)
// @ts-expect-error wrong type
editor.defineTheme('github-light', ghLight)

export function Monaco({
  initialValue,
  language = 'sql',
  onChange,
  ref,
}: {
  initialValue: string
  language?: 'sql'
  onChange: (value: string) => void
  ref?: React.RefObject<editor.IStandaloneCodeEditor | null>
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    editor.setTheme(resolvedTheme === 'dark' ? 'github-dark' : 'github-light')
  }, [resolvedTheme])

  useEffect(() => {
    if (!editorRef.current)
      return

    const e = editor.create(editorRef.current, {
      value: initialValue,
      language,
      automaticLayout: true,
      minimap: { enabled: false },
      lineNumbers: 'off',
    })

    if (ref)
      ref.current = e

    e.onDidChangeModelContent(() => {
      onChange(e.getValue())
    })

    return () => {
      e.dispose()
    }
  }, [editorRef])

  return <div ref={editorRef} style={{ height: '300px' }} />
}
