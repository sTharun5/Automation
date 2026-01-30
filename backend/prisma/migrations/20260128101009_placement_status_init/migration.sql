/*
  Warnings:

  - You are about to drop the `placement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `od` DROP FOREIGN KEY `OD_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `placement` DROP FOREIGN KEY `Placement_rollNo_fkey`;

-- AlterTable
ALTER TABLE `placement_status` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- DropTable
DROP TABLE `placement`;

-- AddForeignKey
ALTER TABLE `od` ADD CONSTRAINT `od_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `event` RENAME INDEX `Event_eventId_key` TO `event_eventId_key`;

-- RenameIndex
ALTER TABLE `od` RENAME INDEX `OD_eventId_fkey` TO `od_eventId_idx`;

-- RenameIndex
ALTER TABLE `od` RENAME INDEX `OD_trackerId_key` TO `od_trackerId_key`;

-- RenameIndex
ALTER TABLE `student` RENAME INDEX `Student_email_key` TO `student_email_key`;

-- RenameIndex
ALTER TABLE `student` RENAME INDEX `Student_rollNo_key` TO `student_rollNo_key`;
