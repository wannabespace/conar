export const FetchingReason = ({ reason }: { reason: string }) =>
  reason.split('`').map((part, index) =>
    index % 2 ? (
      <code key={index} className="font-mono">
        {part}
      </code>
    ) : (
      part
    )
  )
