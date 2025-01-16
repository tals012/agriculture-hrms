/*
  Warnings:

  - The primary key for the `Client` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Group` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Manager` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Worker` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_GroupToWorker` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Field" DROP CONSTRAINT "Field_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_supervisorId_fkey";

-- DropForeignKey
ALTER TABLE "HarvestEntry" DROP CONSTRAINT "HarvestEntry_workerId_fkey";

-- DropForeignKey
ALTER TABLE "Manager" DROP CONSTRAINT "Manager_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Worker" DROP CONSTRAINT "Worker_clientId_fkey";

-- DropForeignKey
ALTER TABLE "_GroupToWorker" DROP CONSTRAINT "_GroupToWorker_A_fkey";

-- DropForeignKey
ALTER TABLE "_GroupToWorker" DROP CONSTRAINT "_GroupToWorker_B_fkey";

-- AlterTable
ALTER TABLE "Client" DROP CONSTRAINT "Client_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Client_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Client_id_seq";

-- AlterTable
ALTER TABLE "Field" ALTER COLUMN "clientId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Group" DROP CONSTRAINT "Group_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "supervisorId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Group_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Group_id_seq";

-- AlterTable
ALTER TABLE "HarvestEntry" ALTER COLUMN "workerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Manager" DROP CONSTRAINT "Manager_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Manager_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Manager_id_seq";

-- AlterTable
ALTER TABLE "Worker" DROP CONSTRAINT "Worker_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "clientId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Worker_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Worker_id_seq";

-- AlterTable
ALTER TABLE "_GroupToWorker" DROP CONSTRAINT "_GroupToWorker_AB_pkey",
ALTER COLUMN "A" SET DATA TYPE TEXT,
ALTER COLUMN "B" SET DATA TYPE TEXT,
ADD CONSTRAINT "_GroupToWorker_AB_pkey" PRIMARY KEY ("A", "B");

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestEntry" ADD CONSTRAINT "HarvestEntry_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manager" ADD CONSTRAINT "Manager_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Manager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToWorker" ADD CONSTRAINT "_GroupToWorker_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToWorker" ADD CONSTRAINT "_GroupToWorker_B_fkey" FOREIGN KEY ("B") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
