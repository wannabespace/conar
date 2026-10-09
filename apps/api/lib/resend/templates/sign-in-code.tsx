import { Section, Text } from '@react-email/components'

import { Base } from '../components/base'

export const SignInCode = ({ code }: { code: string }) => (
  <Base preview={`${code} is your Tamery code`} title="Your Tamery code">
    <Section className="mb-5">
      <Text>Enter this code to continue:</Text>
      <Text className="text-3xl font-bold tracking-widest">{code}</Text>
    </Section>
    <Section>
      <Text>
        This code will expire in <strong>5 minutes</strong>.
      </Text>
      <Text>
        If you didn&apos;t request this code, you can just ignore this email.
      </Text>
    </Section>
  </Base>
)
