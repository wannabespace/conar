export function RedisValueViewer({ type, value }: { type: string, value: unknown }) {
  if (value == null)
    return null

  if (type === 'string') {
    return (
      <pre className="overflow-auto rounded-sm bg-muted/50 p-2 font-mono text-xs">
        {String(value)}
      </pre>
    )
  }

  if (type === 'hash') {
    const entries = Array.isArray(value) ? value : []
    return (
      <div className="space-y-1">
        {Array.from({ length: entries.length / 2 }, (_, i) => (
          <div
            key={i}
            className="flex gap-2 font-mono text-xs"
          >
            <span className="shrink-0 text-muted-foreground">
              {entries[i * 2]}
              :
            </span>
            <span className="min-w-0 truncate">{String(entries[i * 2 + 1])}</span>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'list' || type === 'set') {
    const items = Array.isArray(value) ? value : [value]
    return (
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="font-mono text-xs">{String(item)}</div>
        ))}
      </div>
    )
  }

  if (type === 'zset') {
    const elements = Array.isArray(value) ? value : []
    return (
      <div className="space-y-1">
        {Array.from({ length: elements.length / 2 }, (_, i) => (
          <div
            key={i}
            className="flex gap-2 font-mono text-xs"
          >
            <span className="shrink-0 text-muted-foreground">{elements[i * 2 + 1]}</span>
            <span className="min-w-0 truncate">{String(elements[i * 2])}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <pre className="overflow-auto rounded-sm bg-muted/50 p-2 font-mono text-xs">
      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
    </pre>
  )
}
