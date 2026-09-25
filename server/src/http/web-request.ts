import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

/** Keep the API's existing Web Request contract independent of Next.js. */
export const WebRequest = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<FastifyRequest>();
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  return new Request(new URL(request.url, 'http://api.internal'), {
    method: request.method,
    headers,
    ...(request.body !== undefined && !['GET', 'HEAD'].includes(request.method)
      ? { body: typeof request.body === 'string' ? request.body : JSON.stringify(request.body) }
      : {}),
  });
});

export const WebParams = createParamDecorator((_: unknown, context: ExecutionContext) => ({
  params: Promise.resolve(context.switchToHttp().getRequest<FastifyRequest>().params),
}));
