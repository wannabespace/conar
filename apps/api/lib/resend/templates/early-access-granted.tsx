import { Section, Text } from '@react-email/components'

import { env } from '~/env'

import { Base } from '../components/base'
import { Button } from '../components/button'

export const EarlyAccessGranted = () => (
  <Base preview="Your Tamery account is ready" title="You're in">
    <Section className="mb-5">
      <Text>Thanks for waiting. Your Tamery account is ready.</Text>
      <Text>
        Sign in with this email in the desktop app or in your browser.
      </Text>
    </Section>
    <Button href={`${env.MAIN_URL}/download`}>Get Tamery</Button>
    <Section className="mt-5">
      <Text>
        Tamery is still early, so your feedback shapes what we build next. Tell
        us what works, what breaks and what you miss. Click your avatar in the
        app and pick Support. We read every message.
      </Text>
    </Section>
  </Base>
)
