import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import { Field, FieldTitle } from '@tamery/ui/components/field'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

import { posthog } from '~/lib/posthog'

export const ConfigSnippet = ({
  client,
  code,
  label,
  language,
}: {
  client: 'claude_code' | 'json'
  code: string
  label: string
  language: string
}) => (
  <Field>
    <div className="flex items-center justify-between">
      <FieldTitle>{label}</FieldTitle>
      <Tooltip>
        <TooltipTrigger
          render={
            <CopyButton
              size="icon-xs"
              variant="ghost-muted"
              aria-label="Copy"
              text={code}
              onClick={() => posthog.capture('mcp_config_copied', { client })}
            />
          }
        />
        <TooltipContent side="bottom">Copy</TooltipContent>
      </Tooltip>
    </div>
    <CodeBlock code={code} language={language} size="xs" variant="field" wrap />
  </Field>
)
