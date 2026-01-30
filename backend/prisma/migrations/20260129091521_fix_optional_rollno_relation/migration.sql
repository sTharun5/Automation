/*
  Warnings:

  - You are about to drop the column `studentId` on the `placement_status` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rollNo]` on the table `placement_status` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `placement_status` DROP FOREIGN KEY `placement_status_studentId_fkey`;

-- DropIndex
DROP INDEX `placement_status_studentId_key` ON `placement_status`;

-- AlterTable
ALTER TABLE `placement_status` DROP COLUMN `studentId`,
    ADD COLUMN `rollNo` VARCHAR(191) NULL,
    MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX `placement_status_rollNo_key` ON `placement_status`(`rollNo`);

-- AddForeignKey
ALTER TABLE `placement_status` ADD CONSTRAINT `placement_status_rollNo_fkey` FOREIGN KEY (`rollNo`) REFERENCES `student`(`rollNo`) ON DELETE SET NULL ON UPDATE CASCADE;
