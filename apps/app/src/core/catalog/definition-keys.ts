// The definitions tab reads these back from the `open` search param, so every
// link to a definition row builds its key here.
export const definitionKey = {
  index: (item: { name: string; table: string }) =>
    JSON.stringify([item.table, item.name]),
  policy: (item: { name: string; table: string }) =>
    JSON.stringify([item.table, item.name]),
  trigger: (item: {
    event: string
    name: string
    schema: string
    table: string
  }) => JSON.stringify([item.schema, item.table, item.name, item.event]),
}
