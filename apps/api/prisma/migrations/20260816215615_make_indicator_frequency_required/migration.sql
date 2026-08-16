/*
  Warnings:

  - Made the column `frequency` on table `indicators` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "indicators" ALTER COLUMN "frequency" SET NOT NULL;
