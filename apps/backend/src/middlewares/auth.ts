import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { env } from '../config/env.js';
import { AppError } from './error-handler.js';

export interface AuthPayload {
  sub: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

let client: jwksClient.JwksClient | null = null;

function getClient(): jwksClient.JwksClient {
  if (!client) {
    client = jwksClient({
      jwksUri: `https://cognito-idp.${env.AWS_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 600000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }
  return client;
}

function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
  getClient().getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

function verifyToken(token: string): Promise<jwt.JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        algorithms: ['RS256'],
        audience: env.COGNITO_CLIENT_ID,
        issuer: `https://cognito-idp.${env.AWS_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}`,
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded as jwt.JwtPayload);
        }
      }
    );
  });
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!env.COGNITO_USER_POOL_ID || !env.COGNITO_CLIENT_ID) {
    console.warn('[auth] No Cognito config — skipping authentication');
    next();
    return;
  }

  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.['__Host-id_token'];
  const authHeader = req.headers.authorization;

  let token: string | undefined;
  if (cookieToken) {
    token = cookieToken;
  } else if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new AppError(401, 'Missing or invalid authorization header');
  }

  try {
    const payload = await verifyToken(token);
    req.user = { sub: payload.sub!, email: payload.email };
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}
