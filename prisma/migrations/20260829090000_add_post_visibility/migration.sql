-- 投稿者が記事ごとの閲覧範囲を選べるようにする。
CREATE TYPE "PostVisibility" AS ENUM ('ORGANIZATION', 'LINK', 'DEPARTMENT', 'PRIVATE');

ALTER TABLE "Post"
ADD COLUMN "visibility" "PostVisibility" NOT NULL DEFAULT 'ORGANIZATION';

CREATE INDEX "Post_status_visibility_publishedAt_idx"
ON "Post"("status", "visibility", "publishedAt");
