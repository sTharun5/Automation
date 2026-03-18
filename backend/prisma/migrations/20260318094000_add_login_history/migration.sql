-- CreateTable
CREATE TABLE "public"."loginhistory" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "deviceName" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loginhistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loginhistory_email_idx" ON "public"."loginhistory"("email");

-- CreateIndex
CREATE INDEX "loginhistory_createdAt_idx" ON "public"."loginhistory"("createdAt");
