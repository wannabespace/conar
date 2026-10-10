import {
  ArrowDown02Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  ArrowUp02Icon,
  CornerDownLeftIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Ctrl } from '@tamery/ui/components/custom/shortcuts'
import { Kbd } from '@tamery/ui/components/kbd'

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

const ShortcutKbd = ({ combo }: { combo: string }) => (
  <Kbd>
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
)

export const ShortcutsList = () =>
  SHORTCUT_GROUPS.map(({ shortcuts, title }) => (
    <SettingsGroup key={title} title={title}>
      {shortcuts
        .filter(({ desktopOnly }) => !desktopOnly || window.electron)
        .map(({ combos, description, title: shortcutTitle }) => (
          <SettingsRow
            key={shortcutTitle}
            title={shortcutTitle}
            description={description}
          >
            {combos.map((combo) => (
              <ShortcutKbd key={combo} combo={combo} />
            ))}
          </SettingsRow>
        ))}
    </SettingsGroup>
  ))
