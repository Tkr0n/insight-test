import { LambdaClient } from '@aws-sdk/client-lambda';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

function getAwsConfig() {
  const endpoint = process.env.AWS_ENDPOINT_URL;
  return {
    region: process.env.AWS_REGION ?? 'us-east-1',
    ...(endpoint && { endpoint, forcePathStyle: true }),
  };
}

const globalForAws = globalThis as unknown as {
  lambdaClient: LambdaClient | undefined;
  cognitoClient: CognitoIdentityProviderClient | undefined;
};

export const lambdaClient =
  globalForAws.lambdaClient ?? new LambdaClient(getAwsConfig());

export const cognitoClient =
  globalForAws.cognitoClient ?? new CognitoIdentityProviderClient(getAwsConfig());

if (process.env.NODE_ENV !== 'production') {
  globalForAws.lambdaClient = lambdaClient;
  globalForAws.cognitoClient = cognitoClient;
}
