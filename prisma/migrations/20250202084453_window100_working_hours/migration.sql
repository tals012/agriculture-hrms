-- AlterTable
ALTER TABLE "WorkerAttendance" ADD COLUMN     "totalHoursWorkedWindow100" DOUBLE PRECISION,
ADD COLUMN     "totalHoursWorkedWindow125" DOUBLE PRECISION,
ADD COLUMN     "totalHoursWorkedWindow150" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "WorkingSchedule" ADD COLUMN     "numberOfTotalHoursPerDayWindow100" DOUBLE PRECISION,
ADD COLUMN     "numberOfTotalHoursPerDayWindow125" DOUBLE PRECISION,
ADD COLUMN     "numberOfTotalHoursPerDayWindow150" DOUBLE PRECISION;
