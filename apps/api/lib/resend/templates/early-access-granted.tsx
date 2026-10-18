import { Section, Text } from '@react-email/components'

import { env } from '~/env'

import { Base } from '../components/base'
import { Button } from '../components/button'

export const EarlyAccessGranted = () => (
  <Base
    preview="Your early access is ready. Come take a look!"
    title="Welcome to Tamery!"
  >
    <Section className="mb-5">
      <Text>Thanks for waiting — we're happy to have you here!</Text>
      <Text>
        Your early access is ready. Download the app or open Tamery in your
        browser, then sign in with this email.
      </Text>
    </Section>
    <Button href={`${env.MAIN_URL}/download`}>Try Tamery</Button>
    <Section className="mt-5">
      <Text>
        We're still polishing things, and we'd love to hear what you think. If
        you spot a bug or have an idea, open your avatar menu and choose
        Support. We read every message.
      </Text>
    </Section>
  </Base>
)
