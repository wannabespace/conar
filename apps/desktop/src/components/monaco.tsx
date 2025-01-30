import * as monaco from 'monaco-editor'
import { useEffect, useRef } from 'react'

export function Monaco({
  initialValue,
  language = 'sql',
  onChange,
}: {
  initialValue: string
  language?: 'sql'
  onChange: (value: string) => void
}) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editorRef.current)
      return

    const editor = monaco.editor.create(editorRef.current, {
      value: initialValue,
      language,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      lineNumbers: 'off',
    })

    editor.onDidChangeModelContent(() => {
      onChange(editor.getValue())
    })

    return () => {
      editor.dispose()
    }
  }, [editorRef])

  return <div ref={editorRef} style={{ height: '300px' }} />
}
