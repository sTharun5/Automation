-- CreateTable
CREATE TABLE `placement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rollNo` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `placement_rollNo_key`(`rollNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `placement` ADD CONSTRAINT `placement_rollNo_fkey` FOREIGN KEY (`rollNo`) REFERENCES `student`(`rollNo`) ON DELETE RESTRICT ON UPDATE CASCADE;
