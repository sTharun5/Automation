-- DropForeignKey
ALTER TABLE `od` DROP FOREIGN KEY `OD_studentId_fkey`;

-- AlterTable
ALTER TABLE `od` ADD COLUMN `offerFile` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `faculty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `faculty_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `placement_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `status` ENUM('PLACED', 'YET_TO_BE_PLACED', 'NIP') NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `placedDate` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `placement_status_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `emailotp_email_idx` ON `emailotp`(`email`);

-- AddForeignKey
ALTER TABLE `od` ADD CONSTRAINT `od_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `placement_status` ADD CONSTRAINT `placement_status_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `od` RENAME INDEX `OD_studentId_fkey` TO `od_studentId_idx`;
