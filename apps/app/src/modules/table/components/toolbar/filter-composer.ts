import type { ActiveFilter, Filter } from '@tamery/shared/filters'
import { FILTERS_LIST } from '@tamery/shared/filters'
import type { RefObject } from 'react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { useTablePageStore } from '../../lib/store'

export type FilterTarget = Pick<ActiveFilter, 'column' | 'via'>

export type Stage =
  | { step: 'idle' }
  | { step: 'operator'; target: FilterTarget }
  | { step: 'value'; target: FilterTarget; ref: Filter }

export const operatorMatches = (filter: Filter, text: string) =>
  filter.label.toLowerCase().includes(text) ||
  filter.symbol.toLowerCase().includes(text)

const highlightForStage = (stage: Stage, value: string) => {
  const trimmed = value.trim().toLowerCase()
  if (stage.step === 'operator') {
    const first = FILTERS_LIST.find((filter) =>
      operatorMatches(filter, trimmed)
    )
    return first ? `operator:${first.operator}` : ''
  }
  if (stage.step === 'value') {
    return 'apply-value'
  }
  return trimmed ? `ai:${trimmed}` : ''
}

export type FilterComposer = ReturnType<typeof useFilterComposer>

export const useFilterComposer = ({
  inputRef,
  onQueryChange,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  onQueryChange: () => void
}) => {
  const store = useTablePageStore()
  const filters = useSubscription(store, {
    selector: (state) => state.filters,
  })
  const query = useSubscription(store, { selector: (state) => state.prompt })
  const [stage, setStage] = useState<Stage>({ step: 'idle' })
  const [highlighted, setHighlighted] = useState('')

  const setPrompt = (value: string) =>
    store.set((state) => ({ ...state, prompt: value }) satisfies typeof state)

  const setQuery = (value: string) => {
    setPrompt(value)
    setHighlighted(highlightForStage(stage, value))
    onQueryChange()
  }

  const setFilters = (updater: (filters: ActiveFilter[]) => ActiveFilter[]) =>
    store.set(
      (state) =>
        ({ ...state, filters: updater(state.filters) }) satisfies typeof state
    )

  const focus = () => inputRef.current?.focus()

  const add = (target: FilterTarget, ref: Filter, values: unknown[]) => {
    setFilters((current) => [...current, { ...target, ref, values }])
    setStage({ step: 'idle' })
    setHighlighted('')
    setPrompt('')
    focus()
  }

  const isArrayValue = stage.step === 'value' && stage.ref.isArray
  const parts = isArrayValue ? query.split(',').map((part) => part.trim()) : []
  const committedParts = parts.filter((part) => part !== '')
  const valueFilterText = isArrayValue ? (parts.at(-1) ?? '') : query.trim()

  return {
    applyValue: () => {
      if (stage.step === 'value') {
        add(stage.target, stage.ref, isArrayValue ? committedParts : [query])
      }
    },
    committedParts,
    filters,
    highlighted,
    keyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && query === '') {
        if (stage.step === 'value') {
          setStage({ step: 'operator', target: stage.target })
        } else if (stage.step === 'operator') {
          setStage({ step: 'idle' })
        } else if (filters.length > 0) {
          setFilters((current) => current.slice(0, -1))
        }
        return
      }
      if (e.key !== 'Escape') {
        return
      }
      if (stage.step === 'idle') {
        e.currentTarget.blur()
        return
      }
      e.preventDefault()
      e.stopPropagation()
      setStage({ step: 'idle' })
      setQuery('')
    },
    pickColumn: (target: FilterTarget) => {
      setStage({ step: 'operator', target })
      setPrompt('')
      setHighlighted('operator:eq')
      focus()
    },
    pickOperator: (ref: Filter) => {
      if (stage.step !== 'operator') {
        return
      }
      if (ref.hasValue === false) {
        add(stage.target, ref, [])
        return
      }
      setStage({ ...stage, ref, step: 'value' })
      setHighlighted('apply-value')
      setPrompt('')
      focus()
    },
    pickValue: (value: string) => {
      if (stage.step !== 'value') {
        return
      }
      if (!isArrayValue) {
        add(stage.target, stage.ref, [value])
        return
      }
      const committed = valueFilterText
        ? committedParts.slice(0, -1)
        : committedParts
      setQuery(
        (committed.includes(value)
          ? committed.filter((part) => part !== value)
          : [...committed, value]
        ).join(', ')
      )
      focus()
    },
    query,
    setFilters,
    setHighlighted,
    setQuery,
    stage,
    valueFilterText,
  }
}
