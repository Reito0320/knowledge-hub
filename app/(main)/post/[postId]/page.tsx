type PostDetailPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

/* 記事を選んだ際に一枚を閲覧するページ */
const PostDetailPage = async ({ params }: PostDetailPageProps) => {
  const { postId } = await params;

  // TODO: postIdを使ってPrismaから記事を1件取得する
  console.log({ postId });

  return <div>PostDetailPage</div>;
};

export default PostDetailPage;
