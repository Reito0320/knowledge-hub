import { identityContext } from '../auth/request-user';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { from, lastValueFrom } from 'rxjs';
import { cookieContext } from './cookie';

/** Preserve status codes, redirects and multiple Set-Cookie headers. */
export class WebResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    reply.header('Cache-Control', 'private, no-store');
    return from(identityContext.run(request.identity, () => cookieContext.run({ incoming: request.headers.cookie ?? '', outgoing: [] }, async () => {
      const response: unknown = await lastValueFrom(next.handle());
      if (!(response instanceof Response)) return response;
      reply.status(response.status);
      response.headers.forEach((value, name) => {
        if (name !== 'set-cookie') reply.header(name, value);
      });
      const cookies = [...response.headers.getSetCookie(), ...cookieContext.getStore()!.outgoing];
      if (cookies.length) reply.header('set-cookie', cookies);
      return Buffer.from(await response.arrayBuffer());
    })));
  }
}
