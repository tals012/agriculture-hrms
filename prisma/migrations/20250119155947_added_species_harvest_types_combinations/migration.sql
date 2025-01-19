/*
  Warnings:

  - You are about to drop the column `groupName` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `productType` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `schedule` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `harvestType` on the `Harvest` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Harvest` table. All the data in the column will be lost.
  - You are about to drop the column `species` on the `Harvest` table. All the data in the column will be lost.
  - Added the required column `name` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `harvestTypeId` to the `Harvest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `speciesId` to the `Harvest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Group" DROP COLUMN "groupName",
DROP COLUMN "productType",
DROP COLUMN "schedule",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Harvest" DROP COLUMN "harvestType",
DROP COLUMN "price",
DROP COLUMN "species",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "harvestTypeId" TEXT NOT NULL,
ADD COLUMN     "speciesId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Species" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HarvestType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HarvestType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPricingCombination" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "harvestTypeId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "containerNorm" DOUBLE PRECISION,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPricingCombination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClientPricingCombinationToGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClientPricingCombinationToGroup_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ClientPricingCombinationToGroup_B_index" ON "_ClientPricingCombinationToGroup"("B");

-- AddForeignKey
ALTER TABLE "Harvest" ADD CONSTRAINT "Harvest_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Harvest" ADD CONSTRAINT "Harvest_harvestTypeId_fkey" FOREIGN KEY ("harvestTypeId") REFERENCES "HarvestType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestType" ADD CONSTRAINT "HarvestType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPricingCombination" ADD CONSTRAINT "ClientPricingCombination_harvestTypeId_fkey" FOREIGN KEY ("harvestTypeId") REFERENCES "HarvestType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPricingCombination" ADD CONSTRAINT "ClientPricingCombination_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPricingCombination" ADD CONSTRAINT "ClientPricingCombination_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientPricingCombinationToGroup" ADD CONSTRAINT "_ClientPricingCombinationToGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "ClientPricingCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientPricingCombinationToGroup" ADD CONSTRAINT "_ClientPricingCombinationToGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
