export enum ConnectionType {
  Postgres = 'postgres',
}

export const connectionLabels: Record<ConnectionType, string> = {
  [ConnectionType.Postgres]: 'PostgreSQL',
}
