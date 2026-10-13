import { Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { SearchInput } from '@tamery/ui/components/custom/search-input'
import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useRef, useState } from 'react'

import { PaneEmpty } from '~/components/pane-empty'
import { ShortcutKbd } from '~/core/keyboard/shortcut-kbd'
import type { Shortcut } from '~/core/keyboard/shortcuts'
import { isShortcutAvailable, SHORTCUTS } from '~/core/keyboard/shortcuts'
import { useShortcut } from '~/core/keyboard/use-shortcuts'

import { SHORTCUT_GROUPS } from './shortcut-groups'

const KEY_ALIASES: Record<string, string[]> = {
  arrowdown: ['down', 'arrows'],
  arrowleft: ['left', 'arrows'],
  arrowright: ['right', 'arrows'],
  arrowup: ['up', 'arrows'],
  escape: ['escape', 'esc'],
  mod: ['mod', 'cmd', 'command', 'ctrl', '⌘'],
  shift: ['shift', '⇧'],
}

export const ShortcutsList = () => {
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const terms = search.toLowerCase().match(/[⌘⇧]|[^\s+⌘⇧]+/gu) ?? []
  const groups = SHORTCUT_GROUPS.map(({ shortcuts, title }) => ({
    shortcuts: shortcuts.filter((id) => {
      const {
        description,
        hotkeys,
        title: shortcutTitle,
      }: Shortcut = SHORTCUTS[id]
      const keys = hotkeys
        .flatMap((hotkey) => hotkey.toLowerCase().split('+'))
        .flatMap((key) => KEY_ALIASES[key] ?? key)
      const names = `${title} ${shortcutTitle}`.toLowerCase()
      const text = `${names} ${description.toLowerCase()} ${keys.join(' ')}`
      return (
        isShortcutAvailable(id) &&
        terms.every(
          (term) =>
            keys.includes(term) ||
            names.split(' ').some((word) => word.startsWith(term)) ||
            (term.length > 2 && text.includes(term))
        )
      )
    }),
    title,
  })).filter(({ shortcuts }) => shortcuts.length > 0)

  useShortcut('search', () => searchRef.current?.focus())
  useHotkey('Escape', () => setSearch(''), {
    enabled: !!search,
    target: searchRef,
  })

  return (
    <>
      <SearchInput
        ref={searchRef}
        placeholder="Search shortcuts"
        aria-label="Search shortcuts"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onClear={() => setSearch('')}
        start={<HugeiconsIcon icon={Search01Icon} strokeWidth={2} />}
        end={!search && <ShortcutKbd shortcut="search" />}
      />
      {groups.length === 0 && (
        <PaneEmpty
          icon={Search01Icon}
          title="No shortcuts found"
          description="Search by what it does, like copy, or by its key, like F."
        />
      )}
      {groups.map(({ shortcuts, title }) => (
        <SettingsGroup key={title} title={title}>
          {shortcuts.map((id) => (
            <SettingsRow
              key={id}
              title={SHORTCUTS[id].title}
              description={SHORTCUTS[id].description}
            >
              <ShortcutKbd shortcut={id} />
            </SettingsRow>
          ))}
        </SettingsGroup>
      ))}
    </>
  )
}
