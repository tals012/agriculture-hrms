-- DropForeignKey
ALTER TABLE "WorkerAttendance" DROP CONSTRAINT "WorkerAttendance_combinationId_fkey";

-- AlterTable
ALTER TABLE "WorkerAttendance" ALTER COLUMN "combinationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "WorkerAttendance" ADD CONSTRAINT "WorkerAttendance_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "ClientPricingCombination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
