'use client';

import PostEditor from '@/app/(main)/post/_components/PostEditor';
import {
  fetchGetTargetPost,
  type PostDetailData,
} from '@/app/api/post/[postId]/fetch';
import Skeleton from '@/comp/Skeleton';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { FiArrowLeft, FiInfo } from 'react-icons/fi';

type EditPostPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

const EditPostPage = ({ params }: EditPostPageProps) => {
  const { postId } = use(params);
  const [post, setPost] = useState<PostDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const targetPost = await fetchGetTargetPost(postId);

        if (!targetPost) {
          setErrorMessage('対象の記事が見つかりませんでした。');
          return;
        }

        if (!targetPost.canEdit) {
          setErrorMessage('この記事を編集する権限がありません。');
          return;
        }

        setPost(targetPost);
      } catch (error) {
        console.error(error);
        setErrorMessage('記事を読み込めませんでした。');
      } finally {
        setIsLoading(false);
      }
    };

    void loadPost();
  }, [postId]);

  if (isLoading) return <Skeleton />;

  if (errorMessage || !post)
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F5F7FA] px-4 py-10">
        <section className="w-full max-w-lg rounded-2xl border border-[#DDE4EC] bg-white p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#F7EDEA] text-[#9A5A4B]">
            <FiInfo aria-hidden="true" className="size-5" />
          </span>
          <h1 className="mt-4 text-lg font-bold text-[#1E3A5F]">
            記事を編集できません
          </h1>
          <p className="mt-2 text-sm text-[#7B8899]">
            {errorMessage ?? '対象の記事が見つかりませんでした。'}
          </p>
          <Link
            href="/post"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#254F8F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1E3A5F]"
          >
            <FiArrowLeft aria-hidden="true" />
            記事一覧へ戻る
          </Link>
        </section>
      </main>
    );

  return (
    <PostEditor
      mode="edit"
      postId={postId}
      initialData={{
        title: post.title,
        excerpt: post.excerpt ?? '',
        content: post.content,
        category: post.category,
        tags: post.postTags.map(({ tag }) => ({
          type: 'existing' as const,
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        })),
      }}
    />
  );
};

export default EditPostPage;
