/*
  Warnings:

  - You are about to drop the column `country` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Organization` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "country",
DROP COLUMN "state";
