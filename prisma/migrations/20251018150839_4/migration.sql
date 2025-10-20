/*
  Warnings:

  - Changed the type of `category` on the `games` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "game_category" AS ENUM ('ABSTRACT', 'ADVENTURE', 'AREA_CONTROL', 'CARD_GAME', 'COOPERATIVE', 'DEDUCTION', 'DICE', 'ENGINE_BUILDING', 'FAMILY', 'PARTY', 'PUSH_YOUR_LUCK', 'ROLL_AND_WRITE', 'SET_COLLECTION', 'SOCIAL_DEDUCTION', 'STRATEGY', 'THEMATIC', 'TILE_PLACEMENT', 'WAR', 'WORKER_PLACEMENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "admin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "board_game_id" TEXT,
DROP COLUMN "category",
ADD COLUMN     "category" "game_category" NOT NULL;

-- CreateTable
CREATE TABLE "board_games" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "game_category" NOT NULL,
    "description" TEXT,
    "publisher" TEXT,
    "yearPublished" INTEGER,
    "minPlayers" INTEGER NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "playTimeMin" INTEGER NOT NULL,
    "complexity" DOUBLE PRECISION,
    "thumbnail_url" TEXT,
    "bgg_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "curator_id" TEXT,

    CONSTRAINT "board_games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "board_games_bgg_id_key" ON "board_games"("bgg_id");

-- CreateIndex
CREATE UNIQUE INDEX "board_games_name_key" ON "board_games"("name");

-- AddForeignKey
ALTER TABLE "board_games" ADD CONSTRAINT "board_games_curator_id_fkey" FOREIGN KEY ("curator_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_board_game_id_fkey" FOREIGN KEY ("board_game_id") REFERENCES "board_games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
