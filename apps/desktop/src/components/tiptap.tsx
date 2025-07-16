import type { Editor } from '@tiptap/react'
import type { ComponentProps, RefObject } from 'react'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, Extension, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
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
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
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
    editorProps: {
      attributes: {
        class: className ?? '',
      },
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
    immediatelyRender: true,
    content: value,
    onUpdate: ({ editor }) => setValue(editor.getText()),
  }, [className, onEnter, placeholder, setValue])

  useImperativeHandle(ref, () => ({
    editor,
  }), [editor])

  useEffect(() => {
    if (editor && value !== editor.getText()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  const addImage = (e: React.ClipboardEvent<HTMLDivElement> | React.DragEvent<HTMLDivElement>, data: DataTransfer) => {
    if (!onImageAdd)
      return

    const { files } = data

    if (files.length > 0) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (files && files.length > 0) {
      for (const file of Array.from(files)) {
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
      onPaste={(e) => {
        addImage(e, e.clipboardData)
      }}
      onDrop={(e) => {
        addImage(e, e.dataTransfer)
      }}
      {...props}
    />
  )
}
