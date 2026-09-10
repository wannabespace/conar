export const matchesSearch = (
  search: string,
  ...fields: (string | null | undefined)[]
) => {
  const query = search.trim().toLowerCase()

  return (
    query.length === 0 ||
    fields.some((field) => field?.toLowerCase().includes(query))
  )
}
