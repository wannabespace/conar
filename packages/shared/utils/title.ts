export function title(...title: (string | null)[]) {
  const filteredTitle = title.filter(Boolean)
  return filteredTitle.length > 0 ? `${filteredTitle.join(' - ')} | Conar` : 'Conar'
}
