# Optional AEM Assets integration

AEM Assets may be connected as the DAM and Dynamic Media source. It must not become the page-content source.

Allowed uses include author asset selection, approved renditions, smart crops, and Media Bus/Dynamic Media delivery. Keep page documents, block values, navigation, metadata, and MSM inheritance in DA Author Bus.

The placeholder `/assets/*` CDN rule is illustrative. Replace it with the asset delivery pattern recommended for the actual AEM Assets program, and restrict the origin appropriately.

Official DA setup reference: https://docs.da.live/administrators/guides/setup-aem-assets
