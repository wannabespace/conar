import { Section, Text } from '@react-email/components'

import { Base } from '../components/base'

export const Alert = ({ text, service }: { text: string; service: string }) => (
  <Base preview={`Alert from ${service}`} title={`Alert from ${service}`}>
    <Section>
      <Text>
        <pre>{text}</pre>
      </Text>
    </Section>
  </Base>
)
