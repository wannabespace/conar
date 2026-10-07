import type { editor } from 'monaco-editor'

export const SQL_COMPLETION_OPTIONS = {
  inlineSuggest: {
    enabled: true,
    showToolbar: 'never',
  },
  // `other` defaults to 'offWhenInlineCompletions': the list would wait on the AI ghost-text request.
  quickSuggestions: { comments: 'off', other: 'on', strings: 'on' },
  quickSuggestionsDelay: 0,
  // `preview` stays off: the row's own preview draws as ghost text and would read as an AI suggestion.
  suggest: {
    preview: false,
    selectionMode: 'whenQuickSuggestion',
    showWords: false,
  },
} satisfies editor.IStandaloneEditorConstructionOptions

export const FIELD_EDITOR_OPTIONS = {
  fontSize: 12,
  lineNumbersMinChars: 3,
  padding: { top: 8 },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
} satisfies editor.IStandaloneEditorConstructionOptions
