-- Signing tokens were readable through the case API until 2026-10-16 (#60).
-- Replace every token that can still be used to sign. Fully signed contracts
-- keep theirs so recipients' saved PDF links keep working.
UPDATE "Contract"
SET "signingToken" = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
WHERE "signingStatus" <> 'FULLY_SIGNED' AND "signingToken" IS NOT NULL;
