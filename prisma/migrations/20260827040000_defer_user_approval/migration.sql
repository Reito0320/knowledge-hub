-- 管理者承認は開発終盤に実装するため、現段階では承認状態をDBから外す。
-- UserのID・メール・名前など、承認状態以外のデータには影響しない。
DROP INDEX "User_status_idx";

ALTER TABLE "User" DROP COLUMN "status";

DROP TYPE "UserStatus";
