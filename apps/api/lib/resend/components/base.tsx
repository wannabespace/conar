import { SOCIAL_LINKS } from '@conar/shared/constants'
import { Body, Container, Head, Heading, Html, Img, Link, pixelBasedPreset, Preview, Section, Tailwind, Text } from '@react-email/components'
import { env } from '~/env'

export function Base({
  children,
  preview,
  title,
}: {
  children: React.ReactNode
  preview: string
  title: string
}) {
  return (
    <Tailwind
      config={{
        presets: [pixelBasedPreset],
        theme: {
          extend: {
            colors: {
              primary: '#4778ea',
            },
          },
        },
      }}
    >
      <Html>
        <Head />
        <Body className="font-sans">
          <Preview>{preview}</Preview>
          <Container className="mx-auto max-w-120 px-0 pt-5 pb-12">
            <Section className="mb-5">
              <Img
                src={`${env.WEB_URL}/logo.png`}
                width="48"
                height="48"
                alt="Conar"
              />
              <Heading className="mt-5 mb-0 text-2xl font-bold">{title}</Heading>
            </Section>
            {children}
            <Section>
              <Text className="mt-10 text-center text-xs">
                <Link className="text-primary" href={SOCIAL_LINKS.TWITTER}>X</Link>
                {' '}
                ・
                {' '}
                <Link className="text-primary" href={SOCIAL_LINKS.DISCORD}>Discord</Link>
                {' '}
                ・
                {' '}
                <Link className="text-primary" href={SOCIAL_LINKS.GITHUB}>GitHub</Link>
                {' '}
                ・
                {' '}
                <Link className="text-primary" href={env.WEB_URL}>Website</Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}
