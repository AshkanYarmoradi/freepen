import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Accessibility rules for better mobile experience
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',

      // Performance rules for mobile
      'react/no-array-index-key': 'warn',
      'react/jsx-no-bind': ['warn', { 'allowArrowFunctions': true }],

      // PWA best practices
      'no-restricted-globals': ['error', 'event', 'fdescribe'],

      // General best practices
      'react/self-closing-comp': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { 'props': 'never', 'children': 'never' }],
      'prefer-const': 'error',
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
      'import/no-anonymous-default-export': 'off',
    },
  },
];

export default eslintConfig;
