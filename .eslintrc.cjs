module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/self-closing-comp': [
      'error',
      {
        'component': true,
        'html': true
      }
    ],
    'react/no-unknown-property': 'off',

    'comma-dangle': ['error', 'always-multiline'],
    'comma-spacing': ['error', { before: false, after: true }],
    'eol-last': ['error', 'always'],
    'indent': ['error', 'tab'],
    'key-spacing' : ['error'],
    'keyword-spacing': "error",
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-multi-spaces' : ['error'],
    'no-unused-vars' : ['warn'],
    'no-trailing-spaces' : ['error'],
    'quotes': [2, 'single', { 'avoidEscape': true }],
    'semi': ['error', 'always'],
  },
}
