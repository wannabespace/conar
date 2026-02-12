import { cn } from '@conar/ui/lib/utils'
import { RiTableLine } from '@remixicon/react'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export interface MentionListProps {
  items: Array<{ schema: string, table: string }>
  command: (props: { id: string, label: string }) => void
}

export function MentionList({ ref, ...props }: MentionListProps & { ref?: React.RefObject<MentionListRef | null> }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedRef = useRef<HTMLButtonElement>(null)

  const selectItem = (index: number) => {
    const item = props.items[index]

    if (item) {
      props.command({ id: `${item.schema}.${item.table}`, label: `${item.schema}.${item.table}` })
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [selectedIndex])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  if (props.items.length === 0) {
    return (
      <div className={`
        z-50 min-w-40 rounded-md border bg-popover p-2 text-popover-foreground
        shadow-md
      `}
      >
        <div className="px-2 py-1 text-xs text-muted-foreground">No tables found</div>
      </div>
    )
  }

  return (
    <div
      role="listbox"
      aria-label="Table suggestions"
      className={`
        z-50 max-h-48 min-w-40 overflow-y-auto rounded-md border bg-popover
        text-popover-foreground shadow-md
      `}
    >
      {props.items.map((item, index) => (
        <button
          ref={index === selectedIndex ? selectedRef : null}
          type="button"
          role="option"
          aria-selected={index === selectedIndex}
          className={cn(
            `
              flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left
              text-xs outline-hidden
            `,
            index === selectedIndex
              ? 'bg-accent text-accent-foreground'
              : `hover:bg-accent/50`,
          )}
          key={`${item.schema}.${item.table}`}
          onClick={() => selectItem(index)}
        >
          <RiTableLine className="size-3 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">
            <span className="text-muted-foreground">{item.schema}</span>
            .
            <span>{item.table}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

MentionList.displayName = 'MentionList'
