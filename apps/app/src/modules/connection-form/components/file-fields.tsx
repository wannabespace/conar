import { FolderOpenIcon } from '@hugeicons/core-free-icons'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import { FieldGroup } from '@tamery/ui/components/field'

import { posthog } from '~/lib/posthog'

import type { ConnectionForm } from '../lib/connection-form'
import { EngineField } from './engine-field'
import { Footnote } from './footnote'
import { TextRow } from './text-row'

export const FileFields = ({
  form,
  locked,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
}) => (
  <>
    <FieldGroup variant="card">
      <EngineField form={form} locked={locked} />
      <TextRow
        form={form}
        locked={locked}
        label="File"
        name="database"
        placeholder="/path/to/app.db"
      >
        {window.electron && (
          <IconButton
            variant="ghost-faint"
            size="icon-sm"
            icon={FolderOpenIcon}
            label="Choose file"
            disabled={locked('database')}
            onClick={async () => {
              const path = await window.electron?.sqlite.pickFile()
              if (path) {
                posthog.capture('connection_file_picked')
                form.setFieldValue('database', path)
              }
            }}
          />
        )}
      </TextRow>
    </FieldGroup>
    {!window.electron && (
      <Footnote>
        The file opens on the computer running your tamery proxy.
      </Footnote>
    )}
  </>
)
