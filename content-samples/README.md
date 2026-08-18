# DA content topology samples

These files illustrate the paths to create in DA; they are not deployed from Git.

- `base-site/en` and `base-site/fr` contain the shared language trees.
- A missing satellite file inherits the same path from `base-site` through DA MSM.
- The satellite folders contain only intentional localized overrides.
- `nav.html` and `footer.html` demonstrate fragments that can be overridden without overriding a page.

Examples:

- `ca-site/en/nav.html` overrides `/en/nav` only for Canada.
- No `ca-site/en/index.html` is included, so `/en/index` remains inherited.
- `fr-site` and `us-site` expose only the `/fr` locale tree.
