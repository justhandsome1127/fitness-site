-- 多人改造:新增 User,把資料歸到使用者,移除單列 Settings。
-- 安全順序:建 User → 從 Settings 建立 yen → 三表加可空 userId → backfill → NOT NULL → 換唯一鍵 → 加 FK → 刪 Settings。

-- 1. 建 User 表
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "startDate" DATE NOT NULL,
    "goalWeight" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- 2. 建立 yen(從現有 Settings 複製起始日/目標/體脂)。
--    passwordHash 先放佔位字串,部署時由 prisma seed 依 ADMIN_PASSWORD 填入真實 bcrypt hash。
INSERT INTO "User" ("username", "displayName", "passwordHash", "role", "startDate", "goalWeight", "bodyFat", "createdAt")
SELECT 'yen', 'yen', 'SET_BY_SEED', 'admin', s."startDate", s."goalWeight", s."bodyFat", CURRENT_TIMESTAMP
FROM "Settings" s
WHERE s."id" = 1;

-- 萬一沒有 Settings 列(理論上有),仍確保 yen 存在
INSERT INTO "User" ("username", "displayName", "passwordHash", "role", "startDate")
SELECT 'yen', 'yen', 'SET_BY_SEED', 'admin', DATE '2026-03-17'
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE "username" = 'yen');

-- 3. 三表加可空 userId
ALTER TABLE "WeightEntry" ADD COLUMN "userId" INTEGER;
ALTER TABLE "DailyLog"   ADD COLUMN "userId" INTEGER;
ALTER TABLE "InBodyEntry" ADD COLUMN "userId" INTEGER;

-- 4. backfill:把現有資料全部歸給 yen
UPDATE "WeightEntry" SET "userId" = (SELECT "id" FROM "User" WHERE "username" = 'yen') WHERE "userId" IS NULL;
UPDATE "DailyLog"    SET "userId" = (SELECT "id" FROM "User" WHERE "username" = 'yen') WHERE "userId" IS NULL;
UPDATE "InBodyEntry" SET "userId" = (SELECT "id" FROM "User" WHERE "username" = 'yen') WHERE "userId" IS NULL;

-- 5. 設 NOT NULL
ALTER TABLE "WeightEntry" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "DailyLog"    ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "InBodyEntry" ALTER COLUMN "userId" SET NOT NULL;

-- 6. 移除舊的單欄唯一鍵
DROP INDEX "WeightEntry_dayNumber_key";
DROP INDEX "DailyLog_date_key";
DROP INDEX "InBodyEntry_date_key";

-- 7. 加上 per-user 複合唯一鍵
CREATE UNIQUE INDEX "WeightEntry_userId_dayNumber_key" ON "WeightEntry"("userId", "dayNumber");
CREATE UNIQUE INDEX "DailyLog_userId_date_key" ON "DailyLog"("userId", "date");
CREATE UNIQUE INDEX "InBodyEntry_userId_date_key" ON "InBodyEntry"("userId", "date");

-- 8. 加 FK(刪使用者連帶刪資料)
ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyLog"    ADD CONSTRAINT "DailyLog_userId_fkey"    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InBodyEntry" ADD CONSTRAINT "InBodyEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. 移除單列 Settings(資料已併入 User)
DROP TABLE "Settings";
