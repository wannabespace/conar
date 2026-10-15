export enum ConnectionType {
  Postgres = 'postgres',
  MySQL = 'mysql',
  MSSQL = 'mssql',
  ClickHouse = 'clickhouse',
}

/** Only names and badges a connection: every query runs on the `ConnectionType` it speaks through, so never gate SQL on it. */
export enum ConnectionFlavor {
  MariaDB = 'mariadb',
}

export type Engine = ConnectionType | ConnectionFlavor

const TYPE_OF_FLAVOR: Record<ConnectionFlavor, ConnectionType> = {
  [ConnectionFlavor.MariaDB]: ConnectionType.MySQL,
}

const ALL: Engine[] = Object.values(ConnectionType).flatMap((type) => [
  type,
  ...Object.values(ConnectionFlavor).filter(
    (flavor) => TYPE_OF_FLAVOR[flavor] === type
  ),
])

const isFlavor = (engine: Engine): engine is ConnectionFlavor =>
  Object.hasOwn(TYPE_OF_FLAVOR, engine)

export const engines = {
  all: ALL,
  flavor: (engine: Engine) => (isFlavor(engine) ? engine : null),
  of: ({
    flavor,
    type,
  }: {
    flavor: ConnectionFlavor | null
    type: ConnectionType
  }): Engine => flavor ?? type,
  type: (engine: Engine) =>
    isFlavor(engine) ? TYPE_OF_FLAVOR[engine] : engine,
}

export const engineLabels: Record<Engine, string> = {
  [ConnectionFlavor.MariaDB]: 'MariaDB',
  [ConnectionType.ClickHouse]: 'ClickHouse',
  [ConnectionType.MSSQL]: 'Microsoft SQL Server',
  [ConnectionType.MySQL]: 'MySQL',
  [ConnectionType.Postgres]: 'PostgreSQL',
}
