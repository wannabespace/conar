import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { editor } from 'monaco-editor'
import type { CompletionRegistration } from 'monacopilot'
import type { RefObject } from 'react'
import * as monaco from 'monaco-editor'
import { LanguageIdEnum } from 'monaco-sql-languages'
import { registerCompletion } from 'monacopilot'
import { useEffect, useRef } from 'react'
import { databaseAICompletionContext } from '~/entities/database/utils/monaco'
import { orpc } from '~/lib/orpc'
import { Route } from '../..'

export const dialectsMap = {
  postgres: LanguageIdEnum.PG,
  mysql: LanguageIdEnum.MYSQL,
  mssql: LanguageIdEnum.PG,
  clickhouse: LanguageIdEnum.MYSQL,
} satisfies Record<DatabaseType, LanguageIdEnum>

interface Cache {
  prefix: string
  completion: string
}

export function useRunnerEditorAiTabCompletion(monacoRef:
RefObject<editor.IStandaloneCodeEditor | null>) {
  const { database } = Route.useRouteContext()

  const completionRef = useRef<CompletionRegistration | null>(null)
  const completionCacheRef = useRef<Cache | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingResolveRef = useRef<((value: { completion: string }) => void) | null>(null)
  const aiConfigRef = useRef<Awaited<ReturnType<typeof databaseAICompletionContext>> | null>(null)

  const clearPending = () => {
    if (debounceTimerRef.current)
      clearTimeout(debounceTimerRef.current)
    if (pendingResolveRef.current) {
      pendingResolveRef.current({ completion: '' })
      pendingResolveRef.current = null
    }
  }

  const requestHandler = async () => {
    const model = monacoRef.current?.getModel()
    const position = monacoRef.current?.getPosition()
    const aiConfig = aiConfigRef.current

    if (!model || !position || !aiConfig)
      return { completion: '' }

    if (completionCacheRef.current) {
      const offset = model.getOffsetAt(position)
      const textFull = model.getValue()
      const textBefore = textFull.substring(0, offset)
      const cached = completionCacheRef.current

      if (textBefore.startsWith(cached.prefix)) {
        const addedText = textBefore.slice(cached.prefix.length)

        if (cached.completion.startsWith(addedText)) {
          const remainingCompletion = cached.completion.slice(addedText.length)

          if (remainingCompletion.length > 0) {
            return { completion: remainingCompletion }
          }

          return { completion: '' }
        }
      }
    }

    clearPending()

    return new Promise<{ completion: string }>((resolve) => {
      pendingResolveRef.current = resolve
      debounceTimerRef.current = setTimeout(async () => {
        if (!monacoRef.current) {
          resolve({ completion: '' })
          return
        }

        try {
          const model = monacoRef.current?.getModel()
          const position = monacoRef.current?.getPosition()

          if (!model || !position) {
            resolve({ completion: '' })
            return
          }

          const fileContent = model.getValue()
          const offset = model.getOffsetAt(position)
          const context = fileContent.substring(0, offset)
          const suffix = fileContent.substring(offset)

          if (context.trim().length < 2) {
            resolve({ completion: '' })
            return
          }

          const schemaContext = await aiConfig.buildSchemaContext()

          const transformedBody = {
            context,
            suffix,
            instruction: 'Complete the SQL query with secure and safe optimised version',
            fileContent,
            databaseType: aiConfig.databaseType,
            schemaContext,
          }

          const result = await orpc.ai.codeCompletion(transformedBody)

          if (pendingResolveRef.current === resolve) {
            completionCacheRef.current = {
              prefix: context,
              completion: result.completion,
            }

            resolve(result)
          }
          else {
            resolve({ completion: '' })
          }
        }
        catch (error) {
          console.error(error)
          resolve({ completion: '' })
        }
        finally {
          if (pendingResolveRef.current === resolve)
            pendingResolveRef.current = null
        }
      }, 1000)
    })
  }

  useEffect(() => {
    let isMounted = true

    const setupCompletion = async () => {
      if (!monacoRef.current)
        return

      const config = await databaseAICompletionContext(database)
      if (!isMounted)
        return
      aiConfigRef.current = config

      if (completionRef.current) {
        completionRef.current.deregister()
      }

      completionRef.current = registerCompletion(
        monaco,
        monacoRef.current,
        {
          trigger: 'onTyping',
          language: dialectsMap[database.type],
          requestHandler,
        },
      )
    }

    setupCompletion()

    return () => {
      isMounted = false
      clearPending()
      if (completionRef.current) {
        completionRef.current.deregister()
        completionRef.current = null
      }
    }
  }, [database])
}
