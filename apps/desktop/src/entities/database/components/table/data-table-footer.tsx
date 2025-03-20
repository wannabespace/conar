import { Label } from '@connnect/ui/components/label'
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationItem,
} from '@connnect/ui/components/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@connnect/ui/components/select'
import { RiArrowLeftSLine, RiArrowRightSLine, RiSkipLeftLine, RiSkipRightLine } from '@remixicon/react'
import { useId, useMemo } from 'react'

export type PageSize = 50 | 100 | 250 | 500 | 1000

interface DataTableFooterProps {
  currentPage: number
  onPageChange: (page: number) => void
  pageSize: PageSize
  onPageSizeChange: (pageSize: PageSize) => void
  total: number
  loading: boolean
}

export function DataTableFooter({
  currentPage,
  onPageChange,
  pageSize,
  onPageSizeChange,
  total,
  loading,
}: DataTableFooterProps) {
  const id = useId()

  const paginationInfo = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, total)
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    return { start, end, totalPages }
  }, [currentPage, pageSize, total])

  return (
    <div className="flex items-center justify-between gap-8">
      {/* Results per page */}
      <div className="flex items-center gap-3">
        <Label className="mb-0" htmlFor={id}>Rows per page</Label>
        <Select
          defaultValue={String(pageSize)}
          onValueChange={value => onPageSizeChange(Number(value) as PageSize)}
        >
          <SelectTrigger id={id} className="w-fit whitespace-nowrap">
            <SelectValue placeholder="Select number of results" />
          </SelectTrigger>
          <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="250">250</SelectItem>
            <SelectItem value="500">500</SelectItem>
            <SelectItem value="1000">1000</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Page number information */}
      <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
        <p className="text-muted-foreground text-sm whitespace-nowrap" aria-live="polite">
          {loading
            ? (
                <span className="text-foreground">Loading...</span>
              )
            : total > 0
              ? (
                  <>
                    <span className="text-foreground">
                      {paginationInfo.start}
                      -
                      {paginationInfo.end}
                    </span>
                    {' '}
                    of
                    {' '}
                    <span className="text-foreground">{total}</span>
                  </>
                )
              : (
                  <span className="text-foreground">No results</span>
                )}
        </p>
      </div>

      {/* Pagination */}
      <div>
        <Pagination>
          <PaginationContent>
            {/* First page button */}
            <PaginationItem>
              <PaginationButton
                onClick={() => onPageChange(1)}
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                aria-label="Go to first page"
                aria-disabled={currentPage === 1}
                disabled={currentPage === 1}
              >
                <RiSkipLeftLine size={16} aria-hidden="true" />
              </PaginationButton>
            </PaginationItem>

            {/* Previous page button */}
            <PaginationItem>
              <PaginationButton
                onClick={() => onPageChange(currentPage - 1)}
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                aria-label="Go to previous page"
                aria-disabled={currentPage === 1}
                disabled={currentPage === 1}
              >
                <RiArrowLeftSLine size={16} aria-hidden="true" />
              </PaginationButton>
            </PaginationItem>

            {/* Next page button */}
            <PaginationItem>
              <PaginationButton
                onClick={() => onPageChange(currentPage + 1)}
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                aria-label="Go to next page"
                aria-disabled={currentPage === paginationInfo.totalPages}
                disabled={currentPage === paginationInfo.totalPages}
              >
                <RiArrowRightSLine size={16} aria-hidden="true" />
              </PaginationButton>
            </PaginationItem>

            {/* Last page button */}
            <PaginationItem>
              <PaginationButton
                onClick={() => onPageChange(paginationInfo.totalPages)}
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                aria-label="Go to last page"
                aria-disabled={currentPage === paginationInfo.totalPages}
                disabled={currentPage === paginationInfo.totalPages}
              >
                <RiSkipRightLine size={16} aria-hidden="true" />
              </PaginationButton>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
