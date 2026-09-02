-- Cognitoの認証状態とは分離して、Knowledge-Hub内の利用可否を管理する。
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- 既存ユーザーと今後作成されるユーザーは、通常どおり利用可能な状態にする。
ALTER TABLE "User"
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- 管理画面の状態別集計と、認証時のACTIVE判定に利用する。
CREATE INDEX "User_status_idx" ON "User"("status");
