-- Bounded viewport queries use the stored numeric WGS84 coordinates.
CREATE INDEX "SharedPhoto_latitude_longitude_idx" ON "SharedPhoto"("latitude", "longitude");
