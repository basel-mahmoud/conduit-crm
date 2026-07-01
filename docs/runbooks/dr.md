# Disaster Recovery — RTO / RPO

- **RPO (data-loss tolerance):** ≤ 5 minutes — Neon Postgres continuous WAL +
  point-in-time restore (PITR).
- **RTO (recovery time):** ≤ 30 minutes — Vercel redeploy from GitHub is minutes;
  a Neon PITR restore is the long pole.

## Scenarios & response
- **Bad deploy:** roll back instantly in Vercel (re-alias the previous
  deployment) or `git revert` + redeploy.
- **Bad migration / data corruption:** create a Neon branch (or PITR) to a
  timestamp before the incident; re-apply forward migrations if needed.
- **Region / provider outage:** Neon + Vercel are managed and multi-AZ; monitor
  provider status; failover is provider-managed.

## Backups
- Neon retains history for PITR (plan-dependent). Take an on-demand cold backup of
  critical tables with `pg_dump` before risky operations.

## Restore drill (quarterly)
1. Create a Neon branch from a past timestamp.
2. Point a Vercel preview at the branch (`DATABASE_URL`).
3. Validate data + app, then promote or copy data back to `main`.

## Health
- `GET /api/health` returns `{ status, db, time }` (200 healthy / 503 degraded)
  for uptime monitoring.
