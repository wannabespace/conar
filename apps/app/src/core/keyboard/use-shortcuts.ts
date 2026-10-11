import type { HotkeyCallback, UseHotkeyOptions } from '@tanstack/react-hotkeys'
import { useHotkeys } from '@tanstack/react-hotkeys'

import type { ShortcutId } from './shortcuts'
import { SHORTCUTS } from './shortcuts'

export const useShortcuts = (
  definitions: {
    callback: HotkeyCallback
    options?: UseHotkeyOptions
    shortcut: ShortcutId
  }[],
  options?: UseHotkeyOptions
) =>
  useHotkeys(
    definitions.flatMap(({ shortcut, ...definition }) =>
      SHORTCUTS[shortcut].hotkeys.map((hotkey) => ({ ...definition, hotkey }))
    ),
    options
  )

export const useShortcut = (
  shortcut: ShortcutId,
  callback: HotkeyCallback,
  options?: UseHotkeyOptions
) => useShortcuts([{ callback, shortcut }], options)
