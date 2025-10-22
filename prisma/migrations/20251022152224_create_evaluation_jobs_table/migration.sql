-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "cvMatchRate" DOUBLE PRECISION NOT NULL,
    "cvFeedback" TEXT NOT NULL,
    "projectScore" DOUBLE PRECISION NOT NULL,
    "projectFeedback" TEXT NOT NULL,
    "overallSummary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_jobs" (
    "id" TEXT NOT NULL,
    "status" "EvaluationStatus" NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "cvDocumentId" TEXT NOT NULL,
    "reportDocumentId" TEXT NOT NULL,
    "resultId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_jobs_resultId_key" ON "evaluation_jobs"("resultId");

-- AddForeignKey
ALTER TABLE "evaluation_jobs" ADD CONSTRAINT "evaluation_jobs_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "results"("id") ON DELETE SET NULL ON UPDATE CASCADE;
