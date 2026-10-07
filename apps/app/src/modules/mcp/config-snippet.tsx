import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import { Field, FieldTitle } from '@tamery/ui/components/field'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

export const ConfigSnippet = ({
  code,
  label,
  language,
}: {
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
            />
          }
        />
        <TooltipContent side="bottom">Copy</TooltipContent>
      </Tooltip>
    </div>
    <CodeBlock code={code} language={language} size="xs" variant="field" wrap />
  </Field>
)
