import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        ignores: ['dist/**', 'build/**', 'node_modules/**', '.next/**', 'next-env.d.ts'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
        settings: {
            react: { version: 'detect' },
        },
        rules: {
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-var': 'error',
            'prefer-const': 'warn',
            semi: 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/semi': ['error', 'always'],
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'explicit',
                    overrides: {
                        cosntructors: 'no-public'
                    }
                }
            ],
            '@typescript-eslint/no-extraneous-class': 'error',
            '@typescript-eslint/parameter-properties': 'error',
            '@typescript-eslint/member-ordering': 'error',
            '@typescript-eslint/no-inferrable-types': 'warn',
        },
    },
    eslintConfigPrettier,
]);
