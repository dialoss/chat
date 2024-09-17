/*
  Warnings:

  - A unique constraint covering the columns `[latestMessageId]` on the table `Room` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "latestMessageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Room_latestMessageId_key" ON "Room"("latestMessageId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_latestMessageId_fkey" FOREIGN KEY ("latestMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
