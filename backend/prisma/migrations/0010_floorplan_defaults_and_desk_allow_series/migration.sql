-- AlterTable
ALTER TABLE "Floorplan"
  ADD COLUMN "defaultResourceKind" "ResourceKind" NOT NULL DEFAULT 'TISCH',
  ADD COLUMN "defaultAllowSeries" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Desk"
  ADD COLUMN "allowSeriesOverride" BOOLEAN;
