
export const DATABASE_CONNECTION_CONFIG = {
  [DatabaseType.Postgres]: { protocol: 'postgresql', defaultPort: '5432' },
  [DatabaseType.MySQL]: { protocol: 'mysql', defaultPort: '3306' },
  [DatabaseType.MSSQL]: { protocol: 'sqlserver', defaultPort: '1433' },
  [DatabaseType.ClickHouse]: { protocol: 'https', defaultPort: '8123' },
} as const satisfies Record<DatabaseType, { protocol: string, defaultPort: string }>
