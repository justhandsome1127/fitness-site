-- CreateTable
CREATE TABLE "WeightEntry" (
    "id" SERIAL NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "type" TEXT NOT NULL DEFAULT 'normal',
    "date" TIMESTAMP(3),

    CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "exercises" JSONB,
    "dietNote" TEXT,
    "bodyNote" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeightEntry_dayNumber_key" ON "WeightEntry"("dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_date_key" ON "DailyLog"("date");
