import { SEO } from '~/constants'
import { seo } from '~/utils/seo'

import { FAQ_QUESTIONS } from './-components/faq-questions'

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_QUESTIONS.map(({ answer, question }) => ({
    '@type': 'Question',
    acceptedAnswer: { '@type': 'Answer', text: answer },
    name: question,
  })),
}

export const homeHead = () => ({
  ...seo({
    title: `Tamery - ${SEO.title}`,
    description: SEO.description,
    image: '/og-image.png',
    path: '/',
  }),
  scripts: [
    {
      children: JSON.stringify(faqStructuredData),
      type: 'application/ld+json',
    },
  ],
})
