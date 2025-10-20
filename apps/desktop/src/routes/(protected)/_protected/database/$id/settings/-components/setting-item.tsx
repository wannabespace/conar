import { Card, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { Switch } from '@conar/ui/components/switch'

interface SettingItemProps {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function SettingItem({ title, description, checked, onCheckedChange }: SettingItemProps) {
  return (
    <Card className="border-border/60 hover:border-border transition-colors">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm">
              {description}
            </CardDescription>
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
