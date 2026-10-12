import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

const SERVICE_SRC = ["applications/*/src/**/*.ts"];
const SHARED_SRC = ["shared/**/*.ts"];

export default defineConfig([
    globalIgnores([
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/coverage/**",
        "**/logs/**",
        "**/*.d.ts",
        // Prisma generated artifacts
        "applications/*/src/prisma/contract.json",
        "applications/*/src/prisma/migrations/**",
    ]),

    js.configs.recommended,
    tseslint.configs.recommended,
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: { ...globals.node },
        },
        rules: {
            "no-var": "error",
            "prefer-const": "warn",
            eqeqeq: ["error", "always"],
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            "@typescript-eslint/no-inferrable-types": "warn",
            "@typescript-eslint/consistent-type-imports": ["warn", { fixStyle: "inline-type-imports" }],
            "@typescript-eslint/explicit-member-accessibility": [
                "error",
                {
                    accessibility: "explicit",
                    overrides: {
                        constructors: "no-public",
                    },
                },
            ],
            "@typescript-eslint/no-extraneous-class": "error",
            "@typescript-eslint/parameter-properties": "error",
            "@typescript-eslint/member-ordering": "error",
        },
    },

    {
        files: [...SERVICE_SRC, ...SHARED_SRC],
        extends: [tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: {
                // Each file is matched to its nearest tsconfig.json
                // (applications/*/tsconfig.json, or the root one for shared/*)
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // Unhandled promises crash / silently fail request handlers
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { arguments: false } }],
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/return-await": ["error", "in-try-catch"],
            "@typescript-eslint/switch-exhaustiveness-check": "error",
            "@typescript-eslint/no-unnecessary-condition": "warn",
            "@typescript-eslint/prefer-nullish-coalescing": "warn",
            // Request bodies / JSON are untyped by nature; validate with zod instead of failing lint
            "@typescript-eslint/no-unsafe-assignment": "warn",
            "@typescript-eslint/no-unsafe-member-access": "warn",
        },
    },

    {
        files: SERVICE_SRC,
        rules: {
            // Use the shared winston logger (@soa/shared/log) instead of console
            "no-console": "error",
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["**/*-service/**", "**/applications/**"],
                            message: "Services must not import each other's code. Call the other service over HTTP or move the code to shared/*.",
                        },
                        {
                            group: ["**/shared/**", "!@soa/shared/**"],
                            message: "Import shared code via its workspace package name (e.g. '@soa/shared/log'), not a relative path.",
                        },
                    ],
                },
            ],
        },
    },

    {
        files: ["applications/*/src/prisma/seed.ts", "applications/*/prisma.config.ts", "*.config.{js,mjs,ts,mts}"],
        rules: {
            "no-console": "off",
        },
    },

    // Must be last: turns off rules that conflict with Prettier
    eslintConfigPrettier,
]);
