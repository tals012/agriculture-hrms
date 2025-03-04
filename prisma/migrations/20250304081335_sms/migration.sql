-- CreateEnum
CREATE TYPE "SMSSentBy" AS ENUM ('WORKER', 'CLIENT', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "SMSSentTo" AS ENUM ('WORKER', 'CLIENT', 'ORGANIZATION');

-- CreateTable
CREATE TABLE "SMS" (
    "id" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "message" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "sentBy" "SMSSentBy",
    "sentTo" "SMSSentTo",
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMS_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SMS" ADD CONSTRAINT "SMS_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMS" ADD CONSTRAINT "SMS_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMS" ADD CONSTRAINT "SMS_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
