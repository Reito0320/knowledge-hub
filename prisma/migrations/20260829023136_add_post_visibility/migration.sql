-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('ORGANIZATION', 'LINK', 'DEPARTMENT', 'PRIVATE');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "visibility" "PostVisibility" NOT NULL DEFAULT 'ORGANIZATION';

-- CreateIndex
CREATE INDEX "Post_status_visibility_publishedAt_idx" ON "Post"("status", "visibility", "publishedAt");
