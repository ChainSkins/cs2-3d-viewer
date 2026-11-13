import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'public']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      // Off: they flag the "latest value in a ref" pattern and changes to the three.js viewer, both on purpose here.
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  {
    files: ['src/components/ui/**', 'src/context/**', 'src/routes.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
