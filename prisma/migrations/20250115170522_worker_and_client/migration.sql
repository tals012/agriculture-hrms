/*
  Warnings:

  - You are about to drop the column `licenseExpiry` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Worker` table. All the data in the column will be lost.
  - You are about to drop the column `workerNumber` on the `Worker` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'FREEZE', 'COMMITTEE', 'HIDDEN', 'IN_TRANSIT', 'ALL');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- DropIndex
DROP INDEX "Worker_email_key";

-- DropIndex
DROP INDEX "Worker_workerNumber_key";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "licenseExpiry",
ADD COLUMN     "licenseExist" BOOLEAN,
ADD COLUMN     "licenseFromDate" TIMESTAMP(3),
ADD COLUMN     "licenseToDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Worker" DROP COLUMN "phone",
DROP COLUMN "workerNumber",
ADD COLUMN     "additionalLanguages" TEXT[],
ADD COLUMN     "address" TEXT,
ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "company" TEXT,
ADD COLUMN     "countryArea" TEXT,
ADD COLUMN     "entryDate" TIMESTAMP(3),
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "favoritePlace" TEXT,
ADD COLUMN     "favoriteSex" TEXT,
ADD COLUMN     "inscriptionDate" TIMESTAMP(3),
ADD COLUMN     "maritalStatus" "MaritalStatus",
ADD COLUMN     "metapelCode" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "nameHe" TEXT,
ADD COLUMN     "nameSpouse" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "partnerPlace" TEXT,
ADD COLUMN     "passport" TEXT,
ADD COLUMN     "passportValidity" TIMESTAMP(3),
ADD COLUMN     "primaryLanguage" TEXT,
ADD COLUMN     "primaryLanguages" TEXT[],
ADD COLUMN     "primaryPhone" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "secondaryLanguage" TEXT,
ADD COLUMN     "secondaryLanguages" TEXT[],
ADD COLUMN     "secondaryPhone" TEXT,
ADD COLUMN     "sex" "Gender",
ADD COLUMN     "surname" TEXT,
ADD COLUMN     "surnameHe" TEXT,
ADD COLUMN     "visa" TEXT,
ADD COLUMN     "visaValidity" TIMESTAMP(3),
ADD COLUMN     "workerCode" TEXT,
ADD COLUMN     "workerStatus" "WorkerStatus" DEFAULT 'ACTIVE',
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;
