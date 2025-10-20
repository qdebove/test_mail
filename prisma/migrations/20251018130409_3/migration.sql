-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address_approx" TEXT;

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "address_snapshot" TEXT,
ADD COLUMN     "contribution_note" TEXT,
ADD COLUMN     "contribution_type" "contribution_type" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "owner_id" TEXT,
ADD COLUMN     "visibility" "visibility" NOT NULL DEFAULT 'PUBLIC';

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
