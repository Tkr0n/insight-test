declare namespace Cypress {
  interface Chainable {
    loginByStub(): Chainable<void>;
    interceptTasks(tasks: unknown[]): Chainable<void>;
    interceptCreateTask(task: unknown): Chainable<void>;
  }
}

Cypress.Commands.add('loginByStub', () => {
  cy.intercept('POST', /cognito-idp\..*\.amazonaws\.com/, {
    statusCode: 200,
    body: {
      AuthenticationResult: {
        IdToken: 'mock-jwt-token-for-testing',
      },
    },
  }).as('cognitoAuth');

  cy.visit('/login');
  cy.get('input[type="email"]').type('test@example.com');
  cy.get('input[type="password"]').type('TestPassword123!');
  cy.get('button[type="submit"]').click();

  cy.wait('@cognitoAuth');
  cy.url().should('include', '/tasks');
});

Cypress.Commands.add('interceptTasks', (tasks: unknown[]) => {
  cy.intercept('GET', '/api/tasks', {
    statusCode: 200,
    body: { data: tasks },
  }).as('getTasks');
});

Cypress.Commands.add('interceptCreateTask', (task: unknown) => {
  cy.intercept('POST', '/api/tasks', {
    statusCode: 201,
    body: { data: task },
  }).as('createTask');
});
