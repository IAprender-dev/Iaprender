/**
 * CONFIGURAÇÃO JEST - IAPRENDER
 * 
 * Configuração para execução de testes unitários e de integração
 */

export default {
  // Ambiente de teste
  testEnvironment: 'node',

  // Suporte para ES Modules
  preset: null,
  
  // Transformações para ES modules
  transform: {},
  
  // Padrões de arquivos de teste
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.test.mjs',
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],

  // Cobertura de código
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    'server/**/*.{js,ts}',
    'client/src/**/*.{js,ts,tsx}',
    '!src/**/*.test.js',
    '!src/examples/**/*.js',
    '!src/config/**/*.js',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/test/**'
  ],

  // Relatórios de cobertura
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],

  // Limite mínimo de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Setup e teardown
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

  // Timeout para testes (30 segundos)
  testTimeout: 30000,

  // Configurações específicas para testes de integração
  globalSetup: '<rootDir>/test/globalSetup.js',
  globalTeardown: '<rootDir>/test/globalTeardown.js',

  // Verbose para logs detalhados
  verbose: true,

  // Extensões de arquivo
  moduleFileExtensions: ['js', 'json'],

  // Paths de módulos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1'
  },

  // Ignorar arquivos/pastas
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // Configurações para testes de banco de dados
  testEnvironmentOptions: {
    url: 'postgresql://localhost:5432/iaprender_test'
  }
};