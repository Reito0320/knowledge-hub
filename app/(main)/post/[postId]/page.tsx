type PostDetailPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

const PostDetailPage = async ({ params }: PostDetailPageProps) => {
  const { postId } = await params;

  // TODO: postIdを使ってPrismaから記事を1件取得する
  console.log({ postId });

  return <div>PostDetailPage</div>;
};

export default PostDetailPage;
