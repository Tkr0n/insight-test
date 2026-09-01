import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/localstack/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    env: {
      COGNITO_TEST_EMAIL: process.env.CYPRESS_COGNITO_EMAIL,
      COGNITO_TEST_PASSWORD: process.env.CYPRESS_COGNITO_PASSWORD,
    },
  },
});
