import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const compat = new FlatCompat();

export default [
  { ignores: ['.next/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  // reuse Next's legacy config via compat
  ...compat.extends('next/core-web-vitals'),
];