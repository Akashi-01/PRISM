-- AlterTable
ALTER TABLE `promptsession` ADD COLUMN `latencyMs` INTEGER NULL,
    ADD COLUMN `tokensSaved` INTEGER NULL;
