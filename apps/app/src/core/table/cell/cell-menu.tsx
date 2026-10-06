import {
  ArrowDown02Icon,
  BracesIcon,
  CodeIcon,
  Copy01Icon,
  Csv01Icon,
  PencilEdit02Icon,
  TextIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { recordToMarkdownTable, toCSV } from '@tamery/shared/files'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import { copy } from '@tamery/ui/lib/copy'

import type { AppMenuNode } from '~/components/app-menu'

/** Items a host adds to the cell menu, each landing in the group it acts on. */
export interface CellMenuExtra {
  cell?: AppMenuNode[]
  /** Whole groups shown between the cell and row groups, e.g. a host's Column group. */
  groups?: AppMenuNode[]
  row?: AppMenuNode[]
}

export const cellMenu = ({
  cells,
  columns,
  editable,
  extra,
  onCopy,
  onFillDown,
  onOpen,
  onShowJson,
  row,
}: {
  cells: number
  columns: string[]
  editable: boolean
  extra: CellMenuExtra
  onCopy: () => void
  onFillDown?: () => void
  onOpen: () => void
  onShowJson?: () => void
  row: Record<string, unknown>
}): AppMenuNode[] => {
  const keys = columns.map((key) => ({ key }))
  return [
    {
      items: [
        {
          icon: editable ? PencilEdit02Icon : ViewIcon,
          label: editable ? 'Edit Value' : 'View Value',
          onSelect: onOpen,
        },
        ...(onShowJson
          ? [{ icon: BracesIcon, label: 'Show JSON', onSelect: onShowJson }]
          : []),
        {
          accelerator: 'CmdOrCtrl+C',
          icon: Copy01Icon,
          label: cells > 1 ? `Copy ${cells} Cells` : 'Copy Value',
          onSelect: onCopy,
          shortcut: (
            <KbdCtrlLetter userAgent={navigator.userAgent} letter="C" />
          ),
        },
        ...(onFillDown
          ? [
              {
                accelerator: 'CmdOrCtrl+D',
                icon: ArrowDown02Icon,
                label: 'Fill Down',
                onSelect: onFillDown,
                shortcut: (
                  <KbdCtrlLetter userAgent={navigator.userAgent} letter="D" />
                ),
              },
            ]
          : []),
        ...(extra.cell ?? []),
      ],
      label: 'Cell',
      type: 'group',
    },
    ...(extra.groups ? [{ type: 'separator' } as const, ...extra.groups] : []),
    { type: 'separator' },
    {
      items: [
        ...(extra.row ?? []),
        {
          icon: Copy01Icon,
          items: [
            {
              icon: CodeIcon,
              label: 'JSON',
              onSelect: () =>
                copy(JSON.stringify(row, null, 2), 'Row copied as JSON'),
            },
            {
              icon: Csv01Icon,
              label: 'CSV',
              onSelect: () => copy(toCSV(keys, [row]), 'Row copied as CSV'),
            },
            {
              icon: TextIcon,
              label: 'Markdown',
              onSelect: () =>
                copy(
                  recordToMarkdownTable(row, keys),
                  'Row copied as Markdown table'
                ),
            },
          ],
          label: 'Copy Row As',
          type: 'sub',
        },
      ],
      label: 'Row',
      type: 'group',
    },
  ]
}
