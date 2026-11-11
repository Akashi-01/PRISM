-- CreateTable
CREATE TABLE `ResponseEvaluation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` INTEGER NOT NULL,
    `runNumber` INTEGER NOT NULL,
    `variant` VARCHAR(191) NOT NULL,
    `promptText` TEXT NOT NULL,
    `responseText` LONGTEXT NOT NULL,
    `genInputTokens` INTEGER NOT NULL DEFAULT 0,
    `genOutputTokens` INTEGER NOT NULL DEFAULT 0,
    `genLatencyMs` INTEGER NOT NULL DEFAULT 0,
    `genProvider` VARCHAR(191) NOT NULL,
    `genModel` VARCHAR(191) NOT NULL,
    `judgeProvider` VARCHAR(191) NOT NULL,
    `judgeModel` VARCHAR(191) NOT NULL,
    `relevance` INTEGER NOT NULL,
    `completeness` INTEGER NOT NULL,
    `instructionFollowing` INTEGER NOT NULL,
    `formatCorrectness` INTEGER NOT NULL,
    `overallScore` DOUBLE NOT NULL,
    `judgeRationale` TEXT NOT NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ResponseEvaluation_sessionId_isCurrent_idx`(`sessionId`, `isCurrent`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvaluationSummary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` INTEGER NOT NULL,
    `runNumber` INTEGER NOT NULL,
    `qualityOriginal` DOUBLE NOT NULL,
    `qualityOptimized` DOUBLE NOT NULL,
    `qualityDelta` DOUBLE NOT NULL,
    `qualityRetentionPct` DOUBLE NOT NULL,
    `tokensSavedPct` DOUBLE NOT NULL,
    `hasClarifications` BOOLEAN NOT NULL DEFAULT false,
    `isCurrent` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EvaluationSummary_sessionId_isCurrent_idx`(`sessionId`, `isCurrent`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ResponseEvaluation` ADD CONSTRAINT `ResponseEvaluation_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `PromptSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationSummary` ADD CONSTRAINT `EvaluationSummary_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `PromptSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
