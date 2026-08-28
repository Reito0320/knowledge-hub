import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DIRECT_URLまたはDATABASE_URLを設定してください。');
}

const adapter = new PrismaPg({ connectionString });

export const seedPrisma = new PrismaClient({ adapter });
