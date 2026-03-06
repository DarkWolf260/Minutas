import { createRequire } from 'module';
import eslintConfigPrettier from 'eslint-config-prettier';

const require = createRequire(import.meta.url);
const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');

const eslintConfig = [
    ...nextCoreWebVitals,
    eslintConfigPrettier,
    {
        settings: {
            react: {
                version: '19',
            },
        },
        rules: {
            // Allow unused vars prefixed with _
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            // Spanish documentation text uses " quotes in JSX — not a real bug
            'react/no-unescaped-entities': 'off',
            // Legitimate patterns: syncing with RxDB, localStorage, navigator.onLine
            'react-hooks/set-state-in-effect': 'off',
        },
    },
];

export default eslintConfig;
