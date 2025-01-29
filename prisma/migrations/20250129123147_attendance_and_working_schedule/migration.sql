/*
  Warnings:

  - You are about to drop the column `attendanceId` on the `WorkerAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `containersFilled` on the `WorkerAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `WorkerAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `hoursWorked` on the `WorkerAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `WorkerAttendance` table. All the data in the column will be lost.
  - You are about to drop the `GroupAttendance` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `combinationId` to the `WorkerAttendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `WorkerAttendance` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkingScheduleSource" AS ENUM ('ORGANIZATION', 'CLIENT', 'GROUP', 'WORKER');

-- CreateEnum
CREATE TYPE "WorkerAttendanceStatus" AS ENUM ('WORKING', 'SICK_LEAVE', 'DAY_OFF', 'HOLIDAY', 'INTER_VISA', 'NO_SCHEDULE', 'ABSENT', 'DAY_OFF_PERSONAL_REASON', 'WEEKEND', 'ACCIDENT', 'NOT_WORKING_BUT_PAID');

-- CreateEnum
CREATE TYPE "AttendanceDoneBy" AS ENUM ('ADMIN', 'MANAGER', 'LEADER');

-- DropForeignKey
ALTER TABLE "GroupAttendance" DROP CONSTRAINT "GroupAttendance_combinationId_fkey";

-- DropForeignKey
ALTER TABLE "GroupAttendance" DROP CONSTRAINT "GroupAttendance_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupAttendance" DROP CONSTRAINT "GroupAttendance_leaderId_fkey";

-- DropForeignKey
ALTER TABLE "GroupAttendance" DROP CONSTRAINT "GroupAttendance_managerId_fkey";

-- DropForeignKey
ALTER TABLE "WorkerAttendance" DROP CONSTRAINT "WorkerAttendance_attendanceId_fkey";

-- AlterTable
ALTER TABLE "WorkerAttendance" DROP COLUMN "attendanceId",
DROP COLUMN "containersFilled",
DROP COLUMN "endTime",
DROP COLUMN "hoursWorked",
DROP COLUMN "startTime",
ADD COLUMN     "attendanceAdministratorName" TEXT,
ADD COLUMN     "attendanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "attendanceDoneBy" "AttendanceDoneBy" NOT NULL DEFAULT 'ADMIN',
ADD COLUMN     "breakTimeAmount" DOUBLE PRECISION,
ADD COLUMN     "breakTimeInMinutes" DOUBLE PRECISION,
ADD COLUMN     "combinationId" TEXT NOT NULL,
ADD COLUMN     "endTimeInMinutes" DOUBLE PRECISION DEFAULT 1020,
ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "isBreakTimePaid" BOOLEAN DEFAULT false,
ADD COLUMN     "issues" TEXT[],
ADD COLUMN     "leaderId" TEXT,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "startTimeInMinutes" DOUBLE PRECISION DEFAULT 480,
ADD COLUMN     "status" "WorkerAttendanceStatus" NOT NULL,
ADD COLUMN     "totalContainersFilled" DOUBLE PRECISION,
ADD COLUMN     "totalHoursWorked" DOUBLE PRECISION,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "totalWage" DROP NOT NULL;

-- DropTable
DROP TABLE "GroupAttendance";

-- CreateTable
CREATE TABLE "WorkingSchedule" (
    "id" TEXT NOT NULL,
    "source" "WorkingScheduleSource" NOT NULL DEFAULT 'ORGANIZATION',
    "numberOfTotalHoursPerDay" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "numberOfTotalDaysPerWeek" DOUBLE PRECISION NOT NULL DEFAULT 6,
    "numberOfTotalDaysPerMonth" DOUBLE PRECISION NOT NULL,
    "startTimeInMinutes" DOUBLE PRECISION NOT NULL DEFAULT 480,
    "endTimeInMinutes" DOUBLE PRECISION NOT NULL DEFAULT 1020,
    "breakTimeInMinutes" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "isBreakTimePaid" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkingSchedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkingSchedule" ADD CONSTRAINT "WorkingSchedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingSchedule" ADD CONSTRAINT "WorkingSchedule_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingSchedule" ADD CONSTRAINT "WorkingSchedule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingSchedule" ADD CONSTRAINT "WorkingSchedule_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendance" ADD CONSTRAINT "WorkerAttendance_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "ClientPricingCombination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendance" ADD CONSTRAINT "WorkerAttendance_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendance" ADD CONSTRAINT "WorkerAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendance" ADD CONSTRAINT "WorkerAttendance_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendance" ADD CONSTRAINT "WorkerAttendance_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "GroupMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
