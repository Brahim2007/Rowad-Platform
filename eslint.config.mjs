import { FlatCompat } from '@eslint/eslintrc'
import nextPlugin from '@next/eslint-plugin-next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      '.claude/**',
      'node_modules/**',
      'public/**',
      'Prompt/**',
      'next-env.d.ts',
      'tailwind.config.ts',
      'prisma/**',
      'scripts/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'react/no-unescaped-entities': 'off',
      'prefer-const': 'warn',
    },
  },
]

export default eslintConfig
