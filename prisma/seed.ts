import { seedPrisma as prisma } from './seed-client';
import {
  SEED_COMMENTS,
  SEED_DEPARTMENTS,
  SEED_LIKES,
  SEED_POSTS,
  SEED_TAGS,
  SEED_USERS,
} from './seed-data';

const seed = async () => {
  for (const department of SEED_DEPARTMENTS) {
    await prisma.department.upsert({
      where: { id: department.id },
      update: { name: department.name },
      create: department,
    });
  }

  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }

  const tagsBySlug = new Map<string, string>();

  for (const tag of SEED_TAGS) {
    const savedTag = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
      select: { id: true, slug: true },
    });
    tagsBySlug.set(savedTag.slug, savedTag.id);
  }

  for (const post of SEED_POSTS) {
    const postTags = post.tagSlugs.map((slug) => {
      const tagId = tagsBySlug.get(slug);
      if (!tagId) throw new Error(`Seed Tagが見つかりません: ${slug}`);
      return { tag: { connect: { id: tagId } } };
    });

    const postData = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      status: 'PUBLISHED' as const,
      viewCount: post.viewCount,
      publishedAt: post.publishedAt,
      authorId: post.authorId,
    };

    await prisma.post.upsert({
      where: { id: post.id },
      update: {
        ...postData,
        postTags: {
          deleteMany: {},
          create: postTags,
        },
      },
      create: {
        id: post.id,
        ...postData,
        postTags: {
          create: postTags,
        },
      },
    });
  }

  for (const comment of SEED_COMMENTS) {
    await prisma.comment.upsert({
      where: { id: comment.id },
      update: { content: comment.content },
      create: comment,
    });
  }

  await prisma.postLike.createMany({
    data: SEED_LIKES.map(([userId, postId]) => ({ userId, postId })),
    skipDuplicates: true,
  });

  console.log(
    `Seed完了: ${SEED_USERS.length} users / ${SEED_POSTS.length} posts / ${SEED_TAGS.length} tags`,
  );
};

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
