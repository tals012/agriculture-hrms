/*
  Warnings:

  - You are about to drop the column `documentCategoryId` on the `WorkerDigitalFormTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `documentCategoryId` on the `WorkerDocument` table. All the data in the column will be lost.
  - You are about to drop the `DocumentCategoryWorker` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WorkerDigitalFormTemplate" DROP CONSTRAINT "WorkerDigitalFormTemplate_documentCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "WorkerDocument" DROP CONSTRAINT "WorkerDocument_documentCategoryId_fkey";

-- AlterTable
ALTER TABLE "WorkerDigitalFormTemplate" DROP COLUMN "documentCategoryId",
ADD COLUMN     "templateCategoryId" TEXT;

-- AlterTable
ALTER TABLE "WorkerDocument" DROP COLUMN "documentCategoryId",
ADD COLUMN     "templateCategoryId" TEXT;

-- DropTable
DROP TABLE "DocumentCategoryWorker";

-- CreateTable
CREATE TABLE "WorkerTemplateCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerTemplateCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkerDocument" ADD CONSTRAINT "WorkerDocument_templateCategoryId_fkey" FOREIGN KEY ("templateCategoryId") REFERENCES "WorkerTemplateCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDigitalFormTemplate" ADD CONSTRAINT "WorkerDigitalFormTemplate_templateCategoryId_fkey" FOREIGN KEY ("templateCategoryId") REFERENCES "WorkerTemplateCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
