import { SQL_FILTERS_GROUPED, SQL_FILTERS_LIST } from '@tamery/shared/filters'
import { generateObject } from 'ai'
import { type } from 'arktype'

import { models } from './models'

const filtersInstructions = (tableContext: string) =>
  [
    'You are a filters and ordering generator that converts natural language queries into database filters and ordering instructions.',
    'You should understand the sense of the prompt as much as possible.',
    'Each of your filters or ordering responses will replace the previous ones.',
    '',
    'Guidelines:',
    '- Create multiple filters when the query has multiple conditions',
    '- Use exact column names as provided in the context',
    '- Choose the most appropriate operator for each condition',
    '- Format values correctly based on column types (strings, numbers, dates, etc.)',
    '- For enum columns, ensure values match the available options',
    '- For exact days use >= and <= operators',
    "- If user asks 'empty' and the column is a string, use empty string as item in values array",
    '- If context already contains a filter, you can use it as reference to generate a new filter',
    '- User can paste only the value, you should try to understand to which column the value belongs',
    '- Try to generate at least one filter unless the prompt is completely unclear',
    '',
    'Ordering:',
    '- If the user requests sorting or ordering (e.g., "sort by date descending", "order by name ascending"), generate an orderBy array.',
    '- Use the exact column names from the context for ordering.',
    '- Each orderBy entry should have "column" (the column name) and "direction" ("ASC" or "DESC").',
    '- If no ordering is specified in the prompt, return an empty orderBy array.',
    '',
    `Current time: ${new Date().toISOString()}`,
    `Available operators: ${JSON.stringify(SQL_FILTERS_GROUPED, null, 2)}`,
    '',
    'Table context:',
    tableContext,
  ].join('\n')

const filtersOutputSchema = type({
  filters: type({
    column: 'string',
    operator: type.enumerated(
      ...SQL_FILTERS_LIST.map((filter) => filter.operator)
    ),
    values: 'string[]',
  }).array(),
  orderBy: type({
    column: 'string',
    direction: "'ASC' | 'DESC'",
  }).array(),
})

export const generateFilters = async (data: {
  context: string
  prompt: string
  signal?: AbortSignal
}) => {
  const { object } = await generateObject({
    abortSignal: data.signal,
    instructions: filtersInstructions(data.context),
    model: models.fast,
    prompt: data.prompt,
    schema: filtersOutputSchema,
  })

  return {
    filters: object.filters,
    orderBy: Object.fromEntries(
      object.orderBy.map(({ column, direction }) => [column, direction])
    ),
  }
}
