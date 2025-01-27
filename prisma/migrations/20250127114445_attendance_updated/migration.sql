-- AlterTable
ALTER TABLE "WorkerAttendance" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "hoursWorked" DOUBLE PRECISION,
ADD COLUMN     "startTime" TIMESTAMP(3);
