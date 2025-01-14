-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "accountantPhone" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "businessGovId" TEXT,
ADD COLUMN     "cityId" TEXT,
ADD COLUMN     "fax" TEXT,
ADD COLUMN     "licenseExpiry" TIMESTAMP(3),
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "nameEnglish" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "openingDate" TIMESTAMP(3),
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "secondaryPhone" TEXT,
ADD COLUMN     "serialNumber" SERIAL NOT NULL,
ADD COLUMN     "status" "ClientStatus";

-- AlterTable
ALTER TABLE "Worker" ADD COLUMN     "cityId" TEXT,
ADD COLUMN     "countryId" TEXT;

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "nameInHebrew" TEXT NOT NULL,
    "nameInEnglish" TEXT,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "cityCode" TEXT NOT NULL,
    "nameInHebrew" TEXT NOT NULL,
    "nameInEnglish" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
