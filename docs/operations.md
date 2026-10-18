# Database Operations, Migrations & Backup Runbook

## 1. Database Migrations Workflow

### 1.1 Local Development

When modifying `packages/database/prisma/schema.prisma`:

```bash
# Generate Prisma Client types
pnpm --filter @mikrotik-billing/database run db:generate

# Create and apply a migration
pnpm --filter @mikrotik-billing/database exec prisma migrate dev --name your_migration_name
```

### 1.2 Production Deployments

In staging and production environments, migrations are applied using:

```bash
pnpm --filter @mikrotik-billing/database run db:deploy
```

This applies pending migrations without running development seeds or dropping tables.

---

## 2. Backup Strategy

### 2.1 Automated PostgreSQL Backup

A complete logical backup using `pg_dump` with custom compressed format:

```bash
# Run backup
docker exec mikrotik-billing-postgres pg_dump -U postgres -Fc mikrotik_billing > /backups/mikrotik_billing_$(date +%Y%m%d_%H%M%S).dump
```

### 2.2 Point-in-Time Recovery & WAL Archiving

In high-volume ISP production setups, enable continuous WAL archiving in PostgreSQL (`archive_mode = on`).

---

## 3. Restore Procedure

### 3.1 Restoring from a Logical Dump

```bash
# 1. Terminate active backend connections to database
docker exec mikrotik-billing-postgres psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'mikrotik_billing' AND pid <> pg_backend_pid();"

# 2. Drop and recreate database
docker exec mikrotik-billing-postgres psql -U postgres -c "DROP DATABASE mikrotik_billing;"
docker exec mikrotik-billing-postgres psql -U postgres -c "CREATE DATABASE mikrotik_billing;"

# 3. Restore from compressed archive
cat backup_file.dump | docker exec -i mikrotik-billing-postgres pg_restore -U postgres -d mikrotik_billing --clean --if-exists
```

### 3.2 Post-Restore Verification

1. Run `pnpm --filter @mikrotik-billing/api test` to verify API connectivity and queries.
2. Query `SELECT count(*) FROM "Tenant";` to verify records.
