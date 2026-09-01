describe('Loading States', () => {
  beforeEach(() => {
    cy.intercept('POST', /cognito-idp\..*\.amazonaws\.com/, {
      statusCode: 200,
      body: { AuthenticationResult: { IdToken: 'mock-jwt' } },
    });
  });

  it('shows skeleton placeholders while tasks are loading', () => {
    // Delay the tasks response to observe loading state
    cy.intercept('GET', '/api/tasks', (req) => {
      req.reply({ delay: 2000, statusCode: 200, body: { data: [] } });
    }).as('getTasksDelayed');

    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/tasks');

    // MUI Skeleton renders elements with aria-busy or specific class
    // Check that loading indicator appears
    cy.get('[class*="MuiSkeleton"]').should('exist');

    // Wait for the response to complete
    cy.wait('@getTasksDelayed');

    // Skeletons should disappear
    cy.get('[class*="MuiSkeleton"]').should('not.exist');
  });

  it('shows loading text on submit button during login', () => {
    cy.intercept('POST', /cognito-idp\..*\.amazonaws\.com/, (req) => {
      req.reply({ delay: 1500, statusCode: 200, body: { AuthenticationResult: { IdToken: 'mock-jwt' } } });
    }).as('cognitoAuthSlow');

    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();

    // Button should show loading text and be disabled
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('button[type="submit"]').should('contain', 'Signing in...');

    cy.wait('@cognitoAuthSlow');
  });
});
