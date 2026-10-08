export type ElectronMcp = NonNullable<Window['electron']>['mcp']

export const statusQueryKey = ['mcp', 'status']

export const clientsQueryKey = ['mcp', 'clients']
