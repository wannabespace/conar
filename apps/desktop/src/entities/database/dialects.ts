import { DummyDriver, MysqlDialect, PostgresDialect } from 'kysely'

// Based on https://kysely.dev/docs/runtimes/browser

export class DummyPostgresDialect extends PostgresDialect {
  constructor() {
    // eslint-disable-next-line ts/no-explicit-any
    super({} as any)
  }

  createDriver() {
    return new DummyDriver()
  }
}

export class DummyMysqlDialect extends MysqlDialect {
  constructor() {
    // eslint-disable-next-line ts/no-explicit-any
    super({} as any)
  }

  createDriver() {
    return new DummyDriver()
  }
}
