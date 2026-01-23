import {
  Section,
  Text,
} from '@react-email/components'
import { Base } from '../components/base'

export function Alert({ text, service }: { text: string, service: string }) {
  return (
    <Base
      preview={`Alert from ${service}`}
      title={`Alert from ${service}`}
    >
      <Section>
        <Text><pre>{text}</pre></Text>
      </Section>
    </Base>
  )
}
