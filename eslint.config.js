const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    files: ['src/render/**/*.{ts,tsx}'],
    rules: {
      'react/no-unknown-property': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      'web-build/**',
      'node_modules/**',
      '.expo/**',
      'coverage/**',
      'ios/**',
      'android/**',
    ],
  },
]);
