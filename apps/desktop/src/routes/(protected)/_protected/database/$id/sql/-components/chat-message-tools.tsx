import type { ToolUI } from '@conar/shared/ai'
import type { ToolUIPart } from 'ai'
import { Monaco } from '~/components/monaco'

export function ChatMessageTool({ part }: { part: ToolUIPart }) {
  const tool = part as ToolUIPart<ToolUI>

  if (tool.type === 'tool-columns') {
    return (
      <div>
        <p>
          State:
          {JSON.stringify(tool.state)}
        </p>
        {tool.state === 'output-available' && (
          <Monaco
            value={JSON.stringify(tool.output)}
            language="json"
          />
        )}
      </div>
    )
  }

  if (tool.type === 'tool-enums') {
    return (
      <div>
        <p>
          State:
          {JSON.stringify(tool.state)}
        </p>
        {tool.state === 'output-available' && (
          <Monaco
            value={JSON.stringify(tool.output)}
            language="json"
            options={{
              readOnly: true,
              scrollBeyondLastLine: false,
            }}
            className="h-[200px]"
          />
        )}
      </div>
    )
  }

  return (
    <div>
      <p>
        Unknown tool:
        {part.type.replace('tool-', '')}
      </p>
    </div>
  )
}
