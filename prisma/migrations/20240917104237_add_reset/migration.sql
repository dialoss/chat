-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('GOOGLE', 'GITHUB', 'YANDEX');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;
