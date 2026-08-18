# Initial setup

## 1. Confirm Early Access

Confirm that the IMS organization/DX Handle has Universal Editor on Author Bus and DA Multi-Site Manager enabled. AEM Sites is not configured as a content source.

## 2. Configure the source matrix

Update `config/site-matrix.json` with the target DA org, EDS org, unchanged GitHub owner, DX Handle, IMS groups, domains and service origins. Run:

```bash
npm install
npm run build
npm test
```

## 3. Bootstrap shared code

1. Create `ruslan-store-da-msm-v01` under the approved GitHub owner.
2. Commit the generated `fstab.yaml` on `main` before enabling AEM Code Sync.
3. Install AEM Code Sync and verify that the canonical URL works.
4. Verify that the installer email is an EDS organization administrator.

## 4. Create DA content roots

Create `base-site`, `ca-site`, `fr-site`, and `us-site` under the target DA organization. Seed `/en` and `/fr` on `base-site`. Add satellite files only for intentional local overrides.

## 5. Configure the DA organization

Open `https://da.live/config#/<DA_ORG>/` and create/update these tabs using the generated CSV or Excel workbook:

- `data` — Universal Editor `editor.path` mappings;
- `permissions` — DA authoring ACL example;
- `msm` — base/live-copy relationships;
- `prepare` — Multi-site Manager action.

`site-locales` is a project inventory, not a required DA runtime tab.

## 6. Create EDS site configurations

Run `scripts/rollout-msm-org.sh` first without `--apply`. After review, export the Admin token and apply. Verify `/en` and `/fr` on `ca-site`, `/fr` on `fr-site`, and `/fr` on `us-site`.

## 7. Verify authoring

Open content in DA and Universal Editor, edit a base page, preview an inherited satellite page, override `/fr/nav` locally, and confirm that unrelated pages remain inherited.
