import type { DatabaseType } from '@conar/shared/enums/database-type'
import { COLOR_OPTIONS, LABEL_OPTIONS } from '@conar/shared/constants'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { ButtonGroup } from '@conar/ui/components/button-group'
import { Checkbox } from '@conar/ui/components/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@conar/ui/components/collapsible'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { cn } from '@conar/ui/lib/utils'
import { RiCodeLine, RiInputField, RiLoopLeftLine, RiSettings3Line } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { v7 } from 'uuid'
import { databasesCollection, executeSql, prefetchDatabaseCore } from '~/entities/database'
import { ConnectionStringInput } from './connection-string-input'
import { CredentialsForm } from './credentials-form'
import { TypeSelector } from './type-selector'
import { useCreateConnection } from './use-create-connection'

interface CreateConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateConnectionDialog({ open, onOpenChange }: CreateConnectionDialogProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'string' | 'form'>('string')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const nameId = useId()
  const labelId = useId()

  const form = useCreateConnection()

  const createConnection = (data: {
    connectionString: string
    name: string
    type: DatabaseType
    saveInCloud: boolean
    label: string | null
    color: string | null
  }) => {
    const id = v7()
    const password = new SafeURL(data.connectionString.trim()).password

    databasesCollection.insert({
      id,
      name: data.name,
      type: data.type,
      connectionString: data.connectionString,
      label: data.label || null,
      color: data.color || null,
      isPasswordExists: !!password,
      isPasswordPopulated: !!password,
      syncType: data.saveInCloud ? SyncType.Cloud : SyncType.CloudWithoutPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    toast.success('Connection created successfully 🎉')

    const database = databasesCollection.get(id)!
    prefetchDatabaseCore(database)

    return id
  }

  const { mutate: testAndSave, status, reset: resetMutation } = useMutation({
    mutationFn: async ({ type, connectionString }: { type: DatabaseType, connectionString: string }) => {
      await executeSql({
        type,
        connectionString,
        sql: 'SELECT 1',
      })
      return { type, connectionString }
    },
    onSuccess: ({ type, connectionString }) => {
      const id = createConnection({
        type,
        connectionString,
        name: form.name,
        saveInCloud: form.saveInCloud,
        label: form.label,
        color: form.color,
      })

      form.reset()
      resetMutation()
      setActiveTab('string')
      setAdvancedOpen(false)
      onOpenChange(false)

      router.navigate({ to: '/database/$id/table', params: { id } })
    },
    onError: (error) => {
      toast.error('We couldn\'t connect to the database', {
        // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
        description: <span dangerouslySetInnerHTML={{ __html: error.message.replaceAll('\n', '<br />') }} />,
      })
    },
  })

  const handleSubmit = () => {
    if (!form.effectiveType || !form.connectionString) {
      toast.error('Please provide a connection string and select a database type')
      return
    }

    testAndSave({
      type: form.effectiveType,
      connectionString: form.connectionString,
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset()
      resetMutation()
      setActiveTab('string')
      setAdvancedOpen(false)
    }
    onOpenChange(newOpen)
  }

  const isPending = status === 'pending'
  const isError = status === 'error'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="create-connection-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AppLogo className="size-5" />
            Create Connection
          </DialogTitle>
          <DialogDescription>
            Connect to your database by providing a connection string or filling in the form.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'string' | 'form')}>
            <TabsList className="w-full">
              <TabsTrigger value="string" className="flex-1 gap-2" data-testid="tab-string">
                <RiCodeLine className="size-4" />
                Connection String
              </TabsTrigger>
              <TabsTrigger value="form" className="flex-1 gap-2" data-testid="tab-form">
                <RiInputField className="size-4" />
                Manual Form
              </TabsTrigger>
            </TabsList>

            <TabsContent value="string" className="mt-4">
              <ConnectionStringInput
                connectionString={form.connectionString}
                type={form.effectiveType}
                parseError={form.parseError}
                setConnectionString={form.setConnectionString}
                onEnter={handleSubmit}
              />
            </TabsContent>

            <TabsContent value="form" className="mt-4">
              <CredentialsForm
                type={form.effectiveType}
                fields={form.formFields}
                onFieldChange={form.onFieldChange}
                onEnter={handleSubmit}
              />
              {form.connectionString && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Generated connection string:
                  </Label>
                  <code className="text-xs font-mono break-all text-foreground/80">
                    {form.connectionString.replace(/:[^:@]+@/, ':****@')}
                  </code>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <TypeSelector
            type={form.type}
            detectedType={form.detectedType}
            setType={form.setType}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor={nameId}>
              Connection Name
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id={nameId}
                data-testid="name-input"
                placeholder="My Database"
                value={form.name}
                onChange={e => form.setName(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={form.regenerateName}
                title="Generate random name"
              >
                <RiLoopLeftLine className="size-4" />
              </Button>
            </div>
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
                <RiSettings3Line className="size-4" />
                Advanced options
                <span className="text-xs">
                  (
                  {advancedOpen ? 'collapse' : 'expand'}
                  )
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor={labelId}>
                  Label
                  <span className="text-xs text-muted-foreground/50 ml-1.5">(optional)</span>
                </Label>
                <Input
                  id={labelId}
                  data-testid="label-input"
                  placeholder="Development, Production, Staging, etc."
                  value={form.label ?? ''}
                  onChange={e => form.setLabel(e.target.value || null)}
                />
                <ButtonGroup>
                  {LABEL_OPTIONS.map(option => (
                    <Button
                      key={option}
                      type="button"
                      variant={form.label === option ? 'default' : 'outline'}
                      size="xs"
                      onClick={() => form.setLabel(option)}
                      className="border!"
                    >
                      {option}
                    </Button>
                  ))}
                </ButtonGroup>
              </div>

              <div className="flex flex-col gap-2">
                <Label>
                  Color
                  <span className="text-xs text-muted-foreground/50 ml-1.5">(optional)</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(colorOption => (
                    <button
                      key={colorOption}
                      type="button"
                      className={cn(
                        'size-6 rounded-full transition-all bg-(--color) cursor-pointer',
                        form.color === colorOption && 'ring-2 ring-offset-2 ring-offset-background ring-(--color)',
                      )}
                      style={{ '--color': colorOption } as React.CSSProperties}
                      onClick={() => form.setColor(form.color === colorOption ? null : colorOption)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm flex items-center gap-2">
                  <Checkbox
                    checked={form.saveInCloud}
                    onCheckedChange={() => form.setSaveInCloud(!form.saveInCloud)}
                  />
                  Sync password in cloud
                </label>
                <p className="text-xs text-muted-foreground/50 text-balance">
                  Syncing passwords allows access from any device without re-entering.
                  If not synced, we store the connection without the password.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            data-testid="submit"
            disabled={isPending || !form.isValid}
            onClick={handleSubmit}
          >
            <LoadingContent loading={isPending}>
              <AppLogo className="size-4" />
              {isError ? 'Retry' : 'Test & Save'}
            </LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
