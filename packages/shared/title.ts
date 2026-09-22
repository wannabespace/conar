export const title = (...parts: (string | null)[]) => {
  const filteredTitle = parts.filter(Boolean)
  return filteredTitle.length > 0
    ? `${filteredTitle.join(' - ')} | Tamery`
    : 'Tamery'
}
