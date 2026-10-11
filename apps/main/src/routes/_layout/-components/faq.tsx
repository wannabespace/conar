import { SOCIAL_LINKS } from '@tamery/shared/constants'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@tamery/ui/components/accordion'

import { Reveal } from '~/components/reveal'
import { SectionHeading } from '~/components/section-heading'

const QUESTIONS = [
  {
    answer:
      'PostgreSQL, MySQL, Microsoft SQL Server and ClickHouse, in the desktop app, the web app and the CLI.',
    question: 'Which databases does Tamery support?',
  },
  {
    answer:
      'Every connection string is encrypted with a key unique to your workspace. Per connection you choose what syncs: the full string, everything but the password, or only its name.',
    question: 'Where are my connection passwords stored?',
  },
  {
    answer:
      'Yes. The desktop app runs a local proxy, so localhost and private-network databases work without setup. In the browser, run tamery proxy from the CLI.',
    question: 'Can I connect to localhost and private databases?',
  },
  {
    answer:
      'Every database feature, unlimited synced connections, 20 AI filters and 100 MCP agent queries a week. Pro is $15 a month or $150 a year and starts with a 7-day free trial.',
    question: 'What does the free plan include?',
  },
  {
    answer:
      'The desktop app runs a local MCP server for Claude Code, Cursor and other clients. Per connection you decide whether agents can read, write, or ask you before every write.',
    question: 'Can AI agents use my databases?',
  },
  {
    answer:
      'Yes, under AGPL-3.0. The code, encryption included, is on GitHub for anyone to audit.',
    question: 'Is Tamery open source?',
  },
]

export const Faq = () => (
  <section
    id="faq"
    aria-labelledby="faq-heading"
    className="mx-auto grid max-w-6xl scroll-mt-24 gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_2fr]"
  >
    <Reveal>
      <SectionHeading id="faq-heading" title="Questions.">
        Anything else? Ask us on{' '}
        <a
          href={SOCIAL_LINKS.DISCORD}
          target="_blank"
          rel="noopener noreferrer"
        >
          Discord
        </a>
        .
      </SectionHeading>
    </Reveal>
    <Reveal>
      <Accordion>
        {QUESTIONS.map(({ answer, question }) => (
          <AccordionItem key={question} value={question}>
            <AccordionTrigger>{question}</AccordionTrigger>
            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Reveal>
  </section>
)
