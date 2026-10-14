import {
  DEFAULT_SSH_PORT,
  SSH_AUTH_METHODS,
} from '@tamery/connection/ssh/params'
import type { SshAuth } from '@tamery/connection/ssh/params'
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import { FieldGroup } from '@tamery/ui/components/field'
import { Switch } from '@tamery/ui/components/switch'
import { useSelector } from '@tanstack/react-form'
import { AnimatePresence } from 'motion/react'

import type { ConnectionForm } from '../lib/connection-form'
import { Footnote } from './footnote'
import { SshCredentialFields } from './ssh-credential-fields'
import { TextRow } from './text-row'

const AUTH_LABELS: Record<SshAuth, string> = {
  agent: 'ssh-agent',
  key: 'Private key',
  keyPath: 'Key file',
  password: 'Password',
}

const AUTH_METHODS = SSH_AUTH_METHODS.map((method) => ({
  label: AUTH_LABELS[method],
  value: method,
}))

export const SshFields = ({
  form,
  locked,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
}) => {
  const enabled = useSelector(form.store, (state) => state.values.sshEnabled)
  const auth = useSelector(form.store, (state) => state.values.ssh.auth)
  const row = { form, locked }

  return (
    <>
      <FieldGroup variant="card">
        <form.AppField name="sshEnabled">
          {(field) => (
            <field.Field orientation="row" className="relative">
              <field.Label>SSH tunnel</field.Label>
              <Switch
                id={field.name}
                size="sm"
                className="static ml-auto after:inset-0"
                checked={field.state.value}
                disabled={locked(field.name)}
                onCheckedChange={field.handleChange}
              />
            </field.Field>
          )}
        </form.AppField>
        <AnimatePresence initial={false}>
          {enabled && (
            <MotionCollapse key="ssh">
              <TextRow
                {...row}
                label="Host"
                name="ssh.host"
                placeholder="bastion.example.com"
                port={{
                  label: 'SSH port',
                  name: 'ssh.port',
                  placeholder: String(DEFAULT_SSH_PORT),
                }}
              />
              <TextRow
                {...row}
                label="User"
                name="ssh.user"
                placeholder="From ~/.ssh/config"
              />
              <form.AppField name="ssh.auth">
                {(field) => (
                  <field.Field orientation="row">
                    <field.Label>Sign in</field.Label>
                    <field.Select
                      items={AUTH_METHODS}
                      disabled={locked(field.name)}
                      variant="flat"
                    />
                  </field.Field>
                )}
              </form.AppField>
              <SshCredentialFields form={form} auth={auth} locked={locked} />
            </MotionCollapse>
          )}
        </AnimatePresence>
      </FieldGroup>
      {enabled && auth === 'agent' && window.electron && (
        <Footnote>
          Signs in with your running ssh-agent and the matching Host in
          ~/.ssh/config.
        </Footnote>
      )}
    </>
  )
}
