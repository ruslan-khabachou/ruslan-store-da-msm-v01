# Universal Editor with DA Author Bus

Content remains in DA Author Bus while authors use either DA or Universal Editor.

## Included

- Author Bus-compatible component definitions, models and filters.
- UE DOM instrumentation helpers under `ue/`.
- UE-aware page loading on `.ue.da.live` and `.stage-ue.da.live`.
- `editor.path` mappings generated for all four DA sites in `config/da/data.csv`.
- A React Store Locator exposed as a normal UE component.

## Required placeholders

Set the following in `config/site-matrix.json` and regenerate:

- `daOrg`
- `git.owner`
- `git.repo`
- `universalEditor.dxHandle`
- `universalEditor.canvasHost` only if Adobe provides a different host pattern

Copy the generated `data` rows into the org-level DA config. Adobe must enable UE on Author Bus for the IMS organization; code alone cannot activate the Early Access service.

Reference: https://docs.da.live/administrators/guides/setup-universal-editor
