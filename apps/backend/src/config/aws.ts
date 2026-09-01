import { LambdaClient } from '@aws-sdk/client-lambda';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { env } from './env';

function getAwsConfig() {
  return {
    region: env.AWS_REGION,
    ...(env.AWS_ENDPOINT_URL && {
      endpoint: env.AWS_ENDPOINT_URL,
      forcePathStyle: true,
    }),
  };
}

const config = getAwsConfig();

export const lambdaClient = new LambdaClient(config);
export const cognitoClient = new CognitoIdentityProviderClient(config);
