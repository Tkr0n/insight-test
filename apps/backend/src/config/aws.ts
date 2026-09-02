import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { env } from './env';

export const lambdaClient = new LambdaClient({
  region: env.AWS_REGION,
});

export const cognitoClient = new CognitoIdentityProviderClient({
  region: env.AWS_REGION,
});
