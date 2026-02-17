ALTER TABLE "Employee" RENAME COLUMN "tenantId" TO "entraTenantId";
ALTER TABLE "Employee" ADD COLUMN "tenantDomainId" TEXT;
CREATE INDEX "Employee_tenantDomainId_idx" ON "Employee"("tenantDomainId");

CREATE TABLE "Tenant" (
  "id" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");

CREATE TYPE "DeskTenantScope" AS ENUM ('ALL', 'SELECTED');
ALTER TABLE "Desk" ADD COLUMN "tenantScope" "DeskTenantScope" NOT NULL DEFAULT 'ALL';

CREATE TABLE "DeskTenant" (
  "deskId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeskTenant_pkey" PRIMARY KEY ("deskId", "tenantId")
);

CREATE INDEX "DeskTenant_tenantId_idx" ON "DeskTenant"("tenantId");

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_tenantDomainId_fkey" FOREIGN KEY ("tenantDomainId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeskTenant" ADD CONSTRAINT "DeskTenant_deskId_fkey" FOREIGN KEY ("deskId") REFERENCES "Desk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeskTenant" ADD CONSTRAINT "DeskTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
