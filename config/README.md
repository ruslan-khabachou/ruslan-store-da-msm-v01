# Configuration sources and generated files

`site-matrix.json` is the source of truth. It separates:

- `daOrg` — target Author Bus content organization;
- `edsOrg` — EDS Configuration Service organization;
- `git.owner` — unchanged GitHub code owner.

Run `npm run config:generate` to recreate:

- `da/data.csv` — Universal Editor editor paths;
- `da/permissions.csv` — DA permissions example;
- `da/msm.csv` — MSM relationships;
- `da/prepare.csv` — Prepare menu entry;
- `da/site-locales.csv` — locale inventory;
- `eds/sites/*.json` — EDS site configurations;
- `cdn/routes.generated.json` — vendor-neutral CDN routes;
- `../fstab.yaml` — canonical Code Sync bootstrap source;
- `rollout.env.example` — non-secret rollout parameter example.

The companion Excel workbook contains the same operational configuration in editable tabs. Do not put tokens or other secrets in JSON, CSV, environment examples, or the workbook.
