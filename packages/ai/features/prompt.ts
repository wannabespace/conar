export const section = (label: string, body: string) =>
  [`=======${label}=======`, body, `=======END OF ${label}=======`].join('\n')

export const sqlOutputRules = (connectionType: string) => [
  `The database type is "${connectionType}".`,
  'Return only SQL, nothing else: no explanations, greetings, markdown, or ``` fences.',
  'The output is pasted directly into a SQL editor.',
  'The SQL runs as typed, with nothing bound: never use placeholders or bind parameters ($1, ?, :name, @p1). Write literal values; when the value is unknown, use a realistic example literal the user can edit.',
]
