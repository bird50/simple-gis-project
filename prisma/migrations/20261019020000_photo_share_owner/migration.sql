-- Link the existing owner ID to users for server-side public username filtering.
ALTER TABLE "PhotoShare" ADD CONSTRAINT "PhotoShare_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
