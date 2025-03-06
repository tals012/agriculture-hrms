/*
  Warnings:

  - The `status` column on the `SMS` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SMSStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "SMS" DROP COLUMN "status",
ADD COLUMN     "status" "SMSStatus" NOT NULL DEFAULT 'PENDING';
