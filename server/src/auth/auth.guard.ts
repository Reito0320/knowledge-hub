import { ForbiddenException, Inject, Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/server/src/infrastructure/prisma';
import { COGNITO_ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';
import { AuthService } from './auth.service';
import { ADMIN_ONLY, AUTH_MODE } from './auth.decorators';
import type { RequestIdentity } from './request-user';

export type AuthenticatedRequest = FastifyRequest & { identity?: RequestIdentity };

@Injectable()
export class AuthGuard implements CanActivate {
  @Inject(AuthService) private readonly auth!: AuthService;
  @Inject(Reflector) private readonly reflector!: Reflector;

  async canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()];
    const mode = this.reflector.getAllAndOverride<string>(AUTH_MODE, targets);
    if (mode === 'public') return true;
    const adminOnly = this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY, targets);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookie = request.headers.cookie?.split(';').map((part) => part.trim())
      .find((part) => part.startsWith(`${COGNITO_ACCESS_TOKEN_COOKIE}=`));
    const authorization = request.headers.authorization;
    let token: string | undefined;
    try {
      token = authorization !== undefined
        ? authorization.startsWith('Bearer ') ? authorization.slice(7) : undefined
        : cookie ? decodeURIComponent(cookie.slice(COGNITO_ACCESS_TOKEN_COOKIE.length + 1)) : undefined;
      if (!token) throw new UnauthorizedException();
      const session = await this.auth.verifyAccessToken(token);
      request.identity = { session };
    } catch {
      if (request.url.split('?')[0] === '/api/auth/session') {
        context.switchToHttp().getResponse<FastifyReply>().header('set-cookie',
          `${COGNITO_ACCESS_TOKEN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
      }
      if (adminOnly) throw new ForbiddenException('管理者権限が必要です。');
      throw new UnauthorizedException('ログインが必要です。');
    }
    if (mode === 'cognito') return true;
    const user = await prisma.user.findFirst({
      where: { id: request.identity.session.payload.sub, status: 'ACTIVE', ...(adminOnly ? { role: 'ADMIN' as const } : {}) },
      select: { id: true, role: true },
    });
    if (!user || (adminOnly && user.role !== 'ADMIN')) {
      if (adminOnly) throw new ForbiddenException('管理者権限が必要です。');
      throw new UnauthorizedException('利用できるアカウントがありません。');
    }
    request.identity.user = user;
    return true;
  }
}
