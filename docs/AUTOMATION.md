# Rollout automation

`scripts/rollout-msm-org.sh` provisions the four EDS sites from `config/da/msm.csv`. It separates the content organization from the shared code organization.

## Dry run

```bash
./scripts/rollout-msm-org.sh \
  --eds-org ruslan-khabachou \
  --da-org new-da-org-id \
  --code-owner ruslan-khabachou \
  --code-repo ruslan-store-da-msm-v01
```

- `--eds-org` is the existing EDS Configuration Service org and normally equals the GitHub owner.
- `--da-org` is the new DA Author Bus org that will store content.
- `--code-owner` and `--code-repo` remain unchanged across DA org rollouts.

## Apply EDS configuration

```bash
export AEM_ADMIN_TOKEN='YOUR_ADMIN_SERVICE_TOKEN'

./scripts/rollout-msm-org.sh \
  --eds-org ruslan-khabachou \
  --da-org new-da-org-id \
  --code-owner ruslan-khabachou \
  --code-repo ruslan-store-da-msm-v01 \
  --apply

unset AEM_ADMIN_TOKEN
```

Apply mode first verifies organization-level EDS administration. Existing sites are updated through their `code.json` and `content.json` properties so access settings are not overwritten.

## Optionally create DA site roots

Add `--create-da-sites` and provide `DA_IMS_TOKEN`. The script creates only the four site roots. Copy the generated Excel/CSV `data`, `permissions`, `msm`, and `prepare` tabs into the target DA org config separately.

## Canonical Code Sync site

Before installing AEM Code Sync, commit the generated `fstab.yaml` on `main`. It points the canonical Git repository site at `<DA_ORG>/base-site`. The canonical site synchronizes code; the four repoless MSM sites share that code.

References:

- https://www.aem.live/docs/repoless
- https://docs.da.live/developers/api/source
- https://docs.da.live/about/early-access/multi-site-manager
