-- CreateEnum
CREATE TYPE "FloorplanTenantScope" AS ENUM ('ALL', 'SELECTED');

-- AlterTable
ALTER TABLE "Floorplan"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "tenantScope" "FloorplanTenantScope" NOT NULL DEFAULT 'ALL';

-- CreateTable
CREATE TABLE "FloorplanTenant" (
    "floorplanId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FloorplanTenant_pkey" PRIMARY KEY ("floorplanId","tenantId")
);

-- CreateIndex
CREATE INDEX "FloorplanTenant_tenantId_idx" ON "FloorplanTenant"("tenantId");

-- AddForeignKey
ALTER TABLE "FloorplanTenant" ADD CONSTRAINT "FloorplanTenant_floorplanId_fkey" FOREIGN KEY ("floorplanId") REFERENCES "Floorplan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorplanTenant" ADD CONSTRAINT "FloorplanTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
