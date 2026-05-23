-- CreateTable
CREATE TABLE "Dashboard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL DEFAULT 'default',
    "layout" TEXT NOT NULL DEFAULT '[]',
    "widgets" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL
);
