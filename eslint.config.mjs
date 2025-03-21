import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import _import from 'eslint-plugin-import'
import unusedImports from 'eslint-plugin-unused-imports'
import tsParser from '@typescript-eslint/parser'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

import reactPlugin from 'eslint-plugin-react'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:import/errors',
      'plugin:import/warnings',
      'plugin:import/typescript',
      'prettier',
    ),
  ),
  {
    plugins: {
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      import: fixupPluginRules(_import),
      'unused-imports': unusedImports,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      ecmaVersion: 2020,
      sourceType: 'module',
    },

    rules: {
      'unused-imports/no-unused-imports': 'error',

      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],

      'import/no-unresolved': ['error', { ignore: ['\\.js$'] }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',

          overrides: {
            constructors: 'no-public',
          },
        },
      ],

      '@typescript-eslint/strict-boolean-expressions': ['error'],
      '@typescript-eslint/no-unused-vars': 'off',
      'no-magic-numbers': [
        'off',
        {
          ignore: [0, 2],
        },
      ],
    },
  },
  // do not import @jscad/modeling
  {
    files: ['**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@jscad/modeling/*', '@jscad/modeling'],
              message: "Importing from '@jscad/modeling' is not allowed in this file.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/core/src/Shape.ts', 'packages/core/src/jscad-3mf-serializer.d.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // Apply only to TSX files
    files: ['**/*.tsx'],
    plugins: {
      react: fixupPluginRules(reactPlugin),
    },
    rules: {
      // Enforce self-closing tags for components without children (collapses empty tags)
      'react/self-closing-comp': 'error',
      // Require double quotes in JSX attributes
      'jsx-quotes': ['error', 'prefer-double'],
      // Enforce proper spacing for closing brackets
      'react/jsx-closing-bracket-location': ['error', 'tag-aligned'],
      // Ensure the first prop is on a new line in multiline JSX
      'react/jsx-first-prop-new-line': ['error', 'multiline'],
      // Enforce consistent wrapping for multiline JSX expressions
      'react/jsx-wrap-multilines': [
        'error',
        {
          declaration: 'parens-new-line',
          assignment: 'parens-new-line',
          return: 'parens-new-line',
          arrow: 'parens-new-line',
          condition: 'parens-new-line',
          logical: 'parens-new-line',
          prop: 'parens-new-line',
        },
      ],
      // Enforce no useless fragments (collapse empty fragments)
      'react/jsx-no-useless-fragment': 'error',
      // Enforce no unnecessary spacing inside JSX curly braces
      'react/jsx-curly-spacing': ['error', { when: 'never', allowMultiline: true }],
      // Enforce consistent spacing around JSX tag operators
      'react/jsx-tag-spacing': ['error', { beforeSelfClosing: 'always' }],
      // Enforce 2-space indent in JSX
      'react/jsx-indent': ['error', 2],
      'react/jsx-indent-props': ['error', 2],
    },
  },
  {
    ignores: [
      '**/*.min.js',
      'packages/**/dist',
      '**/node_modules',
      'eslint.config.mjs',
      'jest.config.js',
      'jest.config.js',
      'src/server.ts',
      '.idea',
    ],
  },
]
