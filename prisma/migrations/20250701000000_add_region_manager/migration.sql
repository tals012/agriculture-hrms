-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'REGION_MANAGER';

-- CreateTable
CREATE TABLE "RegionManager" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "userId" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionManager_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegionManager_email_key" ON "RegionManager"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RegionManager_userId_key" ON "RegionManager"("userId");

-- AlterTable
ALTER TABLE "Field" ADD COLUMN     "regionManagerId" TEXT;

-- AlterTable
ALTER TABLE "SMS" ADD COLUMN     "regionManagerId" TEXT;

-- AddForeignKey
ALTER TABLE "RegionManager" ADD CONSTRAINT "RegionManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionManager" ADD CONSTRAINT "RegionManager_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_regionManagerId_fkey" FOREIGN KEY ("regionManagerId") REFERENCES "RegionManager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMS" ADD CONSTRAINT "SMS_regionManagerId_fkey" FOREIGN KEY ("regionManagerId") REFERENCES "RegionManager"("id") ON DELETE SET NULL ON UPDATE CASCADE;
