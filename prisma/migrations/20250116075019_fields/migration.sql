/*
  Warnings:

  - The primary key for the `Field` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `location` on the `Field` table. All the data in the column will be lost.
  - The primary key for the `Harvest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `HarvestEntry` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "Harvest" DROP CONSTRAINT "Harvest_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "HarvestEntry" DROP CONSTRAINT "HarvestEntry_harvestId_fkey";

-- AlterTable
ALTER TABLE "Field" DROP CONSTRAINT "Field_pkey",
DROP COLUMN "location",
ADD COLUMN     "additionalPhone" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "cityId" TEXT,
ADD COLUMN     "contactPersonName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "fieldCloseTime" DOUBLE PRECISION DEFAULT 1020,
ADD COLUMN     "fieldCode" TEXT,
ADD COLUMN     "fieldOpenTime" DOUBLE PRECISION DEFAULT 480,
ADD COLUMN     "fieldTax" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "serialNumber" SERIAL NOT NULL,
ADD COLUMN     "status" "ProjectStatus" DEFAULT 'ACTIVE',
ADD COLUMN     "withholdingAccountNumber" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DEFAULT '',
ALTER COLUMN "size" DROP NOT NULL,
ADD CONSTRAINT "Field_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Field_id_seq";

-- AlterTable
ALTER TABLE "Harvest" DROP CONSTRAINT "Harvest_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "fieldId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Harvest_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Harvest_id_seq";

-- AlterTable
ALTER TABLE "HarvestEntry" DROP CONSTRAINT "HarvestEntry_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "harvestId" SET DATA TYPE TEXT,
ADD CONSTRAINT "HarvestEntry_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "HarvestEntry_id_seq";

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Harvest" ADD CONSTRAINT "Harvest_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestEntry" ADD CONSTRAINT "HarvestEntry_harvestId_fkey" FOREIGN KEY ("harvestId") REFERENCES "Harvest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
