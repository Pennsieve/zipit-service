process.env.PORT = 4000
process.env.TEST_FILE_SERVER_PORT = 4001
process.env.API_URL = `http://localhost:${process.env.TEST_FILE_SERVER_PORT}`
process.env.PACKAGES_PATH = ''
process.env.MANIFEST_PATH = '/manifest'
process.env.LOG_LEVEL = 'verbose'

module.exports = {
  roots: ['<rootDir>/src'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts)?$': 'ts-jest',
  },
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  testRegex: '(/src/.*.(test|spec)).(ts?)$',
  moduleFileExtensions: ['ts', 'ts', 'js', 'js'],
  verbose: true,
  globalSetup: '<rootDir>/src/jest.globalSetup.ts',
  globalTeardown: '<rootDir>/src/jest.globalTeardown.ts'
};
