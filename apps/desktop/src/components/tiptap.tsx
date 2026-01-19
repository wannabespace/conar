import type { MentionOptions } from '@tiptap/extension-mention'
import type { Editor } from '@tiptap/react'
import type { ComponentProps, RefObject } from 'react'
import { cn } from '@conar/ui/lib/utils'
import Mention from '@tiptap/extension-mention'
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
  disabled,
  mentionSuggestion,
  ...props
}: {
  value: string
  setValue: (value: string) => void
  placeholder?: string
  onEnter?: (value: string) => void
  onImageAdd?: (file: File) => void
  mentionSuggestion?: MentionOptions['suggestion']
  ref: RefObject<{
    editor: Editor
  } | null>
} & Omit<ComponentProps<typeof EditorContent>, 'editor' | 'ref'>) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: () => placeholder || '',
        showOnlyWhenEditable: false,
      }),
      ...(mentionSuggestion
        ? [
            Mention.configure({
              HTMLAttributes: {
                class: 'rounded bg-accent px-1 py-0.5 text-accent-foreground',
              },
              suggestion: mentionSuggestion,
            }),
          ]
        : []),
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
  }, [onEnter, disabled, placeholder, setValue, mentionSuggestion])

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
