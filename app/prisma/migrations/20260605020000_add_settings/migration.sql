-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "startDate" DATE NOT NULL,
    "goalWeight" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- 預設一列:Day 1 = 2026-03-17(已存在則不動)
INSERT INTO "Settings" ("id", "startDate", "updatedAt")
VALUES (1, '2026-03-17', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
