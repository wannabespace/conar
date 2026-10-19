import { Section, Text } from '@react-email/components'

import { Base } from '../components/base'

export const ContactReceived = ({ name }: { name: string }) => (
  <Base preview="We've received your message" title="Thanks for reaching out">
    <Section>
      <Text>Hi {name},</Text>
      <Text>
        We&apos;ve received your message and will get back to you soon.
      </Text>
    </Section>
  </Base>
)
