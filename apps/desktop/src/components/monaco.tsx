import type { ComponentProps } from 'react'
import { useTheme } from '@connnect/ui/theme-provider'
import * as monaco from 'monaco-editor'
import ghDark from 'monaco-themes/themes/GitHub Dark.json'
import ghLight from 'monaco-themes/themes/GitHub Light.json'
import { useEffect, useRef } from 'react'

ghDark.colors['editor.background'] = '#1e1f20'
ghDark.colors['editor.selectionBackground'] = '#4fb0ba50'
ghDark.colors['editor.lineHighlightBackground'] = '#4fb0ba10'
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
  language?: string
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

  useEffect(() => {
    if (!elementRef.current)
      return

    const e = monaco.editor.create(elementRef.current, {
      value: initialValue,
      language,
      automaticLayout: true,
      minimap: { enabled: false },
      ...options,
    })

    if (ref)
      ref.current = e

    e.onDidChangeModelContent(() => {
      onChange(e.getValue())
    })

    return () => {
      e.dispose()
    }
  }, [elementRef, language, options, onEnter])

  return <div ref={elementRef} {...props} />
}
