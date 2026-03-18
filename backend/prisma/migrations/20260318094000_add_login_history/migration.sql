-- CreateTable
CREATE TABLE "public"."LoginHistory" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "deviceName" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginHistory_email_idx" ON "public"."LoginHistory"("email");

-- CreateIndex
CREATE INDEX "LoginHistory_createdAt_idx" ON "public"."LoginHistory"("createdAt");
