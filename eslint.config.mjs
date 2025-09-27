const { FlatCompat } = require('@eslint/eslintrc');
const { dirname } = require('path');
const { fileURLToPath } = require('url');

// For Next.js 15 with ESLint 9 compatibility
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      'no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
