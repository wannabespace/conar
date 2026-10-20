import { BSON_CONSTRUCTORS } from '@tamery/mongo/operators'
import { languages } from 'monaco-editor'

const CONSTRUCTORS = [
  ...Object.keys(BSON_CONSTRUCTORS),
  'BinData',
  'Date',
  'Decimal128',
  'Double',
  'Int32',
  'Long',
  'Math',
  'MaxKey',
  'MinKey',
  'RegExp',
  'Timestamp',
]

export const registerMongoTokens = (id: string) => {
  languages.register({ id })

  const configuration = languages.setLanguageConfiguration(id, {
    autoClosingPairs: [
      { close: ')', open: '(' },
      { close: ']', open: '[' },
      { close: '}', open: '{' },
      { close: "'", notIn: ['string', 'comment'], open: "'" },
      { close: '"', notIn: ['string', 'comment'], open: '"' },
      { close: '`', notIn: ['string', 'comment'], open: '`' },
    ],
    brackets: [
      ['{', '}'],
      ['(', ')'],
      ['[', ']'],
    ],
    comments: { blockComment: ['/*', '*/'], lineComment: '//' },
    surroundingPairs: [
      { close: ')', open: '(' },
      { close: '}', open: '{' },
      { close: ']', open: '[' },
      { close: "'", open: "'" },
      { close: '"', open: '"' },
    ],
  })

  const tokens = languages.setMonarchTokensProvider(id, {
    constructors: CONSTRUCTORS,
    keywords: ['db', 'false', 'new', 'null', 'true', 'undefined'],
    tokenizer: {
      comment: [
        [/\*\//u, 'comment', '@pop'],
        [/./u, 'comment'],
      ],
      root: [
        [/\/\/.*$/u, 'comment'],
        [/\/\*/u, 'comment', '@comment'],
        [/\$[\w$]+/u, 'keyword'],
        [
          /[A-Za-z_][\w$]*/u,
          {
            cases: {
              '@constructors': 'predefined',
              '@default': 'identifier',
              '@keywords': 'keyword',
            },
          },
        ],
        [/"(?:[^"\\]|\\.)*"/u, 'string'],
        [/'(?:[^'\\]|\\.)*'/u, 'string'],
        [/`(?:[^`\\]|\\.)*`/u, 'string'],
        [/\/(?:\\.|[^\\/\n])+\/[gimsuy]*/u, 'string'],
        [/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/iu, 'number'],
        [/[{}()[\]]/u, '@brackets'],
        [/[,.;:]/u, 'delimiter'],
      ],
    },
  })

  return [configuration, tokens]
}
