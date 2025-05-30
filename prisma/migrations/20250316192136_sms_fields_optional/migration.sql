-- DropForeignKey
ALTER TABLE "SMS" DROP CONSTRAINT "SMS_clientId_fkey";

-- DropForeignKey
ALTER TABLE "SMS" DROP CONSTRAINT "SMS_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "SMS" DROP CONSTRAINT "SMS_workerId_fkey";

-- AlterTable
ALTER TABLE "SMS" ALTER COLUMN "organizationId" DROP NOT NULL,
ALTER COLUMN "clientId" DROP NOT NULL,
ALTER COLUMN "workerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SMS" ADD CONSTRAINT "SMS_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMS" ADD CONSTRAINT "SMS_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMS" ADD CONSTRAINT "SMS_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
