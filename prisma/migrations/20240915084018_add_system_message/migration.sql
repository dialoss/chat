/*
  Warnings:

  - You are about to drop the `MessageReadStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MessageReadStatus" DROP CONSTRAINT "MessageReadStatus_messageId_fkey";

-- DropForeignKey
ALTER TABLE "MessageReadStatus" DROP CONSTRAINT "MessageReadStatus_userId_fkey";

-- AlterTable
ALTER TABLE "UserRoom" ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "MessageReadStatus";
