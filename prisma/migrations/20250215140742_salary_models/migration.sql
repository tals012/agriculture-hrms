/*
  Warnings:

  - A unique constraint covering the columns `[workerId,monthYear]` on the table `WorkerMonthlyWorkingHoursSubmission` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "WorkerMonthlyWorkingHoursSubmission" ADD COLUMN     "absentDays" INTEGER,
ADD COLUMN     "accidentDays" INTEGER,
ADD COLUMN     "attendancePercentage" DOUBLE PRECISION,
ADD COLUMN     "containersWindow100" DOUBLE PRECISION,
ADD COLUMN     "containersWindow125" DOUBLE PRECISION,
ADD COLUMN     "containersWindow150" DOUBLE PRECISION,
ADD COLUMN     "dayOffDays" INTEGER,
ADD COLUMN     "holidayDays" INTEGER,
ADD COLUMN     "interVisaDays" INTEGER,
ADD COLUMN     "personalDays" INTEGER,
ADD COLUMN     "sickDays" INTEGER,
ADD COLUMN     "totalBaseSalary" DOUBLE PRECISION,
ADD COLUMN     "totalContainersFilled" DOUBLE PRECISION,
ADD COLUMN     "totalDaysInMonth" INTEGER,
ADD COLUMN     "workingDays" INTEGER;

-- CreateTable
CREATE TABLE "WorkerDailySalaryCalculation" (
    "id" TEXT NOT NULL,
    "calculationDate" TIMESTAMP(3) NOT NULL,
    "containersFilled" DOUBLE PRECISION NOT NULL,
    "containerNorm" DOUBLE PRECISION NOT NULL,
    "pricePerNorm" DOUBLE PRECISION NOT NULL,
    "containersWindow100" DOUBLE PRECISION NOT NULL,
    "containersWindow125" DOUBLE PRECISION NOT NULL,
    "containersWindow150" DOUBLE PRECISION NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "totalBonus" DOUBLE PRECISION NOT NULL,
    "status" "WorkerAttendanceStatus" NOT NULL,
    "workerId" TEXT NOT NULL,
    "monthlySubmissionId" TEXT NOT NULL,
    "attendanceId" TEXT,
    "combinationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerDailySalaryCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkerDailySalaryCalculation_workerId_idx" ON "WorkerDailySalaryCalculation"("workerId");

-- CreateIndex
CREATE INDEX "WorkerDailySalaryCalculation_monthlySubmissionId_idx" ON "WorkerDailySalaryCalculation"("monthlySubmissionId");

-- CreateIndex
CREATE INDEX "WorkerDailySalaryCalculation_calculationDate_idx" ON "WorkerDailySalaryCalculation"("calculationDate");

-- CreateIndex
CREATE INDEX "WorkerDailySalaryCalculation_attendanceId_idx" ON "WorkerDailySalaryCalculation"("attendanceId");

-- CreateIndex
CREATE INDEX "WorkerDailySalaryCalculation_combinationId_idx" ON "WorkerDailySalaryCalculation"("combinationId");

-- CreateIndex
CREATE INDEX "WorkerDailySalaryCalculation_workerId_calculationDate_idx" ON "WorkerDailySalaryCalculation"("workerId", "calculationDate");

-- CreateIndex
CREATE INDEX "WorkerDailySalaryCalculation_monthlySubmissionId_calculatio_idx" ON "WorkerDailySalaryCalculation"("monthlySubmissionId", "calculationDate");

-- CreateIndex
CREATE INDEX "WorkerDailySalaryCalculation_workerId_status_idx" ON "WorkerDailySalaryCalculation"("workerId", "status");

-- CreateIndex
CREATE INDEX "WorkerDailySalaryCalculation_monthlySubmissionId_status_idx" ON "WorkerDailySalaryCalculation"("monthlySubmissionId", "status");

-- CreateIndex
CREATE INDEX "WorkerDailySalaryCalculation_workerId_monthlySubmissionId_idx" ON "WorkerDailySalaryCalculation"("workerId", "monthlySubmissionId");

-- CreateIndex
CREATE INDEX "WorkerDailySalaryCalculation_status_calculationDate_idx" ON "WorkerDailySalaryCalculation"("status", "calculationDate");

-- CreateIndex
CREATE INDEX "WorkerDailySalaryCalculation_workerId_status_calculationDat_idx" ON "WorkerDailySalaryCalculation"("workerId", "status", "calculationDate");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerDailySalaryCalculation_workerId_calculationDate_key" ON "WorkerDailySalaryCalculation"("workerId", "calculationDate");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerDailySalaryCalculation_monthlySubmissionId_calculatio_key" ON "WorkerDailySalaryCalculation"("monthlySubmissionId", "calculationDate");

-- CreateIndex
CREATE INDEX "WorkerMonthlyWorkingHoursSubmission_workerId_monthYear_idx" ON "WorkerMonthlyWorkingHoursSubmission"("workerId", "monthYear");

-- CreateIndex
CREATE INDEX "WorkerMonthlyWorkingHoursSubmission_workerId_firstDayOfMont_idx" ON "WorkerMonthlyWorkingHoursSubmission"("workerId", "firstDayOfMonth");

-- CreateIndex
CREATE INDEX "WorkerMonthlyWorkingHoursSubmission_workerId_approvalStatus_idx" ON "WorkerMonthlyWorkingHoursSubmission"("workerId", "approvalStatus");

-- CreateIndex
CREATE INDEX "WorkerMonthlyWorkingHoursSubmission_monthYear_approvalStatu_idx" ON "WorkerMonthlyWorkingHoursSubmission"("monthYear", "approvalStatus");

-- CreateIndex
CREATE INDEX "WorkerMonthlyWorkingHoursSubmission_firstDayOfMonth_approva_idx" ON "WorkerMonthlyWorkingHoursSubmission"("firstDayOfMonth", "approvalStatus");

-- CreateIndex
CREATE INDEX "WorkerMonthlyWorkingHoursSubmission_workerId_isSentToSalary_idx" ON "WorkerMonthlyWorkingHoursSubmission"("workerId", "isSentToSalarySystem");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerMonthlyWorkingHoursSubmission_workerId_monthYear_key" ON "WorkerMonthlyWorkingHoursSubmission"("workerId", "monthYear");

-- AddForeignKey
ALTER TABLE "WorkerDailySalaryCalculation" ADD CONSTRAINT "WorkerDailySalaryCalculation_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDailySalaryCalculation" ADD CONSTRAINT "WorkerDailySalaryCalculation_monthlySubmissionId_fkey" FOREIGN KEY ("monthlySubmissionId") REFERENCES "WorkerMonthlyWorkingHoursSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDailySalaryCalculation" ADD CONSTRAINT "WorkerDailySalaryCalculation_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "WorkerAttendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDailySalaryCalculation" ADD CONSTRAINT "WorkerDailySalaryCalculation_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "ClientPricingCombination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
