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
          <Container className="mx-auto max-w-[480px] p-[20px_0_48px]">
            <Section className="mb-[20px]">
              <Img
                src={`${env.WEB_URL}/logo.png`}
                width="48"
                height="48"
                alt="Conar"
              />
              <Heading className="mt-[20px] mb-0 text-[24px] font-bold">{title}</Heading>
            </Section>
            {children}
            <Section>
              <Text className="mt-[40px] text-center text-[12px]">
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
