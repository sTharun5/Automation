-- Single active session per account (role + userId).
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS "activesession" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "role" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "activesession_userId_role_key"
  ON "activesession" ("userId", "role");

CREATE INDEX IF NOT EXISTS "activesession_sessionId_idx"
  ON "activesession" ("sessionId");

