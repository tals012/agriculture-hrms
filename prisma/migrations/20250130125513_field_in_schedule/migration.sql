-- AlterEnum
ALTER TYPE "WorkingScheduleSource" ADD VALUE 'FIELD';

-- AlterTable
ALTER TABLE "WorkingSchedule" ADD COLUMN     "fieldId" TEXT;

-- AddForeignKey
ALTER TABLE "WorkingSchedule" ADD CONSTRAINT "WorkingSchedule_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
