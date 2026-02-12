/*
  Warnings:

  - A unique constraint covering the columns `[facultyId]` on the table `faculty` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `facultyId` to the `faculty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `faculty` ADD COLUMN `facultyId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `faculty_facultyId_key` ON `faculty`(`facultyId`);
