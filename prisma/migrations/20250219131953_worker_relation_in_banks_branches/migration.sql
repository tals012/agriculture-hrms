-- DropForeignKey
ALTER TABLE "Branch" DROP CONSTRAINT "Branch_bankId_fkey";

-- AlterTable
ALTER TABLE "Branch" ALTER COLUMN "bankId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
