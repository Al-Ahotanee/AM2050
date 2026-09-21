# AM2050 Production Handoff

> **Primary deployment guide:** follow [`deployment/RENDER_AIVEN_GITHUB_DEPLOYMENT.md`](deployment/RENDER_AIVEN_GITHUB_DEPLOYMENT.md) for the complete GitHub, Aiven MySQL, Render, migration, validation, and rollback procedure.

## Confirmed deployment baseline

| Scope level | Initial value |
|---|---|
| State | Jigawa |
| LGA | Buji |
| Ward | Ahoto |
| Community configuration | All communities in Ahoto Ward will be added through the secured geography workflow after deployment. |
| Operational users | None are embedded in the production package. Create the first super administrator only through `backend/scripts/create-admin.php`. |

## Deployment sequence

1. Create the Aiven MySQL service, download its CA certificate, and retain the connection data only in the approved secret manager.
2. Import the supplied private baseline database export or use the empty bootstrap path described in the primary deployment guide.
3. Create the Render Blueprint service from this repository and enter the requested secrets in Render.
4. Keep `VITE_AM2050_API_URL=/api/v1` so the React app and PHP API stay on one HTTPS origin. Never configure a temporary Manus sandbox API host.
5. Run the health, login, refresh, scoped-record, document, and offline-batch checks stated in `backend/DEPLOYMENT.md` before onboarding field teams.

> The sandbox uses local services for development and QA. The supplied release package contains no production secrets, no active production account, and no client records.
