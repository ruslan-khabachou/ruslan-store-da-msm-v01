# Ruslan Store DA MSM v01

`ruslan-store-da-msm-v01` is a DA Author Bus + Universal Editor + Edge Delivery Services starter based on Adobe's `aemsites/da-block-collection`. AEM Sites is not used as a page source. AEM Assets/Dynamic Media can be connected separately as the DAM.

## MSM topology

| DA/EDS site | Role | Locale roots | Inherits from |
|---|---|---|---|
| `base-site` | Base | `/en`, `/fr` | — |
| `ca-site` | Live copy | `/en`, `/fr` | `base-site` |
| `fr-site` | Live copy | `/fr` | `base-site` |
| `us-site` | Live copy | `/fr` | `base-site` |

DA MSM inheritance is site-level and path-preserving. For example, `/fr/products` on `fr-site` inherits `/fr/products` from `base-site` until the file exists locally on `fr-site`.

`/en/nav`, `/fr/nav`, `/en/footer`, and `/fr/footer` are locale-specific fragments. A satellite can override only its navigation or footer while continuing to inherit its pages.

## Universal Editor on Author Bus

The repository includes Author Bus-compatible Universal Editor instrumentation:

- `component-definition.json`
- `component-definitions.json` compatibility alias
- `component-models.json`
- `component-filters.json`
- `ue/models/` and `ue/scripts/`
- generated `editor.path` rows in `config/da/data.csv`

Update `universalEditor.dxHandle` in `config/site-matrix.json` before copying the generated `data` tab into the DA org config. UE on Author Bus remains an Adobe Early Access capability and must be enabled for the IMS organization.

## Configure and generate

Edit `config/site-matrix.json`:

- `daOrg`: target DA Author Bus organization;
- `edsOrg`: EDS Configuration Service organization, normally the GitHub owner;
- `git.owner`: unchanged GitHub repository owner;
- `git.repo`: `ruslan-store-da-msm-v01`;
- IMS, DX Handle, domains, administrators, BFF, and Assets placeholders.

Then run:

```bash
npm install
npm run build
npm test
```

Generation produces:

- `config/eds/sites/*.json` — one EDS config per site;
- `config/da/data.csv` — Universal Editor mappings;
- `config/da/permissions.csv` — DA authoring permissions example;
- `config/da/msm.csv` — base/live-copy relationships;
- `config/da/prepare.csv` — MSM Prepare menu entry;
- `config/da/site-locales.csv` — locale/path inventory;
- `config/cdn/routes.generated.json` — CDN route example;
- `fstab.yaml` — canonical Code Sync bootstrap mountpoint.

## Roll out to a new DA organization

The target DA organization is deliberately separate from the GitHub/EDS organization:

```bash
./scripts/rollout-msm-org.sh \
  --eds-org ruslan-khabachou \
  --da-org new-da-org-id \
  --code-owner ruslan-khabachou \
  --code-repo ruslan-store-da-msm-v01
```

The command is a dry run unless `--apply` is supplied. See `docs/AUTOMATION.md`.

## Add another live copy

```bash
npm run site:add -- \
  --site be-site \
  --country BE \
  --name "Ruslan Store Belgium" \
  --domain www.ruslan-store.be \
  --locales en,fr
```

## Local development

```bash
npx @adobe/aem-cli up --no-open
```

For a repoless site, point the CLI at its preview URL with `--url`. The sample React Store Locator remains available as a DA/UE block and calls same-domain `/api/*` endpoints routed by the customer CDN to Azure.

## References

- DA MSM: https://docs.da.live/about/early-access/multi-site-manager
- UE on Author Bus: https://docs.da.live/administrators/guides/setup-universal-editor
- Repoless sites: https://www.aem.live/docs/repoless
- DA permissions: https://docs.da.live/administrators/guides/permissions
# ruslan-store-da-msm-v01
