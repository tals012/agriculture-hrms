-- AlterTable
ALTER TABLE "SMS" ADD COLUMN     "managerId" TEXT;

-- AddForeignKey
ALTER TABLE "SMS" ADD CONSTRAINT "SMS_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;
