import { AppLogo } from '@connnect/ui/components/brand/app-logo'
import { AppLogoGradient } from '@connnect/ui/components/brand/app-logo-gradient'
import { AppTextLogo } from '@connnect/ui/components/brand/app-text-logo'
import { Button } from '@connnect/ui/components/button'
import { SmoothCorner } from '@connnect/ui/components/custom/smooth-corner'
import { RiGithubFill, RiTwitterXLine } from '@remixicon/react'

export function Navbar() {
  return (
    <header className="flex p-4 items-center justify-between w-full gap-10 rounded-lg border bg-background/70 backdrop-blur-xs fixed top-10 left-1/2 -translate-x-1/2 z-50 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-3">
          <AppLogoGradient className="hidden size-7 dark:block" />
          <SmoothCorner radius={7} className="flex size-7 items-center justify-center bg-primary dark:hidden">
            <AppLogo className="size-5 text-white" />
          </SmoothCorner>
        </div>
        <AppTextLogo className="h-4 w-22" />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="iconSm"
          className="gap-2"
          asChild
        >
          <a
            href="https://x.com/connnectapp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <RiTwitterXLine className="h-4 w-4" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="iconSm"
          className="gap-2"
          asChild
        >
          <a
            href="https://github.com/wannabespace/connnect"
            target="_blank"
            rel="noopener noreferrer"
          >
            <RiGithubFill className="h-4 w-4" />
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          asChild
        >
          <a
            href="https://github.com/wannabespace/connnect/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </a>
        </Button>
      </div>
    </header>
  )
}
