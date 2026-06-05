-- CreateTable
CREATE TABLE "InBodyEntry" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "weight" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION NOT NULL,
    "muscle" DOUBLE PRECISION NOT NULL,
    "visceral" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InBodyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InBodyEntry_date_key" ON "InBodyEntry"("date");
