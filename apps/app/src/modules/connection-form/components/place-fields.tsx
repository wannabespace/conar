import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type {
  ConnectionForm,
  ConnectionFormValues,
} from '../lib/connection-form'
import { FileFields } from './file-fields'
import { RemoteSqliteFields } from './remote-sqlite-fields'
import { ServerFields } from './server-fields'

export const PlaceFields = ({
  form,
  locked,
  values,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
  values: Pick<ConnectionFormValues, 'sqliteLocation' | 'type'>
}) => {
  if (values.type !== ConnectionType.SQLite) {
    return <ServerFields form={form} locked={locked} />
  }
  return values.sqliteLocation === 'file' ? (
    <FileFields form={form} locked={locked} />
  ) : (
    <RemoteSqliteFields
      form={form}
      locked={locked}
      sqliteLocation={values.sqliteLocation}
    />
  )
}
