/*
  Warnings:

  - The primary key for the `characters` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "character_images" DROP CONSTRAINT "character_images_characterId_fkey";

-- DropForeignKey
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_characterId_fkey";

-- DropForeignKey
ALTER TABLE "interactions" DROP CONSTRAINT "interactions_characterId_fkey";

-- AlterTable
ALTER TABLE "character_images" ALTER COLUMN "characterId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "characters" DROP CONSTRAINT "characters_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "realName" SET DATA TYPE TEXT,
ALTER COLUMN "visibility" SET DATA TYPE TEXT,
ALTER COLUMN "category" SET DATA TYPE TEXT,
ADD CONSTRAINT "characters_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "characters_id_seq";

-- AlterTable
ALTER TABLE "favorites" ALTER COLUMN "characterId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "interactions" ALTER COLUMN "characterId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "character_images" ADD CONSTRAINT "character_images_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
