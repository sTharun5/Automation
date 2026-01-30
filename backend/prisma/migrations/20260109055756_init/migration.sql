-- CreateTable
CREATE TABLE `Student` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rollNo` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `semester` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Student_rollNo_key`(`rollNo`),
    UNIQUE INDEX `Student_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Placement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rollNo` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Placement_rollNo_key`(`rollNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',

    UNIQUE INDEX `Event_eventId_key`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OD` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trackerId` VARCHAR(191) NOT NULL,
    `type` ENUM('INTERNAL', 'INTERNSHIP') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `duration` INTEGER NOT NULL,
    `proofFile` VARCHAR(191) NULL,
    `studentId` INTEGER NOT NULL,
    `eventId` INTEGER NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OD_trackerId_key`(`trackerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Placement` ADD CONSTRAINT `Placement_rollNo_fkey` FOREIGN KEY (`rollNo`) REFERENCES `Student`(`rollNo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OD` ADD CONSTRAINT `OD_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OD` ADD CONSTRAINT `OD_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
