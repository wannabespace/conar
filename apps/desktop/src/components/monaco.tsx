import { editor } from 'monaco-editor'
import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    if (!editorRef.current)
      return

    const e = editor.create(editorRef.current, {
      value: initialValue,
      language,
      theme: 'vs-dark',
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
