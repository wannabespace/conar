import type { Kysely } from 'kysely'

import { userSchemas } from '~/core/queries/shared/oracle-catalog'
import type { Database as OracleDatabase } from '~/core/runtime/dialects/oracle/schema'

import type { ColumnsFilter } from '../shape'

const CHARACTER_TYPES = new Set(['CHAR', 'NCHAR', 'NVARCHAR2', 'VARCHAR2'])

const getDeclaredType = ({
  char_length: charLength,
  char_used: charUsed,
  data_length: dataLength,
  precision,
  scale,
  type: dataType,
}: {
  char_length: number
  char_used: 'B' | 'C' | null
  data_length: number
  precision: number | null
  scale: number | null
  type: string
}) => {
  if (CHARACTER_TYPES.has(dataType)) {
    // NCHAR and NVARCHAR2 always count characters and refuse the CHAR qualifier.
    const semantics =
      charUsed === 'C' && !dataType.startsWith('N') ? ' CHAR' : ''
    return `${dataType}(${charLength}${semantics})`
  }
  if (dataType === 'RAW') {
    return `RAW(${dataLength})`
  }
  if (dataType === 'FLOAT') {
    return `FLOAT(${precision})`
  }
  if (dataType !== 'NUMBER' || scale === null) {
    return dataType
  }
  if (precision === null) {
    return `NUMBER(*,${scale})`
  }
  return scale === 0 ? `NUMBER(${precision})` : `NUMBER(${precision},${scale})`
}

export const oracleColumns = async (
  db: Kysely<OracleDatabase>,
  filter: ColumnsFilter
) => {
  // The dictionary views check privileges per row, so each one is held to the schemas the read covers.
  const owners = filter ? [filter.schema] : userSchemas(db)

  const query = await db
    .selectFrom('ALL_TAB_COLS as c')
    .leftJoin('ALL_COL_COMMENTS as cc', (join) =>
      join
        .onRef('cc.OWNER', '=', 'c.OWNER')
        .onRef('cc.TABLE_NAME', '=', 'c.TABLE_NAME')
        .onRef('cc.COLUMN_NAME', '=', 'c.COLUMN_NAME')
        .on('cc.OWNER', 'in', owners)
    )
    .leftJoin('ALL_TAB_IDENTITY_COLS as ic', (join) =>
      join
        .onRef('ic.OWNER', '=', 'c.OWNER')
        .onRef('ic.TABLE_NAME', '=', 'c.TABLE_NAME')
        .onRef('ic.COLUMN_NAME', '=', 'c.COLUMN_NAME')
        .on('ic.OWNER', 'in', owners)
    )
    .select([
      'c.OWNER as schema',
      'c.TABLE_NAME as table',
      'c.COLUMN_NAME as id',
      'c.DATA_DEFAULT as data_default',
      'c.DATA_TYPE as type',
      'c.DATA_LENGTH as data_length',
      'c.DATA_PRECISION as precision',
      'c.DATA_SCALE as scale',
      'c.CHAR_LENGTH as char_length',
      'c.CHAR_USED as char_used',
      'c.NULLABLE as nullable',
      'c.IDENTITY_COLUMN as identity_column',
      'c.VIRTUAL_COLUMN as virtual_column',
      'ic.GENERATION_TYPE as generation_type',
      'cc.COMMENTS as comment',
    ])
    .where('c.HIDDEN_COLUMN', '=', 'NO')
    .where('c.OWNER', 'in', owners)
    .$call((qb) => (filter ? qb.where('c.TABLE_NAME', '=', filter.table) : qb))
    .orderBy('c.OWNER')
    .orderBy('c.TABLE_NAME')
    .orderBy('c.COLUMN_ID')
    .execute()

  return query.map(
    ({
      data_default: dataDefault,
      generation_type: generationType,
      identity_column: identityColumn,
      nullable,
      virtual_column: virtualColumn,
      ...column
    }) => {
      const isIdentity = identityColumn === 'YES'
      const isVirtual = virtualColumn === 'YES'
      // DATA_DEFAULT is the text after DEFAULT as typed, trailing whitespace included, and a dropped default reads NULL.
      const defaultText = dataDefault?.trim() ?? null
      return {
        ...column,
        declaredType: getDeclaredType(column),
        default:
          isIdentity || isVirtual || defaultText?.toUpperCase() === 'NULL'
            ? null
            : defaultText,
        editable: !isVirtual && generationType !== 'ALWAYS',
        isGenerated: isIdentity || isVirtual,
        isIdentity,
        maxLength: CHARACTER_TYPES.has(column.type) ? column.char_length : null,
        nullable: nullable === 'Y',
      }
    }
  )
}
