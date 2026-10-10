interface Shortcut {
  /** One entry per way to press it: space-separated keys in macOS modifier order; `mod` is ⌘ or Ctrl. */
  combos: string[]
  description: string
  desktopOnly?: boolean
  title: string
}

export const SHORTCUT_GROUPS: { shortcuts: Shortcut[]; title: string }[] = [
  {
    shortcuts: [
      {
        combos: ['mod P'],
        description: 'Find any command or connection and run it.',
        title: 'Command palette',
      },
      {
        combos: ['mod ,'],
        description: 'Open these settings.',
        title: 'Settings',
      },
      {
        combos: ['Esc'],
        description:
          'Close or clear the innermost thing that is open, one step per press, until you land in the Navigator search.',
        title: 'Step back',
      },
      {
        combos: ['Tab'],
        description:
          'Move between the Navigator, the tab bar, the toolbar and the grid. Arrows move within each.',
        title: 'Next area',
      },
      {
        combos: ['mod .'],
        description:
          'Open the right-click menu of whatever has focus: a tab, a cell or a Navigator row.',
        title: 'Context menu',
      },
      {
        combos: ['mod S'],
        description: 'Apply the changes staged in the current tab.',
        title: 'Save changes',
      },
      {
        combos: ['mod R'],
        description: "Load the current tab's data again.",
        desktopOnly: true,
        title: 'Refresh',
      },
      {
        combos: ['shift mod N'],
        description: 'Open another window.',
        desktopOnly: true,
        title: 'New window',
      },
    ],
    title: 'App',
  },
  {
    shortcuts: [
      {
        combos: ['mod T'],
        description: 'Open a new query, a schema page or any table.',
        desktopOnly: true,
        title: 'New tab',
      },
      {
        combos: ['mod W'],
        description: 'Close the current tab.',
        desktopOnly: true,
        title: 'Close tab',
      },
      {
        combos: ['left', 'right'],
        description: 'Move between tabs while the tab bar has focus.',
        title: 'Switch tabs',
      },
      {
        combos: ['mod B'],
        description: 'Hide or show the Navigator.',
        title: 'Navigator',
      },
      {
        combos: ['mod J'],
        description: 'Show or hide the log of every query this connection ran.',
        title: 'Query logger',
      },
      {
        combos: ['mod L'],
        description: 'Open or close the AI assistant.',
        title: 'AI chat',
      },
    ],
    title: 'Tabs and panels',
  },
  {
    shortcuts: [
      {
        combos: ['up', 'down'],
        description:
          'Walk the list from the search field, starting on the open table.',
        title: 'Move',
      },
      {
        combos: ['enter', 'right'],
        description:
          'Open the highlighted table with the grid ready for the arrows, or expand a schema.',
        title: 'Open',
      },
      {
        combos: ['left'],
        description:
          'Collapse a schema, or jump from a table up to its schema.',
        title: 'Collapse',
      },
    ],
    title: 'Navigator',
  },
  {
    shortcuts: [
      {
        combos: ['mod F'],
        description: 'Focus the filter field to search rows or build a filter.',
        title: 'Filter',
      },
      {
        combos: ['Arrows'],
        description: 'Move the cell cursor. It stops at the edges.',
        title: 'Move cursor',
      },
      {
        combos: ['shift Arrows'],
        description: 'Grow the selection from the cursor.',
        title: 'Extend selection',
      },
      {
        combos: ['mod Arrows'],
        description: 'Jump to the first or last row or column.',
        title: 'Jump to edge',
      },
      {
        combos: ['mod A'],
        description: 'Select every cell.',
        title: 'Select all',
      },
      {
        combos: ['enter', 'F2'],
        description:
          'Edit the cell under the cursor. Typing starts an edit too, and Backspace clears the value.',
        title: 'Edit cell',
      },
      {
        combos: ['Space'],
        description:
          "Peek at the row a reference points to, or the cell's full value.",
        title: 'Peek',
      },
      {
        combos: ['shift Space'],
        description: 'Tick the rows under the selection.',
        title: 'Select rows',
      },
      {
        combos: ['mod C'],
        description:
          'Copy the selection as tab-separated text for a spreadsheet.',
        title: 'Copy',
      },
      {
        combos: ['mod V'],
        description:
          'Paste a block from a spreadsheet, starting at the cursor.',
        title: 'Paste',
      },
      {
        combos: ['mod D'],
        description:
          'Give every selected cell the value at the top of its column.',
        title: 'Fill down',
      },
      {
        combos: ['mod ⌫'],
        description: 'Delete the ticked rows, after you confirm.',
        title: 'Delete rows',
      },
      {
        combos: ['mod Z'],
        description: 'Undo the last staged change.',
        title: 'Undo',
      },
      {
        combos: ['shift mod Z'],
        description: 'Redo the change you undid.',
        title: 'Redo',
      },
      {
        combos: ['shift mod E'],
        description:
          'Switch the table between the grid and the documents view.',
        title: 'Grid or documents',
      },
    ],
    title: 'Table',
  },
  {
    shortcuts: [
      {
        combos: ['mod enter'],
        description: 'Run the selection, or the statement under the caret.',
        title: 'Run statement',
      },
      {
        combos: ['shift mod enter'],
        description: 'Run every statement in the tab.',
        title: 'Run all',
      },
      {
        combos: ['mod S'],
        description:
          'Save the selection, or the statement under the caret, as a query.',
        title: 'Save statement',
      },
      {
        combos: ['shift mod S'],
        description: 'Save the whole tab as a query.',
        title: 'Save tab',
      },
      {
        combos: ['mod K'],
        description:
          'Describe a change and let AI rewrite the statement in place.',
        title: 'Edit with AI',
      },
      {
        combos: ['mod I'],
        description: 'Let AI correct the statement whose last run failed.',
        title: 'Fix with AI',
      },
    ],
    title: 'Query',
  },
  {
    shortcuts: [
      {
        combos: ['mod N'],
        description: 'Add an item to the open list.',
        desktopOnly: true,
        title: 'Add',
      },
      {
        combos: ['mod enter'],
        description: 'Save the open form.',
        title: 'Save',
      },
      {
        combos: ['mod D'],
        description: 'Drop the highlighted item, after you confirm.',
        title: 'Drop',
      },
      {
        combos: ['mod F'],
        description: 'Find a table or column in the visualizer.',
        title: 'Search diagram',
      },
    ],
    title: 'Schema',
  },
]
