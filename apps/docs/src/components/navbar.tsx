import { ContrastIcon, Menu01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { Button } from '@tamery/ui/components/button'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import { ThemeToggle } from '@tamery/ui/components/custom/theme-toggle'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@tamery/ui/components/drawer'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { WEB_URL } from '~/constants'

import { Search } from './search'
import { Sidebar } from './sidebar'

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-body sticky top-0 z-40 flex h-14 items-center gap-2 px-4 lg:px-6">
      <Drawer onOpenChange={setMenuOpen} open={menuOpen} swipeDirection="left">
        <IconButton
          className="-ml-1.5 lg:hidden"
          icon={Menu01Icon}
          label="Menu"
          onClick={() => setMenuOpen(true)}
          side="bottom"
          size="icon-sm"
          variant="ghost-muted"
        />
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Docs</DrawerTitle>
          </DrawerHeader>
          <div className="min-h-0 overflow-y-auto px-2 pb-4">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>
      <div className="flex items-center gap-2 text-base tracking-tight">
        <a
          className="text-foreground flex items-center gap-2 font-semibold"
          href={WEB_URL}
        >
          <AppLogo aria-hidden="true" className="text-primary size-5" />
          Tamery
        </a>
        <Link
          className="text-muted-foreground hover:text-foreground transition-colors"
          params={{ _splat: 'introduction' }}
          to="/$"
        >
          Docs
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Search />
        <ThemeToggle
          render={
            <Button
              aria-label="Appearance"
              size="icon-sm"
              variant="ghost-muted"
            />
          }
          side="bottom"
        >
          <HugeiconsIcon icon={ContrastIcon} strokeWidth={2} />
        </ThemeToggle>
        <Button
          render={<a aria-label="Download" href={`${WEB_URL}/download`} />}
          size="sm"
        >
          Download
        </Button>
      </div>
    </header>
  )
}
