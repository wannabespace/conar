export interface DatabaseQueryResult {
  count: number
  columns: {
    id: string
  }[]
  rows: Record<string, unknown>[]
}
