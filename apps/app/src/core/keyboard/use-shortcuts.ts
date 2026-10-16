import type {
  HotkeyCallback,
  UseHotkeyChordOptions,
} from '@tanstack/react-hotkeys'
import { useHotkeys } from '@tanstack/react-hotkeys'

import type { ShortcutId } from './shortcuts'
import { isShortcutAvailable, SHORTCUTS } from './shortcuts'

export const useShortcuts = (
  definitions: {
    callback: HotkeyCallback
    options?: UseHotkeyChordOptions
    shortcut: ShortcutId
  }[],
  options?: UseHotkeyChordOptions
) =>
  useHotkeys(
    definitions.flatMap(({ shortcut, ...definition }) =>
      isShortcutAvailable(shortcut)
        ? SHORTCUTS[shortcut].hotkeys.map((hotkey) => ({
            ...definition,
            hotkey,
          }))
        : []
    ),
    options
  )

export const useShortcut = (
  shortcut: ShortcutId,
  callback: HotkeyCallback,
  options?: UseHotkeyChordOptions
) => useShortcuts([{ callback, shortcut }], options)
