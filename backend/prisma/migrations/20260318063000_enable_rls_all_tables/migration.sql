-- Enable Row Level Security on all public tables.
-- Resolves Supabase security advisory:
--   "Detects cases where row level security (RLS) has not been enabled on
--    tables in schemas exposed to PostgREST"
--
-- WHY this is safe:
--   Prisma connects with the Supabase `service_role` key which BYPASSES RLS
--   entirely. All backend operations continue to work exactly as before.
--
-- WHAT this blocks:
--   Any direct PostgREST / REST API access by `anon` or `authenticated` JWT
--   clients. No permissive policies are added — default deny-all applies.

ALTER TABLE "public"."company"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."od"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."admin"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."faculty"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notification"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CalendarEvent"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."InternshipReport"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."offer"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."activesession"     ENABLE ROW LEVEL SECURITY;
