-- Add missing performance indexes on frequently filtered columns.
-- These reduce full-table scans on the most common WHERE clauses in the app.

-- od.status is filtered on EVERY student/faculty dashboard query
CREATE INDEX IF NOT EXISTS "od_status_idx" ON "public"."od"("status");

-- od.endDate is used for active/expired OD checks
CREATE INDEX IF NOT EXISTS "od_endDate_idx" ON "public"."od"("endDate");

-- od.startDate is used for upcoming OD checks
CREATE INDEX IF NOT EXISTS "od_startDate_idx" ON "public"."od"("startDate");

-- notification.read is filtered to fetch unread notifications for the bell
CREATE INDEX IF NOT EXISTS "notification_read_idx" ON "public"."notification"("read");

-- emailotp.expiresAt is checked on every OTP verification
CREATE INDEX IF NOT EXISTS "emailotp_expiresAt_idx" ON "public"."emailotp"("expiresAt");
