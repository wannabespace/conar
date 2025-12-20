import type { ReactNode } from 'react'
import { escapeSpecialCharacters } from '@conar/shared/utils/helpers'

function DefaultRender({ html }: { html: string }) {
  return (
    // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
    <span dangerouslySetInnerHTML={{ __html: html }} />
  )
}

export function HighlightText({
  text,
  match,
  render = DefaultRender,
}: {
  text: string
  match?: string
  render?: ({ html, matched }: { html: string; matched: boolean }) => ReactNode
}) {
  if (!match) return render({ html: text, matched: false })

  const regex = new RegExp(escapeSpecialCharacters(match), 'gi')

  const html = text.replace(
    regex,
    (match) => `<mark class="text-white bg-primary/50">${match}</mark>`
  )

  return render({ html, matched: regex.test(text) })
}
