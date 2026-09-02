describe('Full Flow (AWS Cognito)', () => {
  const email = Cypress.env('COGNITO_TEST_EMAIL');
  const password = Cypress.env('COGNITO_TEST_PASSWORD');

  before(() => {
    if (!email || !password) {
      cy.log('Skipping integration tests: CYPRESS_COGNITO_EMAIL and CYPRESS_COGNITO_PASSWORD not set');
      this.skip();
    }
  });

  it('completes full login → create task → verify flow', () => {
    cy.visit('/login');

    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/tasks');

    // Wait for task list to load
    cy.get('body').should('not.contain', 'Signing in...');

    // Create a task
    cy.contains('New Task').click();

    const taskTitle = `E2E Test Task ${Date.now()}`;
    cy.get('input[name="title"], input').first().type(taskTitle);
    cy.get('textarea, input[name="description"]').first().type('Automated E2E test task');

    cy.get('button[type="submit"]').last().click();

    // Verify success
    cy.get('[role="alert"]').should('contain', 'Task created');

    // Verify task appears in list
    cy.contains(taskTitle).should('be.visible');
  });
});
