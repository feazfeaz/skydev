/*
  Warnings:

  - You are about to drop the column `status` on the `MediaFile` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "folderPath" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "path" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MediaFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "isPriority" BOOLEAN NOT NULL,
    "rootPath" TEXT NOT NULL,
    "usecasePath" TEXT NOT NULL,
    "durationSecond" INTEGER NOT NULL,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MediaFile" ("createdAt", "durationSecond", "fileName", "fileType", "id", "isPriority", "isReady", "rootPath", "updatedAt", "usecasePath") SELECT "createdAt", "durationSecond", "fileName", "fileType", "id", "isPriority", "isReady", "rootPath", "updatedAt", "usecasePath" FROM "MediaFile";
DROP TABLE "MediaFile";
ALTER TABLE "new_MediaFile" RENAME TO "MediaFile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "folderPath_path_key" ON "folderPath"("path");
