-- CreateTable
CREATE TABLE `Experiment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `judgeProvider` VARCHAR(191) NOT NULL,
    `testSetVersion` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Experiment_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExperimentItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `experimentId` INTEGER NOT NULL,
    `testPromptId` VARCHAR(191) NOT NULL,
    `intent` VARCHAR(191) NOT NULL,
    `tag` VARCHAR(191) NOT NULL,
    `sessionId` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL,
    `error` TEXT NULL,
    `durationMs` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ExperimentItem_sessionId_idx`(`sessionId`),
    UNIQUE INDEX `ExperimentItem_experimentId_testPromptId_key`(`experimentId`, `testPromptId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HumanRating` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` INTEGER NOT NULL,
    `rater` VARCHAR(191) NOT NULL DEFAULT 'me',
    `scoreOriginal` DOUBLE NOT NULL,
    `scoreOptimized` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `HumanRating_sessionId_rater_key`(`sessionId`, `rater`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ExperimentItem` ADD CONSTRAINT `ExperimentItem_experimentId_fkey` FOREIGN KEY (`experimentId`) REFERENCES `Experiment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExperimentItem` ADD CONSTRAINT `ExperimentItem_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `PromptSession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HumanRating` ADD CONSTRAINT `HumanRating_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `PromptSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
