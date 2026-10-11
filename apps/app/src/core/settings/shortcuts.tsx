import {
  ArrowDown02Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  ArrowUp02Icon,
  CornerDownLeftIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { SearchInput } from '@tamery/ui/components/custom/search-input'
import { Ctrl, KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import { Kbd } from '@tamery/ui/components/kbd'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useRef, useState } from 'react'

import { PaneEmpty } from '~/components/pane-empty'

import { SettingsGroup, SettingsRow } from './settings-group'
import { SHORTCUT_GROUPS } from './shortcut-groups'

const KEY_ICONS: Record<string, IconSvgElement> = {
  down: ArrowDown02Icon,
  enter: CornerDownLeftIcon,
  left: ArrowLeft02Icon,
  right: ArrowRight02Icon,
  shift: ArrowUp02Icon,
  up: ArrowUp02Icon,
}

const KEY_ALIASES: Record<string, string[]> = {
  mod: ['mod', 'cmd', 'command', 'ctrl', '⌘'],
  shift: ['shift', '⇧'],
}

export const ShortcutsList = () => {
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const terms = search.toLowerCase().match(/[⌘⇧]|[^\s+⌘⇧]+/gu) ?? []
  const groups = SHORTCUT_GROUPS.map(({ shortcuts, title }) => ({
    shortcuts: shortcuts.filter(
      ({ combos, desktopOnly, description, title: shortcutTitle }) => {
        const keys = combos
          .flatMap((combo) => combo.toLowerCase().split(' '))
          .flatMap((key) => KEY_ALIASES[key] ?? key)
        const names = `${title} ${shortcutTitle}`.toLowerCase()
        const text = `${names} ${description.toLowerCase()} ${keys.join(' ')}`
        return (
          (!desktopOnly || window.electron) &&
          terms.every(
            (term) =>
              keys.includes(term) ||
              names.split(' ').some((word) => word.startsWith(term)) ||
              (term.length > 2 && text.includes(term))
          )
        )
      }
    ),
    title,
  })).filter(({ shortcuts }) => shortcuts.length > 0)

  useHotkey('Mod+F', () => searchRef.current?.focus())
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
        end={
          !search && (
            <KbdCtrlLetter userAgent={navigator.userAgent} letter="F" />
          )
        }
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
          {shortcuts.map(({ combos, description, title: shortcutTitle }) => (
            <SettingsRow
              key={shortcutTitle}
              title={shortcutTitle}
              description={description}
            >
              {combos.map((combo) => (
                <Kbd key={combo}>
                  {combo.split(' ').map((key) => {
                    if (key === 'mod') {
                      return <Ctrl key={key} userAgent={navigator.userAgent} />
                    }
                    const icon = KEY_ICONS[key]
                    return icon ? (
                      <HugeiconsIcon key={key} icon={icon} strokeWidth={2} />
                    ) : (
                      <span key={key}>{key}</span>
                    )
                  })}
                </Kbd>
              ))}
            </SettingsRow>
          ))}
        </SettingsGroup>
      ))}
    </>
  )
}
