import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { prisma } from './prisma';

@Injectable()
export class DatabaseLifecycle implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await prisma.$disconnect();
  }
}
