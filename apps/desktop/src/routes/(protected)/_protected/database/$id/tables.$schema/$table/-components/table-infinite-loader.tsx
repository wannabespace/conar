import { useInViewport } from '@conar/ui/hookas/use-in-viewport'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { RiLoaderLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useEffect, useRef } from 'react'
import { useTableContext } from '~/components/table'
import { usePageContext } from '..'
import { useRowsQueryOpts } from '../-queries/use-rows-query-opts'
import { TableEmpty } from './table-empty'

export function TableInfiniteLoader() {
  const rowsQueryOpts = useRowsQueryOpts()
  const { fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery(rowsQueryOpts)
  const loaderRef = useRef<HTMLDivElement>(null)
  const isVisible = useInViewport(loaderRef)
  const { store } = usePageContext()
  const [filters, orderBy] = useStore(store, state => [state.filters, state.orderBy])

  useEffect(() => {
    if (isVisible && hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }, [isVisible])

  const scrollRef = useTableContext(state => state.scrollRef)
  useMountedEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filters, orderBy])

  return (
    <div className="sticky left-0 h-[50vh] pointer-events-none">
      <div ref={loaderRef} className="absolute h-[calc(50vh+50rem)] bottom-0 inset-x-0" />
      <div className="flex items-center justify-center h-[inherit]">
        {hasNextPage
          ? <RiLoaderLine className="size-10 animate-spin opacity-50" />
          : <TableEmpty className="bottom-0 h-full" title="No more data" description="This table has no more rows" />}
      </div>
    </div>
  )
}
