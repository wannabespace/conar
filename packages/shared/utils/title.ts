export function title(...title: string[]) {
  return title.length > 0 ? `${title.join(' - ')} | Connnect` : 'Connnect'
}
