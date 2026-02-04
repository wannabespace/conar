import { SOCIAL_LINKS } from '@conar/shared/constants'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { ThemeToggle } from '@conar/ui/components/custom/theme-toggle'
import { UserAvatar } from '@conar/ui/components/custom/user-avatar'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@conar/ui/components/dialog'
import { Label } from '@conar/ui/components/label'
import { Separator } from '@conar/ui/components/separator'
import { Textarea } from '@conar/ui/components/textarea'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import { RiDashboard3Line, RiFileListLine, RiGitBranchLine, RiGithubFill, RiLogoutCircleLine, RiMessageLine, RiMoonLine, RiShieldLine, RiSunLine } from '@remixicon/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, Outlet, redirect, useMatches, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Footer } from '~/components/footer'
import { NavbarTextLogo } from '~/components/navbar-text-logo'
import { authClient, getSessionIsomorphic } from '~/lib/auth'
import { orpcQuery } from '~/lib/orpc'

export const Route = createFileRoute('/account')({
  component: AccountLayout,
  loader: async () => {
    const { data } = await getSessionIsomorphic()

    if (!data?.user) {
      throw redirect({ to: '/sign-in' })
    }

    return data
  },
})

function SidebarButton({
  active = false,
  children,
  asChild = false,
  onClick,
}: {
  active?: boolean
  children: React.ReactNode
  asChild?: boolean
  onClick?: () => void
}) {
  return (
    <Button
      variant="ghost"
      className={cn(
        `w-full justify-start`,
        active && `bg-accent/50`,
      )}
      asChild={asChild}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function SupportButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')

  const { mutate: sendSupport, isPending: loading } = useMutation(orpcQuery.contact.mutationOptions({
    onSuccess: () => {
      toast.success('Support message sent successfully! We will get back to you as soon as possible.')
      setOpen(false)
      setMessage('')
    },
    onError: (err) => {
      console.error(err)
      toast.error('Failed to send message. Please try again later.')
    },
  }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendSupport({ message })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarButton>
          <RiMessageLine className="size-4" />
          Support
        </SidebarButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
        </DialogHeader>
        <div className="mb-2 text-muted-foreground">
          Have a question, suggestion, or need assistance?
          We're here to listen!
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="support-message">Message</Label>
            <Textarea
              id="support-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              placeholder="Type any message you'd like to send us"
              className="min-h-48"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || !message}>
              <LoadingContent loading={loading}>
                Send
              </LoadingContent>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AccountLayout() {
  const router = useRouter()
  const match = useMatches({
    select: matches => matches.map(match => match.routeId).at(-1),
  })
  const { data } = useQuery(orpcQuery.repo.queryOptions())
  const { user } = Route.useLoaderData()

  return (
    <div className={`
      container mx-auto flex min-h-screen flex-col justify-between px-4
    `}
    >
      <header className="mb-10 flex h-15 items-center justify-between">
        <NavbarTextLogo to="/home" />
        <div className="flex flex-1 justify-center">
          <Link to="/home" className="text-primary">
            <AppLogo
              className={`
                size-5
                sm:size-6
                lg:size-8
              `}
            />
          </Link>
        </div>
        <div className={`
          flex flex-1 items-center justify-end gap-1
          sm:gap-2
        `}
        >
          <Button
            variant="ghost"
            size="sm"
            className={`
              hidden gap-1
              sm:flex sm:gap-2
            `}
            asChild
          >
            <Link to="/releases">
              <RiGitBranchLine className={`
                size-3
                sm:size-4
              `}
              />
              Releases
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`
              hidden gap-1
              sm:flex sm:gap-2
            `}
            asChild
          >
            <a
              href={SOCIAL_LINKS.GITHUB}
              target="_blank"
              rel="noopener noreferrer"
            >
              <RiGithubFill className={`
                size-3
                sm:size-4
              `}
              />
              <NumberFlow
                value={data?.stargazers_count || 0}
                className={cn(`
                  text-xs tabular-nums duration-200
                  sm:text-sm
                `, !data && `animate-pulse text-muted-foreground`)}
              />
            </a>
          </Button>
          <ThemeToggle side="bottom">
            <Button size="icon-sm" variant="ghost">
              <RiSunLine className={`
                size-4
                dark:hidden
              `}
              />
              <RiMoonLine className={`
                hidden size-4
                dark:block
              `}
              />
            </Button>
          </ThemeToggle>
          <Button
            variant="outline"
            disabled
            size="sm"
          >
            Web version (soon)
          </Button>
          <Button
            size="sm"
            className={`
              gap-1 px-2 text-xs
              sm:gap-2 sm:px-3 sm:text-sm
            `}
            asChild
          >
            <Link to="/download">
              Download
            </Link>
          </Button>
        </div>
      </header>
      <div className="mb-10 flex flex-1 gap-6">
        <aside className="w-64 shrink-0">
          <div className="mb-4 flex items-center gap-3">
            <UserAvatar user={user} className="size-10" />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate font-medium">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <nav className="space-y-1">
            <SidebarButton active={match === '/account/'} asChild>
              <Link to="/account">
                <RiDashboard3Line className="size-4" />
                Dashboard
              </Link>
            </SidebarButton>
            <SidebarButton active={match === '/account/billing'} asChild>
              <Link to="/account/billing">
                <RiFileListLine className="size-4" />
                Billing & Invoices
              </Link>
            </SidebarButton>
            <SidebarButton active={match === '/account/settings'} asChild>
              <Link to="/account/settings">
                <RiShieldLine className="size-4" />
                Security
              </Link>
            </SidebarButton>
            <SupportButton />
            <Separator className="my-2" />
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground"
              onClick={() => authClient.signOut().then(() => router.invalidate())}
            >
              <RiLogoutCircleLine className="size-4" />
              Sign out
            </Button>
          </nav>
        </aside>
        <Separator orientation="vertical" />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
