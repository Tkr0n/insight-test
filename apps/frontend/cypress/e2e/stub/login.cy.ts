describe('Login Page', () => {
  beforeEach(() => {
    cy.intercept('POST', /cognito-idp\..*\.amazonaws\.com/, {
      statusCode: 200,
      body: { AuthenticationResult: { IdToken: 'mock-jwt' } },
    }).as('cognitoAuth');
  });

  it('renders the login form', () => {
    cy.visit('/login');
    cy.contains('Insightt Task Manager').should('be.visible');
    cy.contains('Sign in to manage your tasks').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').and('contain', 'Sign In');
  });

  it('shows error on failed login', () => {
    cy.intercept('POST', /cognito-idp\..*\.amazonaws\.com/, {
      statusCode: 200,
      body: { __type: 'NotAuthorizedException', message: 'Incorrect credentials' },
    }).as('cognitoAuthFail');

    cy.visit('/login');
    cy.get('input[type="email"]').type('wrong@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.wait('@cognitoAuthFail');
    cy.get('[role="alert"]').should('contain', 'Incorrect email or password');
  });

  it('navigates to /tasks on successful login', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@cognitoAuth');
    cy.url().should('include', '/tasks');
  });

  it('disables submit button and shows loading text during submission', () => {
    cy.intercept('POST', /cognito-idp\..*\.amazonaws\.com/, (req) => {
      req.reply({ delay: 1000, statusCode: 200, body: { AuthenticationResult: { IdToken: 'mock-jwt' } } });
    }).as('cognitoAuthSlow');

    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();

    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('button[type="submit"]').should('contain', 'Signing in...');

    cy.wait('@cognitoAuthSlow');
    cy.url().should('include', '/tasks');
  });
});
