import { createLazyFileRoute } from '@tanstack/react-router'

import { AccountPage } from '~/components/account-page'

import { DeleteAccountSettings } from '../../../components/delete-account'
import { SecuritySettings } from '../../../components/security'
import { SessionsSettings } from '../../../components/sessions'

const SettingsPage = () => (
  <AccountPage title="Settings">
    <SecuritySettings />
    <SessionsSettings />
    <DeleteAccountSettings />
  </AccountPage>
)

export const Route = createLazyFileRoute('/account/settings/')({
  component: SettingsPage,
})
