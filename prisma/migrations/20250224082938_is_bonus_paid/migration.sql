/*
  Warnings:

  - You are about to drop the column `isBonusPaid` on the `Organization` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "isBonusPaid";

-- AlterTable
ALTER TABLE "WorkingSchedule" ADD COLUMN     "isBonusPaid" BOOLEAN NOT NULL DEFAULT false;
