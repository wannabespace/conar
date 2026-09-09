export const section = (label: string, body: string) =>
  [`=======${label}=======`, body, `=======END OF ${label}=======`].join('\n')

export const sqlOutputRules = (connectionType: string) => [
  `The database type is "${connectionType}".`,
  'Return only SQL, nothing else: no explanations, greetings, markdown, or ``` fences.',
  'The output is pasted directly into a SQL editor.',
]
