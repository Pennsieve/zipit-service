const path = require('path');

module.exports = {
    extends: [
        'airbnb-base',
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint',
        'plugin:prettier/recommended',
        'plugin:jest/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: path.resolve(
            __dirname,
            './',
        ),
    },
    plugins: ['jsdoc'],
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.ts'],
            },
        },
    },
    env: {
        es6: true,
        node: true,
        jest: true,
    },
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    rules: {
        // prettier
        'prettier/prettier': [
            'error',
            { trailingComma: 'all', singleQuote: true, parser: 'typescript' },
        ],
        // typescript
        '@typescript-eslint/ban-ts-ignore': 'warn',
        '@typescript-eslint/no-useless-constructor': 'error',
        // '@typescript-eslint/no-object-literal-type-assertion': 'off', // both are on (this and angle-bracket) ...so turn one off or you can never assert
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',
        '@typescript-eslint/explicit-function-return-type': [
            'warn',
            { allowTypedFunctionExpressions: true, allowExpressions: true },
        ],
        '@typescript-eslint/promise-function-async': 'warn',
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
        '@typescript-eslint/no-use-before-define': ['error', { 'functions': false, 'classes': false }],
        '@typescript-eslint/no-empty-function': ['error', {'allow': [ 'arrowFunctions' ] }],
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
        // node
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                'js': 'never',
                'jsx': 'never',
                'ts': 'never',
                'tsx': 'never'
            },
        ],
        'import/no-default-export': 'error',
        'import/prefer-default-export': 'off',
        'import/no-extraneous-dependencies': [
            'error',
            {
                devDependencies: [
                    '**/*.spec.ts*',
                    '**/*.test.ts',
                ],
            },
        ],
        'jest/expect-expect': [
            'warn',
            {
                'assertFunctionNames': ['expect', 'assertErrorResponseInBody']
            }
        ],
        'jsdoc/require-jsdoc': [
            'warn',
            {
                publicOnly: true,
                require: {
                    ArrowFunctionExpression: true,
                    ClassDeclaration: true,
                    ClassExpression: true,
                    FunctionDeclaration: true,
                    FunctionExpression: true,
                    MethodDefinition: true,
                },
            },
        ],
        'no-console': 'off', // use a logger!
        'no-shadow': ['error', { allow: ['_'] }],
        'no-nested-ternary': 'warn',
    },
};
