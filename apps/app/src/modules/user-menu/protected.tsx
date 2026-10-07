import { useHotkey } from '@tanstack/react-hotkeys'
import { useNavigate } from '@tanstack/react-router'

import type { ProtectedModule } from '~/lib/module'

import { UserButton } from './user-button'

const UserMenu = () => {
  const navigate = useNavigate()

  useHotkey('Mod+,', () => {
    void navigate({ to: '/settings' })
  })

  return (
    <>
      <span className="bg-border mx-1 h-4 w-px shrink-0 self-center" />
      <UserButton side="bottom" align="end" />
    </>
  )
}

export default {
  titlebar: [{ Component: UserMenu, order: 100 }],
} satisfies ProtectedModule
