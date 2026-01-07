import {
  Section,
  Text,
} from '@react-email/components'
import { Base } from '../components/base'

export function Alert({ json }: { json: Record<string, unknown> }) {
  return (
    <Base
      preview="Alert from Railway"
      title="Alert from Railway"
    >
      <Section className="mb-[20px]">
        We received an alert from Railway.
      </Section>
      <Section>
        <Text>
          {JSON.stringify(json, null, 2)}
        </Text>
      </Section>
    </Base>
  )
}
