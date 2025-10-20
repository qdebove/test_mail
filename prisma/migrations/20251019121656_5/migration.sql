/*
  Warnings:

  - You are about to drop the column `address_approx` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "address_approx",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "address_complement" TEXT,
ADD COLUMN     "zip_code" TEXT;
