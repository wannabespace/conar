import type { ReactNode } from 'react'
import { title } from '@conar/shared/utils/title'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { createFileRoute } from '@tanstack/react-router'
import { SettingItem } from './-components/setting-item'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/settings/',
)({
  component: DatabaseSettingsPage,
  loader: ({ context }) => ({ database: context.database }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title(`Settings - ${loaderData.database.name}`) }] : [],
  }),
})

function SettingSection({ title, children }: { title: string, children: ReactNode }) {
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
          <p className="text-muted-foreground text-sm">
            Manage your application preferences
          </p>
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
