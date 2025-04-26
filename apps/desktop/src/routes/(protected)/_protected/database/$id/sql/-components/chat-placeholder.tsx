import { RiQuestionAnswerLine } from '@remixicon/react'

export function ChatPlaceholder() {
  return (
    <div className="pointer-events-none absolute z-10 inset-0 flex justify-center items-center px-6 pb-[15vh]">
      <div className="pointer-events-auto text-center text-balance max-w-96">
        <RiQuestionAnswerLine className="mx-auto mb-2 size-8" />
        <p className="text-sm">Ask AI to generate SQL queries</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Try asking for
          {' '}
          <span className="font-mono">SELECT</span>
          {' '}
          queries to fetch data,
          {' '}
          <span className="font-mono">INSERT</span>
          {' '}
          statements to add records,
          {' '}
          <span className="font-mono">UPDATE</span>
          {' '}
          to modify existing data, or complex
          {' '}
          <span className="font-mono">JOIN</span>
          s across multiple tables.
        </p>
      </div>
    </div>
  )
}
