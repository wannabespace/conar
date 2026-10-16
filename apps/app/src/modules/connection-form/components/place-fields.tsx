import { FolderOpenIcon } from '@hugeicons/core-free-icons'
import { DEFAULT_PORTS } from '@tamery/connection/connection-parts'
import { isLocalHost } from '@tamery/connection/hosts'
import { getDialect } from '@tamery/shared/enums/connection-type'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import { FieldGroup } from '@tamery/ui/components/field'

import { useLocalProxyAvailable } from '~/core/runtime/proxy'
import { posthog } from '~/lib/posthog'

import type {
  ConnectionForm,
  ConnectionFormValues,
} from '../lib/connection-form'
import { getPlace, PLACES } from '../lib/place'
import { EngineField } from './engine-field'
import { Footnote } from './footnote'
import { TextRow } from './text-row'

export const PlaceFields = ({
  form,
  locked,
  values,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
  values: Pick<ConnectionFormValues, 'host' | 'provider' | 'type'>
}) => {
  const place = getPlace(values)
  const dialect = getDialect(values.type)
  const localProxyAvailable = useLocalProxyAvailable()

  return (
    <>
      <FieldGroup variant="card">
        <EngineField form={form} locked={locked} />
        {PLACES[place].rows.map(
          ({ label, name, placeholder, port, secret }) => (
            <TextRow
              key={name}
              form={form}
              locked={locked}
              label={label}
              name={name}
              placeholder={
                typeof placeholder === 'string'
                  ? placeholder
                  : placeholder?.[dialect]
              }
              secret={secret}
              autoComplete={secret ? 'new-password' : 'off'}
              port={
                port && {
                  label: 'Port',
                  name: 'port',
                  placeholder: String(DEFAULT_PORTS[values.type] ?? 'Optional'),
                }
              }
            >
              {place === 'file' && window.electron && (
                <IconButton
                  variant="ghost-faint"
                  size="icon-sm"
                  icon={FolderOpenIcon}
                  label="Choose file"
                  disabled={locked(name)}
                  onClick={async () => {
                    const path = await window.electron?.sqlite.pickFile()
                    if (path) {
                      posthog.capture('connection_file_picked')
                      form.setFieldValue(name, path)
                    }
                  }}
                />
              )}
            </TextRow>
          )
        )}
      </FieldGroup>
      {isLocalHost(values.host.trim()) &&
        !window.electron &&
        localProxyAvailable && (
          <Footnote>
            Local databases are reached through your tamery proxy.
          </Footnote>
        )}
      {place === 'file' && !window.electron && (
        <Footnote>
          The file opens on the computer running your tamery proxy.
        </Footnote>
      )}
    </>
  )
}
