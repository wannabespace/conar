import { cn } from '@tamery/ui/lib/utils'
import TiptapPlaceholder from '@tiptap/extension-placeholder'
import type { Editor } from '@tiptap/react'
import { EditorContent, Extension, useEditor } from '@tiptap/react'
import TiptapStarterKit from '@tiptap/starter-kit'
import type { ComponentProps, RefObject } from 'react'
import { useEffect, useImperativeHandle } from 'react'

import './tiptap.css'

export function TipTap({
  value,
  setValue,
  placeholder,
  onEnter,
  onImageAdd,
  className,
  ref,
  disabled,
  ...props
}: {
  value: string
  setValue: (value: string) => void
  placeholder?: string
  onEnter?: (value: string) => void
  onImageAdd?: (file: File) => void
  ref: RefObject<{
    editor: Editor
  } | null>
} & Omit<ComponentProps<typeof EditorContent>, 'editor' | 'ref'>) {
  const editor = useEditor(
    {
      extensions: [
        TiptapStarterKit,
        TiptapPlaceholder.configure({
          placeholder: () => placeholder || '',
          showOnlyWhenEditable: false,
        }),
        Extension.create({
          addKeyboardShortcuts() {
            return {
              'Enter': () => {
                onEnter?.(this.editor.getText())
                return true
              },
              'Cmd-Enter': () => {
                onEnter?.(this.editor.getText())
                return true
              },
              'Ctrl-Enter': () => {
                onEnter?.(this.editor.getText())
                return true
              },
            }
          },
        }),
      ],
      parseOptions: {
        preserveWhitespace: 'full',
      },
      editable: !disabled,
      content: value,
      onUpdate: ({ editor }) => setValue(editor.getText()),
    },
    [onEnter, disabled, placeholder, setValue],
  )

  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: cn(className) || '',
          },
        },
      })
    }
  }, [editor, className])

  useImperativeHandle(
    ref,
    () => ({
      editor,
    }),
    [editor],
  )

  const addImage = (
    e: React.ClipboardEvent<HTMLDivElement> | React.DragEvent<HTMLDivElement>,
    data: DataTransfer,
  ) => {
    if (!onImageAdd) return

    const { files } = data

    if (files.length > 0) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (files && files.length > 0) {
      for (const file of files) {
        const [mime] = file.type.split('/')

        if (mime === 'image') {
          onImageAdd(file)
        }
      }
    }
  }

  return (
    <EditorContent
      editor={editor}
      className="w-full"
      onPaste={e => {
        addImage(e, e.clipboardData)
      }}
      onDrop={e => {
        addImage(e, e.dataTransfer)
      }}
      {...props}
    />
  )
}
