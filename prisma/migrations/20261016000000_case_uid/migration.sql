-- Cases get an owner uid (same identity as Contract.uid).
ALTER TABLE "Case" ADD COLUMN "uid" TEXT;

-- Backfill: a case inherits its owner only when every linked contract has the
-- same non-null uid. Cases with no or mixed-owner contracts stay ownerless and
-- are no longer reachable through the API.
UPDATE "Case" c SET "uid" = s."uid"
FROM (
  SELECT "caseId", MIN("uid") AS "uid"
  FROM "Contract"
  WHERE "caseId" IS NOT NULL
  GROUP BY "caseId"
  HAVING COUNT(DISTINCT "uid") = 1 AND COUNT(*) = COUNT("uid")
) s
WHERE c."id" = s."caseId";
