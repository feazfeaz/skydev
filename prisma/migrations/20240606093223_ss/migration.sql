/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "MediaFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "isPriority" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "rootPath" TEXT NOT NULL,
    "usecasePath" TEXT NOT NULL,
    "durationSecond" INTEGER NOT NULL,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
