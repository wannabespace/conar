import { RiHeartLine, RiSearchLine, RiStarLine } from '@remixicon/react'
import { title } from '@tamery/shared/utils/title'
import { Alert, AlertDescription, AlertTitle } from '@tamery/ui/components/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@tamery/ui/components/avatar'
import { Badge } from '@tamery/ui/components/badge'
import { Button } from '@tamery/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'
import { Checkbox } from '@tamery/ui/components/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@tamery/ui/components/dialog'
import { Input } from '@tamery/ui/components/input'
import { Kbd, KbdGroup } from '@tamery/ui/components/kbd'
import { Label } from '@tamery/ui/components/label'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
  ProgressValue,
} from '@tamery/ui/components/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { Separator } from '@tamery/ui/components/separator'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { Slider } from '@tamery/ui/components/slider'
import { Spinner } from '@tamery/ui/components/spinner'
import { Switch } from '@tamery/ui/components/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tamery/ui/components/tabs'
import { Textarea } from '@tamery/ui/components/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'

import { enterAppAnimation } from '~/global-hooks'

export const Route = createFileRoute('/dev')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' })
    }
  },
  component: DevPage,
  head: () => ({
    meta: [{ title: title('Dev — Components') }],
  }),
})

function Section({ title: heading, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2
          className="
          text-sm font-semibold tracking-tight text-muted-foreground uppercase
        "
        >
          {heading}
        </h2>
        <Separator className="mt-2" />
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

function DevPage() {
  useEffect(() => {
    enterAppAnimation()
  }, [])

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Component gallery</h1>
          <p className="text-sm text-muted-foreground">
            Dev-only preview of UI components. Route redirects home in production.
          </p>
        </div>

        <Section title="Buttons">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Star">
            <RiStarLine />
          </Button>
          <Button>
            <RiHeartLine />
            With icon
          </Button>
        </Section>

        <Section title="Badges">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </Section>

        <Section title="Inputs">
          <div className="flex w-64 flex-col gap-2">
            <Label htmlFor="dev-input">Text input</Label>
            <Input id="dev-input" placeholder="Type here…" />
          </div>
          <div className="flex w-64 flex-col gap-2">
            <Label>Disabled</Label>
            <Input placeholder="Disabled" disabled />
          </div>
          <div className="flex w-64 flex-col gap-2">
            <Label htmlFor="dev-textarea">Textarea</Label>
            <Textarea id="dev-textarea" placeholder="Multiple lines…" />
          </div>
        </Section>

        <Section title="Select">
          <Select defaultValue="apple">
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Pick a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="cherry">Cherry</SelectItem>
            </SelectContent>
          </Select>
        </Section>

        <Section title="Toggles">
          <div className="flex items-center gap-2">
            <Switch id="dev-switch" defaultChecked />
            <Label htmlFor="dev-switch">Switch</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="dev-checkbox" defaultChecked />
            <Label htmlFor="dev-checkbox">Checkbox</Label>
          </div>
          <Slider defaultValue={[40]} className="w-56" />
        </Section>

        <Section title="Tabs">
          <Tabs defaultValue="one" className="w-full">
            <TabsList>
              <TabsTrigger value="one">Overview</TabsTrigger>
              <TabsTrigger value="two">Activity</TabsTrigger>
              <TabsTrigger value="three">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="one" className="text-sm text-muted-foreground">
              Overview panel
            </TabsContent>
            <TabsContent value="two" className="text-sm text-muted-foreground">
              Activity panel
            </TabsContent>
            <TabsContent value="three" className="text-sm text-muted-foreground">
              Settings panel
            </TabsContent>
          </Tabs>
        </Section>

        <Section title="Dialog & Popover">
          <Dialog>
            <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog title</DialogTitle>
                <DialogDescription>
                  This is a dialog description explaining the action.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost">Cancel</Button>} />
                <DialogClose render={<Button>Confirm</Button>} />
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Popover>
            <PopoverTrigger render={<Button variant="outline">Open popover</Button>} />
            <PopoverContent className="w-64">
              <PopoverHeader>
                <PopoverTitle>Popover title</PopoverTitle>
                <PopoverDescription>
                  Small floating panel anchored to the trigger.
                </PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </Section>

        <Section title="Alert">
          <Alert className="w-full">
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>This is an informational alert message.</AlertDescription>
          </Alert>
        </Section>

        <Section title="Card">
          <Card className="w-72">
            <CardHeader>
              <CardTitle>Card title</CardTitle>
              <CardDescription>Short supporting description.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Body content goes here.
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
        </Section>

        <Section title="Avatar">
          <Avatar>
            <AvatarImage src="https://github.com/wannabespace.png" alt="avatar" />
            <AvatarFallback>WS</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
        </Section>

        <Section title="Progress & Spinner">
          <Progress value={65} className="w-56">
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
            <ProgressValue />
          </Progress>
          <Spinner />
        </Section>

        <Section title="Tooltip & Kbd">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="outline">
                  <RiSearchLine /> Hover me
                </Button>
              }
            />
            <TooltipContent>Search everything</TooltipContent>
          </Tooltip>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Section>

        <Section title="Skeleton">
          <div className="flex w-64 flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-1/3" />
          </div>
        </Section>
      </div>
    </div>
  )
}
