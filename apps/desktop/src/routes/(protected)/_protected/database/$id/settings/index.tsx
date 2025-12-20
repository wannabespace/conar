import type { ReactNode } from 'react'
import { title } from '@conar/shared/utils/title'
import { Card, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Switch } from '@conar/ui/components/switch'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(protected)/_protected/database/$id/settings/')({
  component: DatabaseSettingsPage,
  loader: ({ context }) => ({ database: context.database }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title(`Settings - ${loaderData.database.name}`) }] : [],
  }),
})

function SettingItem({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Card className="border-border/60 hover:border-border transition-colors">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          <div className="flex items-center">
            <Switch
              checked={checked}
              onCheckedChange={onCheckedChange}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

function SettingSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  )
}

function DatabaseSettingsPage() {
  return (
    <ScrollArea className="bg-background rounded-lg border h-full">
      <div className="flex flex-col mx-auto max-w-3xl min-h-full p-5">
        <div className="mb-5">
          <h1 className="text-2xl font-bold mb-1">Application Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your application preferences</p>
        </div>
        <div className="space-y-5">
          <SettingSection title="Updates">
            <SettingItem
              title="Beta Updates"
              description="Enable to receive pre-release versions of the application."
              checked={false}
              onCheckedChange={() => {}}
            />
          </SettingSection>

          <SettingSection title="Database">
            <SettingItem
              title="Database Operations"
              description="Warning: Disabling this will prevent any data from being saved."
              checked={true}
              onCheckedChange={() => {}}
            />
          </SettingSection>

          <SettingSection title="Analytics & Privacy">
            <SettingItem
              title="Analytics & Privacy"
              description="Enable PostHog tracking to help us improve the application."
              checked={false}
              onCheckedChange={() => {}}
            />
          </SettingSection>
        </div>
      </div>
    </ScrollArea>
  )
}
