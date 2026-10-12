import { KbdHotkey } from '@tamery/ui/components/custom/shortcuts'

import type { ShortcutId } from './shortcuts'
import { SHORTCUTS } from './shortcuts'

export const ShortcutKbd = ({ shortcut }: { shortcut: ShortcutId }) =>
  SHORTCUTS[shortcut].hotkeys.map((hotkey) => (
    <KbdHotkey key={hotkey} hotkey={hotkey} userAgent={navigator.userAgent} />
  ))
