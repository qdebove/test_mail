-- CreateEnum
CREATE TYPE "visibility" AS ENUM ('PUBLIC', 'FRIENDS', 'LINK');

-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('OPEN', 'FULL', 'CANCELLED', 'DONE');

-- CreateEnum
CREATE TYPE "contribution_type" AS ENUM ('NONE', 'MONEY', 'ITEMS');

-- CreateEnum
CREATE TYPE "rsvp_status" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WAITLIST');

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "min_players" INTEGER NOT NULL,
    "max_players" INTEGER NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "thumbnail_url" TEXT,
    "bgg_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "address_approx" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geohash" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "visibility" "visibility" NOT NULL DEFAULT 'PUBLIC',
    "contribution_type" "contribution_type" NOT NULL DEFAULT 'NONE',
    "contribution_note" TEXT,
    "price_cents" INTEGER,
    "status" "session_status" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_session_games" (
    "session_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,

    CONSTRAINT "game_session_games_pkey" PRIMARY KEY ("session_id","game_id")
);

-- CreateTable
CREATE TABLE "favorite_games" (
    "user_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_games_pkey" PRIMARY KEY ("user_id","game_id")
);

-- CreateTable
CREATE TABLE "rsvps" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "rsvp_status" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "will_bring" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "games_name_key" ON "games"("name");

-- CreateIndex
CREATE INDEX "game_sessions_geohash_idx" ON "game_sessions"("geohash");

-- CreateIndex
CREATE INDEX "game_sessions_starts_at_idx" ON "game_sessions"("starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "rsvps_session_user_key" ON "rsvps"("session_id", "user_id");

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_session_games" ADD CONSTRAINT "game_session_games_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_session_games" ADD CONSTRAINT "game_session_games_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_games" ADD CONSTRAINT "favorite_games_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_games" ADD CONSTRAINT "favorite_games_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
