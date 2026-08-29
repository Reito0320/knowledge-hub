export type PostTagInput =
  | {
      type: 'existing';
      id: string;
      name: string;
      slug: string;
    }
  | {
      type: 'new';
      name: string;
    };

const createTagSlug = (name: string) =>
  name.trim().normalize('NFKC').toLowerCase().replace(/\s+/g, '-');

// Postのネスト作成・更新で利用するTagとの接続情報を組み立てる。
export const createPostTagData = (tags: PostTagInput[]) => {
  return tags.map((tag) => {
    if (tag.type === 'existing') {
      return {
        tag: {
          connect: {
            id: tag.id,
          },
        },
      };
    }

    const name = tag.name.trim();
    const slug = createTagSlug(name);

    return {
      tag: {
        connectOrCreate: {
          where: {
            slug,
          },
          create: {
            name,
            slug,
          },
        },
      },
    };
  });
};
