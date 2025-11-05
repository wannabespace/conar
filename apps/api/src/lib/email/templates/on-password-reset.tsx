import {
  Section,
  Text,
} from '@react-email/components'
import { Base } from '../components/base'

export function OnPasswordReset({ name }: { name: string }) {
  return (
    <Base
      preview={`${name}, your password has been reset`}
      title="Your password was reset successfully"
    >
      <Section>
        <Text>
          Hello,
          {' '}
          <strong>{name}</strong>
          !
        </Text>
        <Text>
          Your password for your account has been successfully reset.
        </Text>
        <Text>
          If you did not make this change, please contact our support team immediately.
        </Text>
      </Section>
    </Base>
  )
}
