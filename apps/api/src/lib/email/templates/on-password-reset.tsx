import {
  Section,
  Text,
} from '@react-email/components'
import { Base } from '../components/base'

export function OnPasswordReset({ name, email }: { name: string, email: string }) {
  return (
    <Base
      preview={`${name}, your password has been reset`}
      title="Your Conar password was reset successfully"
    >
      <Section className="mb-[20px]">
        <Text className="mb-[10px]">
          Hello,
          {' '}
          <strong>{name}</strong>
          !
        </Text>
        <Text className="mb-[10px]">
          Your password for your Conar account (
          {email}
          ) has been successfully reset.
        </Text>
        <Text className="mb-[10px]">
          If you did not make this change, please contact our support team immediately.
        </Text>
      </Section>
    </Base>
  )
}
