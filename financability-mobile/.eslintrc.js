module.exports = {
  root: true,
  extends: ['expo'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
  ignorePatterns: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.expo/**',
    'web-build/**',
  ],
};