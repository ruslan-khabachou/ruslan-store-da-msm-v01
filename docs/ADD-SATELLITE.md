# Add a live-copy site

Use a unique site ID, country, domain and a subset of the base locales:

```bash
npm run site:add -- \
  --site be-site \
  --country BE \
  --name "Ruslan Store Belgium" \
  --domain www.ruslan-store.be \
  --locales en,fr
```

The command updates `config/site-matrix.json` and regenerates EDS JSON, DA config CSV, locale inventory and CDN routes. Review the diff, rerun tests, perform a rollout dry run, and then apply it with authorized tokens.
