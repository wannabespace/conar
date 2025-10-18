import type { RefObject } from 'react'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { useTheme } from '@conar/ui/theme-observer'
import * as monaco from 'monaco-editor'
import { useEffect, useEffectEvent, useRef } from 'react'

export function MonacoDiff({
  ref,
  originalValue,
  modifiedValue,
  language,
  options,
  ...props
}: {
  ref?: RefObject<monaco.editor.IStandaloneDiffEditor | null>
  className?: string
  style?: React.CSSProperties
  originalValue: string
  modifiedValue: string
  language?: string
  options?: monaco.editor.IStandaloneDiffEditorConstructionOptions
}) {
  const elementRef = useRef<HTMLDivElement>(null)
  const diffEditorInstance = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    monaco.editor.setTheme(resolvedTheme === 'dark' ? 'github-dark' : 'github-light')
  }, [resolvedTheme])

  const getOptionsEvent = useEffectEvent(() => {
    return {
      automaticLayout: true,
      minimap: { enabled: false },
      fontFamily: '"Geist Mono", monospace',
      tabSize: 2,
      readOnly: true,
      ...options,
    }
  })

  const getValuesEvent = useEffectEvent(() => ({
    originalValue,
    modifiedValue,
  }))

  useEffect(() => {
    if (!elementRef.current)
      return

    diffEditorInstance.current = monaco.editor.createDiffEditor(
      elementRef.current,
      getOptionsEvent(),
    )

    const { originalValue, modifiedValue } = getValuesEvent()
    diffEditorInstance.current.setModel({
      original: monaco.editor.createModel(originalValue, language),
      modified: monaco.editor.createModel(modifiedValue, language),
    })

    if (ref) {
      ref.current = diffEditorInstance.current
    }

    return () => {
      diffEditorInstance.current?.dispose()
    }
  }, [elementRef, language, ref])

  useMountedEffect(() => {
    if (!diffEditorInstance.current || !options)
      return

    diffEditorInstance.current.updateOptions(options)
  }, [options])

  useMountedEffect(() => {
    if (!diffEditorInstance.current)
      return

    const editor = diffEditorInstance.current
    const originalModel = editor.getModel()?.original
    const modifiedModel = editor.getModel()?.modified

    if (originalModel && originalModel.getValue() !== originalValue) {
      originalModel.setValue(originalValue)
    }

    if (modifiedModel && modifiedModel.getValue() !== modifiedValue) {
      modifiedModel.setValue(modifiedValue)
    }
  }, [originalValue, modifiedValue])

  return <div ref={elementRef} {...props} />
}
