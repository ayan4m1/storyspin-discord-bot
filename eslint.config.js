import js from '@eslint/js';
import globals from 'globals';
import babelParser from '@babel/eslint-parser';
import importPlugin from 'eslint-plugin-import-x';
import prettierPlugin from 'eslint-plugin-prettier/recommended';

export default [
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.react,
  {
    languageOptions: {
      globals: globals.node,
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false
      }
    }
  },
  prettierPlugin
];
