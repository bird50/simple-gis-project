-- Additive migration for an existing ThaiWater schema. No existing data is changed.
CREATE TABLE "PhotoShare" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerId" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "SharedPhoto" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shareId" TEXT NOT NULL REFERENCES "PhotoShare"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "image" BYTEA NOT NULL,
  "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
  "longitude" DOUBLE PRECISION NOT NULL CHECK ("longitude" BETWEEN -180 AND 180),
  "latitude" DOUBLE PRECISION NOT NULL CHECK ("latitude" BETWEEN -90 AND 90),
  "capturedAt" TEXT NOT NULL,
  "capturedOffset" TEXT,
  "sortOrder" INTEGER NOT NULL
);
CREATE INDEX "PhotoShare_ownerId_createdAt_idx" ON "PhotoShare"("ownerId", "createdAt");
CREATE INDEX "SharedPhoto_shareId_sortOrder_idx" ON "SharedPhoto"("shareId", "sortOrder");
