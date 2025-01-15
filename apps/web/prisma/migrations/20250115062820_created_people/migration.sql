-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "creatorUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
