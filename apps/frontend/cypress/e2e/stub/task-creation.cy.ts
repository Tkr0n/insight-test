const mockTask = {
  id: '550e8400-e29b-41d4-a716-446655440099',
  title: 'New E2E Task',
  description: 'Created via Cypress',
  status: 'PENDING',
  ownerId: 'user-1',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Task Creation', () => {
  beforeEach(() => {
    // Stub auth
    cy.intercept('POST', /cognito-idp\..*\.amazonaws\.com/, {
      statusCode: 200,
      body: { AuthenticationResult: { IdToken: 'mock-jwt' } },
    });

    // Stub task list (empty initially)
    cy.intercept('GET', '/api/tasks', {
      statusCode: 200,
      body: { data: [] },
    }).as('getTasks');

    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/tasks');
    cy.wait('@getTasks');
  });

  it('creates a new task successfully', () => {
    cy.intercept('POST', '/api/tasks', {
      statusCode: 201,
      body: { data: mockTask },
    }).as('createTask');

    cy.intercept('GET', '/api/tasks', {
      statusCode: 200,
      body: { data: [mockTask] },
    }).as('getTasksAfterCreate');

    cy.contains('New Task').click();

    cy.get('input[name="title"], input').first().type(mockTask.title);
    cy.get('textarea, input[name="description"]').first().type(mockTask.description);

    cy.get('button[type="submit"]').last().click();
    cy.wait('@createTask');

    cy.get('[role="alert"]').should('contain', 'Task created');
  });

  it('shows empty state when no tasks exist', () => {
    cy.contains('No tasks yet. Create your first task to get started.').should('be.visible');
  });
});
