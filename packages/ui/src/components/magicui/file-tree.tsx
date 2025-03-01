'use client'

import { Button } from '@connnect/ui/components/button'
import { ScrollArea } from '@connnect/ui/components/scroll-area'
import { cn } from '@connnect/ui/lib/utils'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { FileIcon, FolderIcon, FolderOpenIcon } from 'lucide-react'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

interface TreeViewElement {
  id: string
  name: string
  isSelectable?: boolean
  children?: TreeViewElement[]
}

interface TreeContextProps {
  selectedId: string | undefined
  expandedItems: string[] | undefined
  indicator: boolean
  handleExpand: (id: string) => void
  selectItem: (id: string) => void
  setExpandedItems?: React.Dispatch<React.SetStateAction<string[] | undefined>>
  openIcon?: React.ReactNode
  closeIcon?: React.ReactNode
  direction: 'rtl' | 'ltr'
}

const TreeContext = createContext<TreeContextProps | null>(null)

function useTree() {
  const context = useContext(TreeContext)
  if (!context) {
    throw new Error('useTree must be used within a TreeProvider')
  }
  return context
}

interface TreeViewComponentProps extends React.HTMLAttributes<HTMLDivElement> {}

type Direction = 'rtl' | 'ltr' | undefined

type TreeViewProps = {
  initialSelectedId?: string
  indicator?: boolean
  elements?: TreeViewElement[]
  initialExpandedItems?: string[]
  openIcon?: React.ReactNode
  closeIcon?: React.ReactNode
} & TreeViewComponentProps

function Tree({ ref, className, elements, initialSelectedId, initialExpandedItems, children, indicator = true, openIcon, closeIcon, dir, ...props }: TreeViewProps & { ref?: React.RefObject<HTMLDivElement | null> }) {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialSelectedId,
  )
  const [expandedItems, setExpandedItems] = useState<string[] | undefined>(
    initialExpandedItems,
  )

  const selectItem = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const handleExpand = useCallback((id: string) => {
    setExpandedItems((prev) => {
      if (prev?.includes(id)) {
        return prev.filter(item => item !== id)
      }
      return [...(prev ?? []), id]
    })
  }, [])

  const expandSpecificTargetedElements = useCallback(
    (elements?: TreeViewElement[], selectId?: string) => {
      if (!elements || !selectId)
        return
      const findParent = (
        currentElement: TreeViewElement,
        currentPath: string[] = [],
      ) => {
        const isSelectable = currentElement.isSelectable ?? true
        const newPath = [...currentPath, currentElement.id]
        if (currentElement.id === selectId) {
          if (isSelectable) {
            setExpandedItems(prev => [...(prev ?? []), ...newPath])
          }
          else {
            if (newPath.includes(currentElement.id)) {
              newPath.pop()
              setExpandedItems(prev => [...(prev ?? []), ...newPath])
            }
          }
          return
        }
        if (
          isSelectable
          && currentElement.children
          && currentElement.children.length > 0
        ) {
          currentElement.children.forEach((child) => {
            findParent(child, newPath)
          })
        }
      }
      elements.forEach((element) => {
        findParent(element)
      })
    },
    [],
  )

  useEffect(() => {
    if (initialSelectedId) {
      expandSpecificTargetedElements(elements, initialSelectedId)
    }
  }, [initialSelectedId, elements])

  const direction = dir === 'rtl' ? 'rtl' : 'ltr'

  return (
    <TreeContext
      value={{
        selectedId,
        expandedItems,
        handleExpand,
        selectItem,
        setExpandedItems,
        indicator,
        openIcon,
        closeIcon,
        direction,
      }}
    >
      <div className={cn('size-full', className)}>
        <ScrollArea
          ref={ref}
          className="relative h-full px-2"
          dir={dir as Direction}
        >
          <AccordionPrimitive.Root
            {...props}
            type="multiple"
            defaultValue={expandedItems}
            value={expandedItems}
            className="flex flex-col gap-1"
            onValueChange={value =>
              setExpandedItems(prev => [...(prev ?? []), value[0]])}
            dir={dir as Direction}
          >
            {children}
          </AccordionPrimitive.Root>
        </ScrollArea>
      </div>
    </TreeContext>
  )
}

Tree.displayName = 'Tree'

function TreeIndicator({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) {
  const { direction } = useTree()

  return (
    <div
      dir={direction}
      ref={ref}
      className={cn(
        'absolute left-1.5 h-full w-px rounded-md bg-muted py-3 duration-300 ease-in-out hover:bg-slate-300 rtl:right-1.5',
        className,
      )}
      {...props}
    />
  )
}

TreeIndicator.displayName = 'TreeIndicator'

interface FolderComponentProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {}

type FolderProps = {
  expandedItems?: string[]
  element: string
  isSelectable?: boolean
  isSelect?: boolean
} & FolderComponentProps

function Folder({ ref, className, element, value, isSelectable = true, isSelect, children, ...props }: FolderProps & React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) {
  const {
    direction,
    handleExpand,
    expandedItems,
    indicator,
    setExpandedItems,
    openIcon,
    closeIcon,
  } = useTree()

  return (
    <AccordionPrimitive.Item
      {...props}
      value={value}
      className="relative h-full overflow-hidden"
    >
      <AccordionPrimitive.Trigger
        className={cn(
          `flex items-center gap-1 rounded-md text-sm`,
          className,
          {
            'bg-muted rounded-md': isSelect && isSelectable,
            'cursor-pointer': isSelectable,
            'cursor-not-allowed opacity-50': !isSelectable,
          },
        )}
        disabled={!isSelectable}
        onClick={() => handleExpand(value)}
      >
        {expandedItems?.includes(value)
          ? (openIcon ?? <FolderOpenIcon className="size-4" />)
          : (closeIcon ?? <FolderIcon className="size-4" />)}
        <span>{element}</span>
      </AccordionPrimitive.Trigger>
      <AccordionPrimitive.Content className="relative h-full overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        {element && indicator && <TreeIndicator aria-hidden="true" />}
        <AccordionPrimitive.Root
          dir={direction}
          type="multiple"
          className="ml-5 flex flex-col gap-1 py-1 rtl:mr-5 "
          defaultValue={expandedItems}
          value={expandedItems}
          onValueChange={(value) => {
            setExpandedItems?.(prev => [...(prev ?? []), value[0]])
          }}
        >
          {children}
        </AccordionPrimitive.Root>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  )
}

Folder.displayName = 'Folder'

function File({ ref, value, className, handleSelect, isSelectable = true, isSelect, fileIcon, children, ...props }: {
  value: string
  handleSelect?: (id: string) => void
  isSelectable?: boolean
  isSelect?: boolean
  fileIcon?: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement> & { ref?: React.RefObject<HTMLButtonElement | null> }) {
  const { direction, selectedId, selectItem } = useTree()
  const isSelected = isSelect ?? selectedId === value
  return (
    <button
      ref={ref}
      type="button"
      disabled={!isSelectable}
      className={cn(
        'flex w-fit items-center gap-1 rounded-md pr-1 text-sm duration-200 ease-in-out rtl:pl-1 rtl:pr-0',
        {
          'bg-muted': isSelected && isSelectable,
        },
        isSelectable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
        direction === 'rtl' ? 'rtl' : 'ltr',
        className,
      )}
      onClick={() => selectItem(value)}
      {...props}
    >
      {fileIcon ?? <FileIcon className="size-4" />}
      {children}
    </button>
  )
}

File.displayName = 'File'

function CollapseButton({ className, elements, expandAll = false, children, ...props }: {
  elements: TreeViewElement[]
  expandAll?: boolean
} & React.HTMLAttributes<HTMLButtonElement>) {
  const { expandedItems, setExpandedItems } = useTree()

  const expendAllTree = useCallback((elements: TreeViewElement[]) => {
    const expandTree = (element: TreeViewElement) => {
      const isSelectable = element.isSelectable ?? true
      if (isSelectable && element.children && element.children.length > 0) {
        setExpandedItems?.(prev => [...(prev ?? []), element.id])
        element.children.forEach(expandTree)
      }
    }

    elements.forEach(expandTree)
  }, [])

  const closeAll = useCallback(() => {
    setExpandedItems?.([])
  }, [])

  useEffect(() => {
    if (expandAll) {
      expendAllTree(elements)
    }
  }, [expandAll])

  return (
    <Button
      variant="ghost"
      className="absolute bottom-1 right-2 h-8 w-fit p-1"
      onClick={
        expandedItems && expandedItems.length > 0
          ? closeAll
          : () => expendAllTree(elements)
      }
      {...props}
    >
      {children}
      <span className="sr-only">Toggle</span>
    </Button>
  )
}

CollapseButton.displayName = 'CollapseButton'

export { CollapseButton, File, Folder, Tree, type TreeViewElement }
