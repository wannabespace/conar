import { MysqlQueryCompiler } from 'kysely'

// ClickHouse reads `\` as an escape inside a backquoted name, so a name ending in one would swallow the closing quote.
export class ClickhouseQueryCompiler extends MysqlQueryCompiler {
  protected override sanitizeIdentifier(identifier: string) {
    return super.sanitizeIdentifier(identifier.replaceAll('\\', '\\\\'))
  }
}
