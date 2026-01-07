import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { editor } from 'monaco-editor'
import type { CompletionRegistration } from 'monacopilot'
import type { RefObject } from 'react'
import * as monaco from 'monaco-editor'
import { LanguageIdEnum } from 'monaco-sql-languages'
import { registerCompletion } from 'monacopilot'
import { useCallback, useEffect, useRef } from 'react'
import { databaseAICompletionContext } from '~/entities/database/utils/monaco'
import { orpc } from '~/lib/orpc'
import { Route } from '../..'

const dialectsMap = {
  postgres: LanguageIdEnum.PG,
  mysql: LanguageIdEnum.MYSQL,
  mssql: LanguageIdEnum.PG,
  clickhouse: LanguageIdEnum.MYSQL,
} satisfies Record<DatabaseType, LanguageIdEnum>

interface Cache {
  before: string
  completion: string
}

function getCache(
  model: editor.ITextModel,
  position: monaco.Position,
  cache: Cache | null,
): { completion: string } | null {
  if (!cache)
    return null

  const offset = model.getOffsetAt(position)
  const textBefore = model.getValue().substring(0, offset)

  if (!textBefore.startsWith(cache.before))
    return null

  const addedText = textBefore.slice(cache.before.length)

  if (!cache.completion.startsWith(addedText))
    return null

  const remainingCompletion = cache.completion.slice(addedText.length)
  return { completion: remainingCompletion }
}

async function fetchCompletion(
  model: editor.ITextModel,
  position: monaco.Position,
  aiConfig: Awaited<ReturnType<typeof databaseAICompletionContext>>,
  signal: AbortSignal,
): Promise<{ result: { completion: string }, context: string } | null> {
  const offset = model.getOffsetAt(position)
  const context = model.getValue().substring(0, offset)
  const suffix = model.getValue().substring(offset)

  if (context.trim().length < 2)
    return null

  const schemaContext = await aiConfig.buildSchemaContext()
  const result = await orpc.ai.codeCompletion({
    context,
    suffix,
    instruction: 'Complete the SQL query with secure and safe optimised version',
    fileContent: model.getValue(),
    databaseType: aiConfig.databaseType,
    schemaContext,
  }, { signal })

  return { result, context }
}

export function useRunnerEditorAiTabCompletion(monacoRef: RefObject<editor.IStandaloneCodeEditor | null>) {
  const { database } = Route.useRouteContext()

  const completionRef = useRef<CompletionRegistration | null>(null)
  const completionCacheRef = useRef<Cache | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingResolveRef = useRef<((value: { completion: string }) => void) | null>(null)
  const aiConfigRef = useRef<Awaited<ReturnType<typeof databaseAICompletionContext>> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const clearPending = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (pendingResolveRef.current) {
      pendingResolveRef.current({ completion: '' })
      pendingResolveRef.current = null
    }
  }, [])

  const requestHandler = useCallback(async () => {
    const model = monacoRef.current?.getModel()
    const position = monacoRef.current?.getPosition()
    const aiConfig = aiConfigRef.current

    if (!model || !position || !aiConfig)
      return { completion: '' }

    const cachedResult = getCache(model, position, completionCacheRef.current)
    if (cachedResult)
      return cachedResult

    if (completionCacheRef.current)
      completionCacheRef.current = null

    clearPending()

    return new Promise<{ completion: string }>((resolve) => {
      pendingResolveRef.current = resolve
      debounceTimerRef.current = setTimeout(async () => {
        if (pendingResolveRef.current !== resolve) {
          resolve({ completion: '' })
          return
        }

        const model = monacoRef.current?.getModel()
        const position = monacoRef.current?.getPosition()

        if (!model || !position || !aiConfigRef.current) {
          resolve({ completion: '' })
          return
        }

        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
          const fetchResult = await fetchCompletion(
            model,
            position,
            aiConfigRef.current,
            controller.signal,
          )

          if (!fetchResult) {
            resolve({ completion: '' })
            return
          }

          completionCacheRef.current = {
            before: fetchResult.context,
            completion: fetchResult.result.completion,
          }

          if (pendingResolveRef.current === resolve) {
            resolve({ completion: fetchResult.result.completion })
            pendingResolveRef.current = null
          }
          else {
            resolve({ completion: '' })
          }
        }
        catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            resolve({ completion: '' })
            return
          }
          console.error('AI completion error:', error)
          resolve({ completion: '' })
        }
        finally {
          if (pendingResolveRef.current === resolve)
            pendingResolveRef.current = null
        }
      }, 600)
    })
  }, [clearPending, monacoRef])

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

      // Monkey patch to fix 'disposeInlineCompletions is not a function' error from monacopilot
      const originalRegister = monaco.languages.registerInlineCompletionsProvider
      // @ts-expect-error - patching internal api
      if (!originalRegister.__patched) {
        monaco.languages.registerInlineCompletionsProvider = (languageSelector, provider) => {
          if (!provider.disposeInlineCompletions) {
            // eslint-disable-next-line ts/ban-ts-comment
            // @ts-ignore
            provider.disposeInlineCompletions = () => {}
          }
          return originalRegister.call(monaco.languages, languageSelector, provider)
        }
        // @ts-expect-error - patching internal api
        monaco.languages.registerInlineCompletionsProvider.__patched = true
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
  }, [clearPending, database, monacoRef, requestHandler])
}
