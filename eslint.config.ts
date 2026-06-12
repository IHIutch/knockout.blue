import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  typescript: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
  },
  ignores: ['**/**.gen.*'],
  rules: {
    'perfectionist/sort-imports': ['error', {
      type: 'natural',
    }],
  },
},
)
