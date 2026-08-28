import { PostListItem } from '@/app/api/post/fetch';

export const postStatusCounter = (posts: PostListItem[]) => {
  const publishedCount = posts.filter(
    (post) => post.status === 'PUBLISHED',
  ).length;
  const draftCount = posts.filter((post) => post.status === 'DRAFT').length;
  const totalLikes = posts.reduce(
    (total, post) => total + post._count.likes,
    0,
  );
  return { publishedCount, draftCount, totalLikes };
};
