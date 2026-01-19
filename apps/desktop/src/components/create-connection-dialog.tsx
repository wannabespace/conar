import { DatabaseType } from '@conar/shared/enums/database-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
import { RiArrowLeftSLine } from '@remixicon/react'
import { useForm, useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useStore as useAppStore } from '@tanstack/react-store'
import { type } from 'arktype'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { v7 } from 'uuid'
import { executeSql } from '~/entities/database/sql'
import { databasesCollection } from '~/entities/database/sync'
import { prefetchDatabaseCore } from '~/entities/database/utils'
import { generateRandomName } from '~/lib/utils'
import { StepCredentials } from '~/routes/_protected/create/-components/step-credentials'
import { StepSave } from '~/routes/_protected/create/-components/step-save'
import { StepType } from '~/routes/_protected/create/-components/step-type'
import { appStore, setIsCreateConnectionDialogOpen } from '~/store'

const createConnectionType = type({
  name: 'string > 1',
  type: type.valueOf(DatabaseType).or('null'),
  connectionString: 'string > 1',
  saveInCloud: 'boolean',
  label: 'string | null',
  color: 'string | null',
})

type Step = 'type' | 'credentials' | 'save'

const stepTitles: Record<Step, string> = {
  type: 'Select database type',
  credentials: 'Enter credentials',
  save: 'Save connection',
}

const stepDescriptions: Record<Step, string> = {
  type: 'Choose the type of database you want to connect to.',
  credentials: 'Enter your database credentials to establish a connection.',
  save: 'Review and save your connection settings.',
}

export function CreateConnectionDialog() {
  const open = useAppStore(appStore, ({ isCreateConnectionDialogOpen }) => isCreateConnectionDialogOpen)
  const [step, setStep] = useState<Step>('type')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const defaultValues: typeof createConnectionType.infer = {
    connectionString: '',
    name: generateRandomName(),
    type: null,
    saveInCloud: true,
    label: null,
    color: null,
  }

  const form = useForm({
    defaultValues,
    validators: {
      onChange: createConnectionType,
    },
    onSubmit(e) {
      const { type: dbType, connectionString, name, saveInCloud, label, color } = e.value

      if (!dbType) {
        toast.error('Select a database type')
        return
      }

      createConnection({ type: dbType, connectionString, name, saveInCloud, label, color })
    },
  })

  const {
    values: {
      type: typeValue,
      connectionString,
      name,
      saveInCloud,
      label,
      color,
    },
    isValid,
  } = useStore(form.store, ({ values, isValid }) => ({ values, isValid }))

  function createConnection(data: {
    connectionString: string
    name: string
    type: DatabaseType
    saveInCloud: boolean
    label: string | null
    color: string | null
  }) {
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

    setIsCreateConnectionDialogOpen(false)
    resetDialog()
    router.navigate({ to: '/database/$id/table', params: { id } })
  }

  const { mutate: test, reset: resetMutation, status } = useMutation({
    mutationFn: ({ type: dbType, connectionString }: { type: DatabaseType, connectionString: string }) => executeSql({
      type: dbType,
      connectionString,
      sql: 'SELECT 1',
    }),
    onSuccess: () => {
      setStep('save')
      toast.success('Connection successful. You can save the database.')
    },
    onError: (error) => {
      toast.error('We couldn\'t connect to the database', {
        description: (
          <span className="whitespace-pre-line">
            {error.message}
          </span>
        ),
      })
    },
  })

  function resetDialog() {
    setStep('type')
    form.reset()
    resetMutation()
  }

  function handleOpenChange(newOpen: boolean) {
    setIsCreateConnectionDialogOpen(newOpen)
    if (!newOpen) {
      resetDialog()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              {step !== 'type' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => {
                    if (step === 'credentials') {
                      form.setFieldValue('type', null)
                      form.setFieldValue('connectionString', '')
                      resetMutation()
                      setStep('type')
                    }
                    else if (step === 'save') {
                      setStep('credentials')
                    }
                  }}
                >
                  <RiArrowLeftSLine className="size-4" />
                </Button>
              )}
              <DialogTitle>{stepTitles[step]}</DialogTitle>
            </div>
            <DialogDescription>{stepDescriptions[step]}</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {step === 'type' && (
              <StepType
                type={typeValue}
                setType={(dbType) => {
                  if (typeValue && typeValue !== dbType) {
                    form.setFieldValue('connectionString', '')
                    resetMutation()
                  }
                  form.setFieldValue('type', dbType)
                  setStep('credentials')
                }}
              />
            )}

            {step === 'credentials' && typeValue && (
              <StepCredentials
                ref={inputRef}
                type={typeValue}
                connectionString={connectionString}
                setConnectionString={(cs) => {
                  resetMutation()
                  form.setFieldValue('connectionString', cs)
                }}
                onEnter={() => {
                  test({ type: typeValue, connectionString })
                }}
              />
            )}

            {step === 'save' && typeValue && (
              <StepSave
                type={typeValue}
                name={name}
                connectionString={connectionString}
                setName={name => form.setFieldValue('name', name)}
                onRandomName={() => form.setFieldValue('name', generateRandomName())}
                saveInCloud={saveInCloud}
                setSaveInCloud={saveInCloud => form.setFieldValue('saveInCloud', saveInCloud)}
                label={label}
                setLabel={label => form.setFieldValue('label', label)}
                color={color}
                setColor={color => form.setFieldValue('color', color)}
              />
            )}
          </div>

          {step === 'credentials' && (
            <DialogFooter className="mt-6">
              {status === 'success'
                ? (
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => setStep('save')}
                    >
                      Continue
                    </Button>
                  )
                : (
                    <Button
                      type="button"
                      disabled={status === 'pending' || !connectionString}
                      onClick={() => typeValue && test({ type: typeValue, connectionString })}
                    >
                      <LoadingContent loading={status === 'pending'}>
                        {status === 'error' ? 'Try again' : 'Test connection'}
                      </LoadingContent>
                    </Button>
                  )}
            </DialogFooter>
          )}

          {step === 'save' && (
            <DialogFooter className="mt-6">
              <Button
                type="submit"
                disabled={status === 'pending' || !isValid}
              >
                <LoadingContent loading={status === 'pending'}>
                  <AppLogo className="w-4" />
                  Save connection
                </LoadingContent>
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
