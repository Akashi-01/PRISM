-- CreateTable
CREATE TABLE `PromptSession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rawPrompt` TEXT NOT NULL,
    `optimizedPrompt` TEXT NULL,
    `analysis` JSON NULL,
    `tokensBefore` INTEGER NULL,
    `tokensAfter` INTEGER NULL,
    `percentSaved` DOUBLE NULL,
    `model` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
