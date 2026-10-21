-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "highlights" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "format" TEXT NOT NULL DEFAULT 'v',
    "accent" TEXT NOT NULL DEFAULT '#ff6b35',
    "script" JSONB,
    "photoPaths" TEXT[],
    "videoPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");
