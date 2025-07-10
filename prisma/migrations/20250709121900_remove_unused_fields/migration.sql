/*
  Warnings:

  - You are about to drop the column `age` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `realName` on the `characters` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "characters" DROP COLUMN "age",
DROP COLUMN "realName";
