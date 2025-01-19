/*
  Warnings:

  - You are about to drop the column `supervisorId` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `Worker` table. All the data in the column will be lost.
  - Added the required column `fieldId` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `managerId` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productType` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_supervisorId_fkey";

-- DropForeignKey
ALTER TABLE "Worker" DROP CONSTRAINT "Worker_clientId_fkey";

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "supervisorId",
ADD COLUMN     "fieldId" TEXT NOT NULL,
ADD COLUMN     "managerId" TEXT NOT NULL,
ADD COLUMN     "productType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Worker" DROP COLUMN "clientId",
ADD COLUMN     "currentClientId" TEXT;

-- CreateTable
CREATE TABLE "WorkerClientHistory" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "WorkerClientHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkerClientHistory_workerId_idx" ON "WorkerClientHistory"("workerId");

-- CreateIndex
CREATE INDEX "WorkerClientHistory_clientId_idx" ON "WorkerClientHistory"("clientId");

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_currentClientId_fkey" FOREIGN KEY ("currentClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerClientHistory" ADD CONSTRAINT "WorkerClientHistory_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerClientHistory" ADD CONSTRAINT "WorkerClientHistory_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
