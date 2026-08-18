import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ROOT, listLocaleRoutes, listSites, providerUrl, readMatrix,
} from './site-config-lib.mjs';

const matrix = await readMatrix();
const sites = listSites(matrix);
const localeRoutes = listLocaleRoutes(matrix);
const errors = [];

if (!matrix.projectName.endsWith('-v01') || !matrix.git.repo.endsWith('-v01')) {
  errors.push('Project and Git repository names must include the v01 suffix.');
}
if (matrix.universalEditor.contentRepository !== 'DA Author Bus') {
  errors.push('Universal Editor must target DA Author Bus.');
}
if (!matrix.universalEditor.enabled) errors.push('Universal Editor must remain enabled.');
if (!matrix.contentProvider.startsWith('https://da-msm.adobeaem.workers.dev/')) {
  errors.push('MSM content provider is not the DA MSM endpoint.');
}
if (matrix.baseSite.name !== 'base-site'
  || JSON.stringify(matrix.baseSite.locales) !== JSON.stringify(['en', 'fr'])) {
  errors.push('base-site must contain the /en and /fr locale roots.');
}
const expectedSatellites = ['ca-site', 'fr-site', 'us-site'];
if (JSON.stringify(matrix.satellites.map((site) => site.name)) !== JSON.stringify(expectedSatellites)) {
  errors.push(`Expected satellites: ${expectedSatellites.join(', ')}.`);
}
if (localeRoutes.length !== 6) errors.push('Expected six site/locale roots.');

const required = [
  'component-definition.json',
  'component-definitions.json',
  'component-models.json',
  'component-filters.json',
  'ue/scripts/ue.js',
  'scripts/locale.js',
  'ue/models/blocks/store-locator.json',
  'blocks/store-locator/store-locator.bundle.js',
  'fstab.yaml',
];
await Promise.all(required.map(async (relative) => {
  try {
    await fs.access(path.join(ROOT, relative));
  } catch {
    errors.push(`Missing required file: ${relative}`);
  }
}));

const dataConfig = await fs.readFile(path.join(ROOT, 'config', 'da', 'data.csv'), 'utf8');
sites.forEach((site) => {
  if (!dataConfig.includes(`/${matrix.daOrg}/${site.name}=`)) {
    errors.push(`Universal Editor mapping is missing for ${site.name}.`);
  }
});

for (const locale of ['en', 'fr']) {
  for (const fragment of matrix.localizedFragments) {
    const sample = path.join(ROOT, 'content-samples', 'base-site', locale, `${fragment}.html`);
    try {
      await fs.access(sample);
    } catch {
      errors.push(`Missing localized base fragment sample: /${locale}/${fragment}`);
    }
  }
}

await Promise.all(sites.map(async (site) => {
  const file = path.join(ROOT, 'config', 'eds', 'sites', `${site.name}.json`);
  const payload = JSON.parse(await fs.readFile(file, 'utf8'));
  if (payload.content?.source?.url !== providerUrl(matrix, site.name)) {
    errors.push(`${site.name} does not use its DA MSM provider URL.`);
  }
  if (payload.content?.source?.type !== 'markup') {
    errors.push(`${site.name} content source must be markup.`);
  }
}));

const filesToScan = [
  'config/site-matrix.json',
  'fstab.yaml',
  ...(await fs.readdir(path.join(ROOT, 'config', 'eds', 'sites')))
    .map((file) => `config/eds/sites/${file}`),
];
await Promise.all(filesToScan.map(async (relative) => {
  const source = await fs.readFile(path.join(ROOT, relative), 'utf8');
  if (/\/content\/ruslan-store|author-[^.]+\.adobeaemcloud\.com/i.test(source)) {
    errors.push(`${relative} contains an AEM Sites authoring source.`);
  }
}));

if (errors.length) {
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validated ${sites.length} DA Author Bus/UE/MSM site configurations.`);
}
