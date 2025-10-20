-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CV', 'PROJECT_REPORT', 'JOB_DESCRIPTION', 'CASE_STUDY', 'CV_RUBRIC', 'PROJECT_RUBRIC');

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);
