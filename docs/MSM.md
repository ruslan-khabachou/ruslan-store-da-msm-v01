# DA Multi-Site Manager

This project uses DA MSM Early Access, not AEM Sites MSM.

The org-level DA `msm` tab is:

| base | satellite | title |
|---|---|---|
| `base-site` | | Ruslan Store multilingual base |
| `base-site` | `ca-site` | Ruslan Store Canada |
| `base-site` | `fr-site` | Ruslan Store France |
| `base-site` | `us-site` | Ruslan Store United States |

MSM relationships are defined between sites. Locale roots remain normal paths inside those sites. Consequently, `/fr/nav` can be inherited or overridden independently from `/fr/index`.

The delivery source for every site is:

```text
https://da-msm.adobeaem.workers.dev/<DA_ORG>/<SITE>/
```

`config/da/prepare.csv` enables the Multi-site Manager action in the DA Prepare menu. `config/da/site-locales.csv` is an implementation inventory and is not a standard DA MSM tab.

Reference: https://docs.da.live/about/early-access/multi-site-manager
