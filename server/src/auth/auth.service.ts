import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import jwksClient from 'jwks-rsa';
import { getCognitoUser } from '@/server/src/infrastructure/aws/get-cognito-user';

export type AccessTokenPayload = {
  sub: string;
  exp: number;
  iss: string;
  client_id: string;
  token_use: 'access';
};
export type CognitoSession = {
  accessToken: string;
  payload: AccessTokenPayload;
  cognitoUser: NonNullable<Awaited<ReturnType<typeof getCognitoUser>>>;
};

@Injectable()
export class AuthService {
  @Inject(JwtService) private readonly jwt!: JwtService;
  private readonly pool = process.env.COGNITO_USER_POOL_ID ?? process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  private readonly clientId = process.env.COGNITO_CLIENT_ID ?? process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  private readonly issuer: string;
  private readonly keys: ReturnType<typeof jwksClient>;

  constructor() {
    if (!this.pool || !this.clientId || !/^[\w-]+_[\w]+$/.test(this.pool)) {
      throw new Error('COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are required');
    }
    const region = this.pool.split('_')[0];
    this.issuer = `https://cognito-idp.${region}.amazonaws.com/${this.pool}`;
    this.keys = jwksClient({ jwksUri: `${this.issuer}/.well-known/jwks.json`, cache: true, rateLimit: true, jwksRequestsPerMinute: 10, timeout: 5000 });
  }

  async verifyAccessToken(accessToken: string): Promise<CognitoSession> {
    try {
      const decoded = this.jwt.decode(accessToken, { complete: true }) as { header?: { kid?: string; alg?: string } } | null;
      if (decoded?.header?.alg !== 'RS256' || typeof decoded.header.kid !== 'string') throw new Error('Invalid JWT header');
      // The JWKS URL comes only from server configuration, never from a token header.
      const key = await this.keys.getSigningKey(decoded.header.kid);
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(accessToken, {
        publicKey: key.getPublicKey(), algorithms: ['RS256'], issuer: this.issuer,
      });
      if (payload.token_use !== 'access' || payload.client_id !== this.clientId ||
        typeof payload.sub !== 'string' || !payload.sub || typeof payload.exp !== 'number') {
        throw new Error('Invalid Cognito access token');
      }
      const cognitoUser = await getCognitoUser(accessToken);
      if (!cognitoUser || cognitoUser.sub !== payload.sub) throw new Error('Revoked Cognito session');
      return { accessToken, payload, cognitoUser };
    } catch {
      throw new UnauthorizedException('有効なCognitoセッションがありません。');
    }
  }
}
