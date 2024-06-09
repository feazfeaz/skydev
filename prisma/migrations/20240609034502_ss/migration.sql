/*
  Warnings:

  - You are about to drop the `folderPath` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "folderPath";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "FolderPath" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "path" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "FolderPath_path_key" ON "FolderPath"("path");
