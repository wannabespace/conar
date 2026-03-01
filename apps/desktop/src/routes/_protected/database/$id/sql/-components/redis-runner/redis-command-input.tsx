import { Popover, PopoverAnchor, PopoverContent } from '@conar/ui/components/popover'
import { Skeleton } from '@conar/ui/components/skeleton'
import { cn } from '@conar/ui/lib/utils'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useCallback, useEffect, useState } from 'react'
import { TEXTAREA_CLS } from './lib/constants'
import { useCommandSuggestions } from './lib/hooks'

export function RedisCommandInput({
  command,
  setCommand,
  onRun,
  keys,
  keysLoading,
}: {
  command: string
  setCommand: (v: string) => void
  onRun: () => void
  keys: string[]
  keysLoading: boolean
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const { suggestions, lastWord, isCommandMode, needsKey, parts } = useCommandSuggestions(command, keys)

  const ghostText = command.trim()
    ? (suggestions[suggestionIndex] ? suggestions[suggestionIndex]!.slice(lastWord.length) : '')
    : ''

  useEffect(() => {
    setSuggestionIndex(i => Math.min(i, Math.max(0, suggestions.length - 1)))
  }, [suggestions.length])

  const insertSuggestion = useCallback((value: string) => {
    if (isCommandMode)
      setCommand(`${value} `)
    else if (needsKey)
      setCommand([...parts.slice(0, -1), value].join(' '))
    setSuggestionIndex(0)
  }, [isCommandMode, needsKey, parts, setCommand])

  const runOrInsert = useCallback(() => {
    if (suggestions[suggestionIndex])
      insertSuggestion(suggestions[suggestionIndex]!)
    else onRun()
  }, [suggestions, suggestionIndex, insertSuggestion, onRun])

  useHotkey('Enter', runOrInsert, { ignoreInputs: false, enabled: isFocused })

  useHotkey('Tab', (e) => {
    if (suggestions[suggestionIndex]) {
      e.preventDefault()
      insertSuggestion(suggestions[suggestionIndex]!)
    }
  }, { ignoreInputs: false, enabled: isFocused && suggestions.length > 0 })

  useHotkey('ArrowDown', (e) => {
    e.preventDefault()
    setSuggestionIndex(i => Math.min(i + 1, suggestions.length - 1))
  }, { ignoreInputs: false, enabled: isFocused && suggestions.length > 0 })

  useHotkey('ArrowUp', (e) => {
    e.preventDefault()
    setSuggestionIndex(i => Math.max(i - 1, 0))
  }, { ignoreInputs: false, enabled: isFocused && suggestions.length > 0 })

  useHotkey('Escape', () => setSuggestionIndex(0), { ignoreInputs: false, enabled: isFocused && suggestions.length > 0 })

  return (
    <Popover open={suggestions.length > 0 && isFocused}>
      <PopoverAnchor asChild>
        <div className="relative flex min-w-0 flex-1">
          {ghostText && (
            <div
              className={cn(TEXTAREA_CLS, 'pointer-events-none absolute inset-0 flex items-center')}
              aria-hidden
            >
              <span className="invisible whitespace-pre">{command}</span>
              <span className="text-muted-foreground/60">{ghostText}</span>
            </div>
          )}
          <textarea
            value={command}
            onChange={e => setCommand(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={1}
            placeholder="GET key | SET key value | DEL key | ..."
            className={cn(TEXTAREA_CLS, ghostText && 'caret-foreground')}
          />
        </div>
      </PopoverAnchor>
      {suggestions.length > 0 && (
        <PopoverContent
          align="start"
          className="max-h-60 w-(--radix-popover-trigger-width) overflow-auto p-1"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          {keysLoading && needsKey
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))
            : suggestions.map((suggestion, i) => (
                <button
                  key={suggestion}
                  type="button"
                  className={cn(
                    'flex cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none',
                    i === suggestionIndex && 'bg-accent/50 text-accent-foreground',
                  )}
                  onClick={() => insertSuggestion(suggestion)}
                  onMouseEnter={() => setSuggestionIndex(i)}
                >
                  <span className="truncate font-mono">{suggestion}</span>
                </button>
              ))}
        </PopoverContent>
      )}
    </Popover>
  )
}
