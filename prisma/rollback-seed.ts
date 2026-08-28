import { seedPrisma as prisma } from './seed-client';
import {
  SEED_DEPARTMENTS,
  SEED_TAGS,
  SEED_USERS,
} from './seed-data';

// DB全体はResetせず、Seed専用IDで作成したデータだけを削除する。
const rollbackSeed = async () => {
  await prisma.user.deleteMany({
    where: { id: { in: SEED_USERS.map(({ id }) => id) } },
  });

  // User削除でSeed Post・Comment・LikeはCascade削除される。
  await prisma.tag.deleteMany({
    where: {
      id: { in: SEED_TAGS.map(({ id }) => id) },
      postTags: { none: {} },
    },
  });

  await prisma.department.deleteMany({
    where: {
      id: { in: SEED_DEPARTMENTS.map(({ id }) => id) },
      members: { none: {} },
    },
  });

  console.log('Seed専用データをRollbackしました。');
};

rollbackSeed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
