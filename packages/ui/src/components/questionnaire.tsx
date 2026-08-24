import { Questionnaire as QuestionnairePrimitive } from '@shadcn/react/questionnaire'
import { Button } from '@tamery/ui/components/button'
import { cn } from '@tamery/ui/lib/utils'
import type * as React from 'react'

const Questionnaire = ({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Root>) => (
  <QuestionnairePrimitive.Root
    data-slot="questionnaire"
    className={cn('flex min-w-0 flex-col gap-3', className)}
    {...props}
  />
)

const QuestionnaireItem = ({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Item>) => (
  <QuestionnairePrimitive.Item
    data-slot="questionnaire-item"
    className={cn(
      'flex min-w-0 flex-col gap-2 data-[active=false]:hidden',
      className
    )}
    {...props}
  />
)

const QuestionnaireTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Title>) => (
  <QuestionnairePrimitive.Title
    data-slot="questionnaire-title"
    className={cn('text-foreground text-sm font-medium', className)}
    {...props}
  />
)

const QuestionnaireDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Description>) => (
  <QuestionnairePrimitive.Description
    data-slot="questionnaire-description"
    className={cn('text-muted-foreground text-xs', className)}
    {...props}
  />
)

const QuestionnaireChoices = ({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choices>) => (
  <QuestionnairePrimitive.Choices
    data-slot="questionnaire-choices"
    className={cn('flex min-w-0 flex-col gap-1', className)}
    {...props}
  />
)

const QuestionnaireChoice = ({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choice>) => (
  <QuestionnairePrimitive.Choice
    data-slot="questionnaire-choice"
    className={cn(
      `bg-input ring-foreground/4 data-[checked]:bg-primary data-[checked]:text-primary-foreground flex h-8 min-w-0 items-center gap-2 rounded-lg px-2.5 text-sm shadow-xs ring-[0.5px] transition-colors select-none hover:bg-[color-mix(in_oklch,var(--input),var(--foreground)_3%)] data-[checked]:ring-0 data-[disabled]:opacity-50`,
      className
    )}
    {...props}
  />
)

const QuestionnaireChoiceLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.ChoiceLabel>) => (
  <QuestionnairePrimitive.ChoiceLabel
    data-slot="questionnaire-choice-label"
    className={cn('min-w-0 flex-1 truncate', className)}
    {...props}
  />
)

const QuestionnaireChoiceShortcut = ({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.ChoiceShortcut>) => (
  <QuestionnairePrimitive.ChoiceShortcut
    data-slot="questionnaire-choice-shortcut"
    className={cn(
      `text-muted-foreground bg-foreground/5 text-2xs group-data-[checked]:text-primary-foreground/80 rounded-md px-1.5`,
      className
    )}
    {...props}
  />
)

const QuestionnaireError = ({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Error>) => (
  <QuestionnairePrimitive.Error
    data-slot="questionnaire-error"
    className={cn('text-destructive text-xs', className)}
    {...props}
  />
)

const QuestionnaireSubmit = ({
  render,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Submit>) => (
  <QuestionnairePrimitive.Submit
    data-slot="questionnaire-submit"
    render={render ?? <Button size="sm" />}
    {...props}
  />
)

const QuestionnaireSkip = ({
  render,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Skip>) => (
  <QuestionnairePrimitive.Skip
    data-slot="questionnaire-skip"
    render={render ?? <Button size="sm" variant="ghost" />}
    {...props}
  />
)

export {
  Questionnaire,
  QuestionnaireChoice,
  QuestionnaireChoiceLabel,
  QuestionnaireChoiceShortcut,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
}
