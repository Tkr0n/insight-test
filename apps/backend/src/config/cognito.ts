import {
  CognitoIdentityProviderClient,
  ListUserPoolsCommand,
  ListUserPoolClientsCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { env } from './env.js';

export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
}

let cachedConfig: CognitoConfig | null = null;

export async function resolveCognitoConfig(): Promise<CognitoConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (env.COGNITO_USER_POOL_ID && env.COGNITO_CLIENT_ID) {
    cachedConfig = {
      userPoolId: env.COGNITO_USER_POOL_ID,
      clientId: env.COGNITO_CLIENT_ID,
    };
    return cachedConfig;
  }

  const client = new CognitoIdentityProviderClient({
    region: env.AWS_REGION,
    endpoint: env.LOCALSTACK_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
  });

  const poolsRes = await client.send(new ListUserPoolsCommand({ MaxResults: 10 }));
  const pool = poolsRes.UserPools?.[0];
  if (!pool?.Id) {
    throw new Error('No Cognito User Pool found in LocalStack');
  }
  const userPoolId = pool.Id;

  const clientsRes = await client.send(
    new ListUserPoolClientsCommand({ UserPoolId: userPoolId, MaxResults: 10 })
  );
  const appClient = clientsRes.UserPoolClients?.[0];
  if (!appClient?.ClientId) {
    throw new Error('No Cognito App Client found in LocalStack');
  }
  const clientId = appClient.ClientId;

  env.COGNITO_USER_POOL_ID = userPoolId;
  env.COGNITO_CLIENT_ID = clientId;

  cachedConfig = { userPoolId, clientId };
  console.log(`Resolved Cognito - UserPool: ${userPoolId}, Client: ${clientId}`);

  return cachedConfig;
}
