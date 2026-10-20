import { ContrastIcon, Menu01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { Button } from '@tamery/ui/components/button'
import { ThemeToggle } from '@tamery/ui/components/custom/theme-toggle'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@tamery/ui/components/drawer'
import { Link, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'

import { nav } from '~/lib/nav'

import { docsLinkProps } from './docs-link'
import { Search } from './search'
import { Sidebar } from './sidebar'

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const activeTab = useRouterState({
    select: (state) => nav.getActiveTab(state.location.pathname),
  })

  return (
    <header className="border-border bg-body/80 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4">
        <Drawer
          onOpenChange={setMenuOpen}
          open={menuOpen}
          swipeDirection="left"
        >
          <Button
            aria-label="Sections"
            className="lg:hidden"
            onClick={() => setMenuOpen(true)}
            size="icon-sm"
            variant="ghost-muted"
          >
            <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
          </Button>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Docs</DrawerTitle>
            </DrawerHeader>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </DrawerContent>
        </Drawer>
        <Link
          className="text-foreground flex items-center gap-2 text-base font-semibold tracking-tight"
          to="/$"
        >
          <AppLogo aria-hidden="true" className="text-primary size-5" />
          Tamery
        </Link>
        <nav
          aria-label="Documentation sections"
          className="ml-2 hidden items-center md:flex"
        >
          {nav.tabs.map((tab) => (
            <Button
              key={tab.label}
              render={
                <Link
                  {...docsLinkProps(tab.groups[0]?.pages[0]?.href ?? '/')}
                />
              }
              size="sm"
              variant={tab === activeTab ? 'secondary' : 'ghost-muted'}
            >
              {tab.label}
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Search />
          <ThemeToggle
            render={
              <Button
                aria-label="Appearance"
                size="icon"
                variant="ghost-muted"
              />
            }
            side="bottom"
          >
            <HugeiconsIcon icon={ContrastIcon} strokeWidth={2} />
          </ThemeToggle>
          <Button
            render={
              <a aria-label="Download" href="https://tamery.app/download" />
            }
          >
            Download
          </Button>
        </div>
      </div>
    </header>
  )
}
