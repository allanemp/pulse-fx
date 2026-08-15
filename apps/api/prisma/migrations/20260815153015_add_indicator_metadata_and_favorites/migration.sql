-- AlterTable
ALTER TABLE "indicators" ADD COLUMN     "description" TEXT,
ADD COLUMN     "unit" TEXT;

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "indicator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorites_indicator_id_key" ON "favorites"("indicator_id");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_indicator_id_fkey" FOREIGN KEY ("indicator_id") REFERENCES "indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
