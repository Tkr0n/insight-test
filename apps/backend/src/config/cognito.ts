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

export async function resolveCognitoConfig(): Promise<CognitoConfig | null> {
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

  try {
    const poolsRes = await client.send(new ListUserPoolsCommand({ MaxResults: 10 }));
    const pool = poolsRes.UserPools?.[0];
    if (!pool?.Id) {
      console.warn('[cognito] No User Pool found in LocalStack — auth disabled until env vars are set');
      return null;
    }
    const userPoolId = pool.Id;

    const clientsRes = await client.send(
      new ListUserPoolClientsCommand({ UserPoolId: userPoolId, MaxResults: 10 })
    );
    const appClient = clientsRes.UserPoolClients?.[0];
    if (!appClient?.ClientId) {
      console.warn('[cognito] No App Client found in LocalStack — auth disabled until env vars are set');
      return null;
    }
    const clientId = appClient.ClientId;

    env.COGNITO_USER_POOL_ID = userPoolId;
    env.COGNITO_CLIENT_ID = clientId;

    cachedConfig = { userPoolId, clientId };
    console.log(`[cognito] Resolved — UserPool: ${userPoolId}, Client: ${clientId}`);

    return cachedConfig;
  } catch (err) {
    console.warn('[cognito] Could not resolve from LocalStack (community edition?) — auth disabled until env vars are set', err);
    return null;
  }
}
