-- DropForeignKey
ALTER TABLE "GroupAttendance" DROP CONSTRAINT "GroupAttendance_leaderId_fkey";

-- DropForeignKey
ALTER TABLE "GroupAttendance" DROP CONSTRAINT "GroupAttendance_managerId_fkey";

-- AlterTable
ALTER TABLE "GroupAttendance" ALTER COLUMN "managerId" DROP NOT NULL,
ALTER COLUMN "leaderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "GroupAttendance" ADD CONSTRAINT "GroupAttendance_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupAttendance" ADD CONSTRAINT "GroupAttendance_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "GroupMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
