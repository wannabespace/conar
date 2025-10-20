import {
  Section,
  Text,
} from '@react-email/components'
import { Base } from '../components/base'
import { Button } from '../components/button'

export function ResetPassword({ name, url }: { name: string, url: string }) {
  return (
    <Base
      preview={`${name}, reset your password`}
      title="Reset your password"
    >
      <Section className="mb-[20px]">
        <Text>
          Hello,
          {' '}
          <strong>{name}</strong>
          !
        </Text>
        <Text>
          We received a request to reset your password. Click the button below to set a new password:
        </Text>
      </Section>
      <Section className="mb-[20px]">
        <Button href={url}>
          Reset Password
        </Button>
      </Section>
      <Section>
        <Text>
          This link will expire in
          {' '}
          <strong>1 hour</strong>
          .
        </Text>
        <Text>
          If you didn't request this password reset, you can just ignore this email.
        </Text>
      </Section>
    </Base>
  )
}
