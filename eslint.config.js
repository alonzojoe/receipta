import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Generated shadcn/ui primitives export a cva variants function alongside the
    // component (buttonVariants, badgeVariants, ...). Splitting each one into its own
    // file would have to be redone on every `shadcn add`, so the export is allowed
    // here instead. Scoped to shared/ui so it cannot mask the rule elsewhere.
    files: ['src/shared/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['buttonVariants'] },
      ],
    },
  },
])
