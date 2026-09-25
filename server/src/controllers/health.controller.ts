import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/auth.decorators';

@Controller('health')
export class HealthController {
  /** Liveness only; no credentials, queries or infrastructure details are exposed. */
  @Public()
  @Get()
  health() { return { status: 'ok' }; }
}
