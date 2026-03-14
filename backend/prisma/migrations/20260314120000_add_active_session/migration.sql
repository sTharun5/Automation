-- CreateTable
CREATE TABLE "activesession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activesession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activesession_sessionId_idx" ON "activesession"("sessionId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "activesession_userId_role_key" ON "activesession"("userId", "role");
