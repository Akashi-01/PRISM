-- DropForeignKey
ALTER TABLE `stageresult` DROP FOREIGN KEY `StageResult_sessionId_fkey`;

-- DropIndex
DROP INDEX `StageResult_sessionId_stage_idx` ON `stageresult`;

-- AlterTable
ALTER TABLE `promptsession` ADD COLUMN `clarifications` JSON NULL,
    ADD COLUMN `currentRun` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `stageresult` ADD COLUMN `isCurrent` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `runNumber` INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX `StageResult_sessionId_stage_isCurrent_idx` ON `StageResult`(`sessionId`, `stage`, `isCurrent`);

-- AddForeignKey
ALTER TABLE `StageResult` ADD CONSTRAINT `StageResult_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `PromptSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
