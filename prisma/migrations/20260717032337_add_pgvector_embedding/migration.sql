-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "embedding" vector(768);
