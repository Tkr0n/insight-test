// Stub-specific helpers for Cognito interception
export const COGNITO_STUB_RESPONSES = {
  success: {
    statusCode: 200,
    body: {
      AuthenticationResult: {
        IdToken: 'mock-jwt-token-for-testing',
      },
    },
  },
  wrongPassword: {
    statusCode: 200,
    body: {
      __type: 'NotAuthorizedException',
      message: 'Incorrect username or password.',
    },
  },
  userNotFound: {
    statusCode: 200,
    body: {
      __type: 'UserNotFoundException',
      message: 'User does not exist.',
    },
  },
};
