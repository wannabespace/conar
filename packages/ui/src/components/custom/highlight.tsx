import { escapeSpecialCharacters } from '@tamery/shared/utils/helpers'
import type { ReactNode } from 'react'

const buildHighlightedParts = (
  text: string,
  matchText: string
): ReactNode[] => {
  const regex = new RegExp(escapeSpecialCharacters(matchText), 'giu')
  const parts: ReactNode[] = []
  let lastIndex = 0
  let key = 0

  for (const match of text.matchAll(regex)) {
    const [matchedText] = match
    const start = match.index ?? 0

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start))
    }

    parts.push(
      <mark key={key} className="bg-primary/50 text-white">
        {matchedText}
      </mark>
    )
    key += 1
    lastIndex = start + matchedText.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

export const HighlightText = ({
  text,
  match: matchText,
  render,
}: {
  text: string
  match?: string
  render?: ({ html, matched }: { html: string; matched: boolean }) => ReactNode
}) => {
  if (!matchText) {
    return render ? render({ html: text, matched: false }) : text
  }

  const regex = new RegExp(escapeSpecialCharacters(matchText), 'giu')
  const matched = regex.test(text)
  const html = text.replace(
    regex,
    (matchedSegment) =>
      `<mark class="text-white bg-primary/50">${matchedSegment}</mark>`
  )

  if (render) {
    return render({ html, matched })
  }

  return <span>{buildHighlightedParts(text, matchText)}</span>
}
