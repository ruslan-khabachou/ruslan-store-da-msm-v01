# React micro-frontend block

The Store Locator demonstrates a framework application mounted inside one EDS block. The rest of the page remains standard EDS HTML, CSS, and JavaScript.

## Authoring

Insert **Store Locator (React)** in DA Live or Universal Editor. The default block configuration is:

| Field | Value | Purpose |
|---|---|---|
| Endpoint | `/api/web/stores` | Same-origin URL routed to Azure BFF |
| Country | `ca` | Country filter |
| Language | `en` | UI/API locale |
| Variant | `compact` | Presentation variant |
| Mock Data | `/mock-data/store-locations.json` | Local development response |

On localhost the block uses Mock Data when present. In preview/live it uses Endpoint. The wrapper rejects cross-origin URLs and permits only `/api/*` and `/mock-data/*` paths.

## Development

```bash
npm run build:mfe
npx @adobe/aem-cli up
```

Edit React under `micro-frontends/store-locator/src/`. The build generates `blocks/store-locator/store-locator.bundle.js` and its source map. The bundle is dynamically imported only by `blocks/store-locator/store-locator.js`.

## Production considerations

- Keep the BFF response small and cache public store results at the CDN where appropriate.
- Authenticate sensitive calls at the CDN/BFF; never place secrets in authored block values.
- Apply CSP, rate limits, timeouts, correlation IDs, and allowlists at the CDN/BFF.
- Track the bundle size and Core Web Vitals; avoid loading React globally.
- Return stable store IDs and localized, accessible text.
