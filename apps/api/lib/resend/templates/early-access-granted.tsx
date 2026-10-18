import { Section, Text } from '@react-email/components'

import { env } from '~/env'

import { Base } from '../components/base'
import { Button } from '../components/button'

export const EarlyAccessGranted = () => (
  <Base preview="Your early access is ready" title="Welcome to Tamery">
    <Section className="mb-5">
      <Text>Thanks for waiting. You can now try Tamery.</Text>
      <Text>
        Sign in with this email in the desktop app or in your browser.
      </Text>
    </Section>
    <Button href={`${env.MAIN_URL}/download`}>Get Tamery</Button>
    <Section className="mt-5">
      <Text>
        We're still polishing Tamery. If something feels off or you have an
        idea, open your avatar menu and choose Support. We read every message.
      </Text>
    </Section>
  </Base>
)
