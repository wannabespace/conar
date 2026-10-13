import {
  DEFAULT_SSH_PORT,
  SSH_AUTH_METHODS,
} from '@tamery/connection/ssh/params'
import type { SshAuth } from '@tamery/connection/ssh/params'
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import { FieldGroup } from '@tamery/ui/components/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { Switch } from '@tamery/ui/components/switch'
import { useStore } from '@tanstack/react-form'
import { AnimatePresence } from 'motion/react'

import type { ConnectionForm } from '../-lib/connection-form'
import { Footnote } from './footnote'
import { SshCredentialFields } from './ssh-credential-fields'

const AUTH_LABELS: Record<SshAuth, string> = {
  agent: 'ssh-agent',
  key: 'Private key',
  keyPath: 'Key file',
  password: 'Password',
}

export const SshFields = ({ form }: { form: ConnectionForm }) => {
  const enabled = useStore(form.store, (state) => state.values.sshEnabled)
  const auth = useStore(form.store, (state) => state.values.ssh.auth)
  const showsAgentNote = enabled && auth === 'agent' && window.electron

  return (
    <>
      <FieldGroup variant="card">
        <form.AppField name="sshEnabled">
          {(field) => (
            <field.Field orientation="row">
              <field.Label>SSH tunnel</field.Label>
              <Switch
                id={field.name}
                size="sm"
                className="ml-auto"
                checked={field.state.value}
                onCheckedChange={field.handleChange}
              />
            </field.Field>
          )}
        </form.AppField>
        <AnimatePresence initial={false}>
          {enabled && (
            <MotionCollapse key="ssh">
              <form.AppField name="ssh.host">
                {(field) => (
                  <field.Field orientation="row">
                    <field.Label>Host</field.Label>
                    <field.Input
                      variant="inset"
                      data-mask
                      spellCheck={false}
                      autoComplete="off"
                      placeholder="bastion.example.com"
                    />
                    <span className="text-muted-foreground">:</span>
                    <form.AppField name="ssh.port">
                      {(portField) => (
                        <div className="w-20 shrink-0">
                          <portField.Input
                            variant="inset"
                            aria-label="SSH port"
                            data-mask
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder={String(DEFAULT_SSH_PORT)}
                          />
                        </div>
                      )}
                    </form.AppField>
                  </field.Field>
                )}
              </form.AppField>
              <form.AppField name="ssh.user">
                {(field) => (
                  <field.Field orientation="row">
                    <field.Label>User</field.Label>
                    <field.Input
                      variant="inset"
                      data-mask
                      spellCheck={false}
                      autoComplete="off"
                      placeholder="From ~/.ssh/config"
                    />
                  </field.Field>
                )}
              </form.AppField>
              <form.AppField name="ssh.auth">
                {(field) => (
                  <field.Field orientation="row">
                    <field.Label>Sign in</field.Label>
                    <Select
                      items={SSH_AUTH_METHODS.map((method) => ({
                        label: AUTH_LABELS[method],
                        value: method,
                      }))}
                      value={field.state.value}
                      onValueChange={(next) => next && field.handleChange(next)}
                    >
                      <SelectTrigger
                        id={field.name}
                        variant="flat"
                        className="flex-1"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SSH_AUTH_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {AUTH_LABELS[method]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </field.Field>
                )}
              </form.AppField>
              <SshCredentialFields form={form} auth={auth} />
            </MotionCollapse>
          )}
        </AnimatePresence>
      </FieldGroup>
      {showsAgentNote && (
        <Footnote>
          Signs in with your running ssh-agent and the matching Host in
          ~/.ssh/config.
        </Footnote>
      )}
    </>
  )
}
