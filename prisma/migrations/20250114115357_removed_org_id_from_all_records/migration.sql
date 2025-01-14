/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Worker` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Worker" DROP CONSTRAINT "Worker_organizationId_fkey";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Worker" DROP COLUMN "organizationId";
