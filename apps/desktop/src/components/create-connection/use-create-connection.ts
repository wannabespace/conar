import type { ConnectionFields } from '@conar/connection'
import type { DatabaseType } from '@conar/shared/enums/database-type'
import { buildConnectionString, detectTypeFromConnectionString, parseConnectionString } from '@conar/connection'
import { useCallback, useMemo, useRef, useState } from 'react'
import { generateRandomName } from '~/lib/utils'

export interface CreateConnectionState {
  connectionString: string
  type: DatabaseType | null
  detectedType: DatabaseType | null
  name: string
  label: string | null
  color: string | null
  saveInCloud: boolean
  parseError: string | null
}

export interface CreateConnectionActions {
  setConnectionString: (value: string) => void
  setType: (type: DatabaseType | null) => void
  setName: (name: string) => void
  setLabel: (label: string | null) => void
  setColor: (color: string | null) => void
  setSaveInCloud: (saveInCloud: boolean) => void
  onFieldChange: (field: keyof ConnectionFields, value: string) => void
  regenerateName: () => void
  reset: () => void
}

export type CreateConnectionForm = CreateConnectionState & CreateConnectionActions & {
  formFields: ConnectionFields
  isValid: boolean
  effectiveType: DatabaseType | null
}

const emptyFields: ConnectionFields = {
  host: '',
  port: undefined,
  user: undefined,
  password: undefined,
  database: undefined,
  options: undefined,
}

function createInitialState(): CreateConnectionState {
  return {
    connectionString: '',
    type: null,
    detectedType: null,
    name: generateRandomName(),
    label: null,
    color: null,
    saveInCloud: true,
    parseError: null,
  }
}

export function useCreateConnection(): CreateConnectionForm {
  const [state, setState] = useState<CreateConnectionState>(createInitialState)

  const lastChangeSource = useRef<'string' | 'form' | null>(null)

  const formFields = useMemo((): ConnectionFields => {
    if (!state.connectionString.trim()) {
      return emptyFields
    }

    try {
      const parsed = parseConnectionString(state.connectionString)
      return {
        host: parsed.host,
        port: parsed.port,
        user: parsed.user,
        password: parsed.password,
        database: parsed.database,
        options: parsed.searchParams.toString() || undefined,
      }
    }
    catch {
      if (lastChangeSource.current !== 'form') {
        return emptyFields
      }
      return emptyFields
    }
  }, [state.connectionString])

  const setConnectionString = useCallback((value: string) => {
    lastChangeSource.current = 'string'

    const detectedType = detectTypeFromConnectionString(value)
    let parseError: string | null = null

    if (value.trim()) {
      try {
        parseConnectionString(value)
      }
      catch (error) {
        parseError = error instanceof Error ? error.message : 'Invalid connection string'
      }
    }

    setState(prev => ({
      ...prev,
      connectionString: value,
      detectedType,
      type: detectedType && !prev.type ? detectedType : prev.type,
      parseError,
    }))
  }, [])

  const setType = useCallback((type: DatabaseType | null) => {
    setState(prev => ({ ...prev, type }))
  }, [])

  const setName = useCallback((name: string) => {
    setState(prev => ({ ...prev, name }))
  }, [])

  const setLabel = useCallback((label: string | null) => {
    setState(prev => ({ ...prev, label }))
  }, [])

  const setColor = useCallback((color: string | null) => {
    setState(prev => ({ ...prev, color }))
  }, [])

  const setSaveInCloud = useCallback((saveInCloud: boolean) => {
    setState(prev => ({ ...prev, saveInCloud }))
  }, [])

  const onFieldChange = useCallback((field: keyof ConnectionFields, value: string) => {
    lastChangeSource.current = 'form'

    setState((prev) => {
      let currentFields: ConnectionFields = emptyFields
      if (prev.connectionString.trim()) {
        try {
          const parsed = parseConnectionString(prev.connectionString)
          currentFields = {
            host: parsed.host,
            port: parsed.port,
            user: parsed.user,
            password: parsed.password,
            database: parsed.database,
            options: parsed.searchParams.toString() || undefined,
          }
        }
        catch {
        }
      }

      const updatedFields: ConnectionFields = {
        ...currentFields,
        [field]: value || undefined,
      }

      if (field === 'port') {
        updatedFields.port = value ? Number.parseInt(value, 10) : undefined
      }

      const effectiveType = prev.type || prev.detectedType
      if (!effectiveType) {
        return prev
      }

      const newConnectionString = buildConnectionString(effectiveType, updatedFields)
      const detectedType = detectTypeFromConnectionString(newConnectionString)

      return {
        ...prev,
        connectionString: newConnectionString,
        detectedType,
        parseError: null,
      }
    })
  }, [])

  const regenerateName = useCallback(() => {
    setState(prev => ({ ...prev, name: generateRandomName() }))
  }, [])

  const reset = useCallback(() => {
    setState(createInitialState())
    lastChangeSource.current = null
  }, [])

  const effectiveType = state.type || state.detectedType

  const isValid = useMemo(() => {
    if (!effectiveType)
      return false
    if (!state.connectionString.trim())
      return false
    if (state.parseError)
      return false
    if (!state.name.trim())
      return false
    if (!formFields.host)
      return false
    return true
  }, [effectiveType, state.connectionString, state.parseError, state.name, formFields.host])

  return {
    ...state,
    formFields,
    isValid,
    effectiveType,
    setConnectionString,
    setType,
    setName,
    setLabel,
    setColor,
    setSaveInCloud,
    onFieldChange,
    regenerateName,
    reset,
  }
}
