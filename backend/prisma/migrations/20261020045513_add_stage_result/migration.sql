-- CreateTable
CREATE TABLE `StageResult` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` INTEGER NOT NULL,
    `stage` VARCHAR(191) NOT NULL,
    `output` JSON NOT NULL,
    `inputTokens` INTEGER NOT NULL DEFAULT 0,
    `outputTokens` INTEGER NOT NULL DEFAULT 0,
    `latencyMs` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL,
    `error` TEXT NULL,
    `provider` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StageResult_sessionId_stage_idx`(`sessionId`, `stage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StageResult` ADD CONSTRAINT `StageResult_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `PromptSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
