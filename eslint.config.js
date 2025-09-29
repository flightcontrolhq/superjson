import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginEsX from 'eslint-plugin-es-x';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: {
      'es-x': eslintPluginEsX,
      prettier: eslintPluginPrettier,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // Selective ES5 compatibility rules for browser features
      // Note: Map, Set, Symbol are core to this library's functionality, so not restricted
      'es-x/no-for-of-loops': 'error',
      'es-x/no-generators': 'error',
      'es-x/no-array-prototype-find': 'error',
      'es-x/no-object-values': 'error',
      'es-x/no-object-entries': 'error',
      'es-x/no-object-setprototypeof': 'error',

      // Allow Object.assign (commonly polyfilled and already in exception)
      'es-x/no-object-assign': 'off',

      // Code quality rules - similar to tsdx
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any - this is a serialization library
      '@typescript-eslint/no-non-null-assertion': 'off', // Allow non-null assertions
      '@typescript-eslint/ban-ts-comment': 'off', // Allow @ts-ignore in tests
      '@typescript-eslint/no-empty-object-type': 'off', // Allow empty object types
      '@typescript-eslint/no-wrapper-object-types': 'off', // Allow Symbol type
      'no-prototype-builtins': 'off', // Allow hasOwnProperty usage
      'no-extra-boolean-cast': 'off', // Allow double negation
      'no-object-constructor': 'error', // Replaces deprecated no-new-object

      // Maintain some restrictions for code quality
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForInStatement',
          message:
            'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
        },
      ],
    },
  }
);
