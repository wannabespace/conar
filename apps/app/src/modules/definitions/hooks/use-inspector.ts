import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useEffectEvent, useState } from 'react'

const { useNavigate, useSearch } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

const LINKED_OPEN_DELAY = 80

export const useInspector = <T>({
  items,
  keepSchema,
  keyOf,
  loading,
}: {
  items: T[]
  keepSchema: (schema: string | undefined) => void
  keyOf: (item: T) => string
  loading: boolean
}) => {
  const navigate = useNavigate()
  const linkedKey = useSearch({ select: (current) => current.open })
  const linkedSchema = useSearch({ select: (current) => current.schema })
  const linkedPreset = useSearch({ select: (current) => current.create })
  const [inspected, setInspected] = useState<{
    item: T | null
    open: boolean
    preset?: string
    session: number
  }>({ item: null, open: false, session: 0 })
  const linkedItem = linkedKey
    ? items.find((item) => keyOf(item) === linkedKey)
    : undefined
  const open = (item: T | null, preset?: string) =>
    setInspected((current) => ({
      item,
      open: true,
      preset,
      session: current.session + 1,
    }))

  const openLinked = useEffectEvent(() => {
    if (linkedItem) {
      open(linkedItem)
    } else if (linkedPreset) {
      open(null, linkedPreset)
    }
    keepSchema(linkedSchema)
    navigate({
      replace: true,
      search: (current) => ({
        ...current,
        create: undefined,
        open: undefined,
        schema: undefined,
      }),
    })
  })

  const linked = !!(linkedKey || linkedPreset)

  useEffect(() => {
    if (!linked || loading) {
      return
    }
    const timeout = setTimeout(openLinked, LINKED_OPEN_DELAY)

    return () => clearTimeout(timeout)
  }, [linked, loading])

  // A toggle inside the drawer refetches the list, so the live row outranks
  // the snapshot the drawer opened on.
  const snapshot = inspected.item
  const liveItem =
    snapshot &&
    (items.find((item) => keyOf(item) === keyOf(snapshot)) ?? snapshot)

  return {
    close: () => setInspected((current) => ({ ...current, open: false })),
    inspected,
    item: liveItem,
    open,
  }
}
