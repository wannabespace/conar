import type { editor } from 'monaco-editor'
import { useRef } from 'react'
import { Monaco } from '~/components/monaco'

export function SqlRunner({ query, setQuery }: { query: string, setQuery: (query: string) => void }) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  return (
    <Monaco
      ref={editorRef}
      value={query}
      onChange={setQuery}
      className="h-[200px] border border-border rounded-lg overflow-hidden"
    />
  )
}
