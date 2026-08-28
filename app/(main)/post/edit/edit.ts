type PostTagInput =
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

export const createPostTagData = (tags: PostTagInput[]) => {
  return tags.map((tag) => {
    // 既存タグはIDで接続する
    if (tag.type === 'existing') {
      return {
        tag: {
          connect: {
            id: tag.id,
          },
        },
      };
    }

    // 新規タグは、同じslugがあれば接続し、
    // 存在しなければ新しく作成する
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
