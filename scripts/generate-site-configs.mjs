import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ROOT,
  csvCell,
  listLocaleRoutes,
  listSites,
  providerUrl,
  readMatrix,
  ueEditorUrl,
} from './site-config-lib.mjs';

const matrix = await readMatrix();
const sites = listSites(matrix);
const localeRoutes = listLocaleRoutes(matrix);
const edsDir = path.join(ROOT, 'config', 'eds', 'sites');
const daDir = path.join(ROOT, 'config', 'da');
const cdnDir = path.join(ROOT, 'config', 'cdn');

await Promise.all([
  fs.mkdir(edsDir, { recursive: true }),
  fs.mkdir(daDir, { recursive: true }),
  fs.mkdir(cdnDir, { recursive: true }),
]);

const previous = await fs.readdir(edsDir).catch(() => []);
await Promise.all(previous.filter((name) => name.endsWith('.json'))
  .map((name) => fs.unlink(path.join(edsDir, name))));

const adminRoles = { admin: matrix.access.admins };
if (matrix.access.configAdmins.length) adminRoles.config_admin = matrix.access.configAdmins;

await Promise.all(sites.map(async (site) => {
  const payload = {
    version: 1,
    code: {
      owner: matrix.git.owner,
      repo: matrix.git.repo,
      ref: matrix.git.ref,
      source: {
        type: 'github',
        url: `https://github.com/${matrix.git.owner}/${matrix.git.repo}`,
      },
    },
    content: {
      source: {
        url: providerUrl(matrix, site.name),
        type: 'markup',
      },
    },
    access: {
      admin: {
        role: adminRoles,
        requireAuth: 'auto',
      },
    },
  };
  await fs.writeFile(
    path.join(edsDir, `${site.name}.json`),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
}));

const msmRows = [
  ['base', 'satellite', 'title'],
  [matrix.baseSite.name, '', matrix.baseSite.title],
  ...matrix.satellites.map((site) => [site.base, site.name, site.title]),
];
await fs.writeFile(
  path.join(daDir, 'msm.csv'),
  `${msmRows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`,
);

await fs.writeFile(
  path.join(daDir, 'prepare.csv'),
  'title,path,icon,ref\nMulti-site Manager,,,\n',
);

const editorUrl = ueEditorUrl(matrix);
const dataRows = [
  ['key', 'value'],
  ...sites.map((site) => [
    'editor.path',
    `/${matrix.daOrg}/${site.name}=${editorUrl}`,
  ]),
];
await fs.writeFile(
  path.join(daDir, 'data.csv'),
  `${dataRows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`,
);

const adminGroup = `${matrix.access.imsOrgId}/${matrix.access.daAdminGroup}`;
const authorGroup = `${matrix.access.imsOrgId}/${matrix.access.daAuthorGroup}`;
const permissionRows = [
  ['path', 'groups', 'actions', 'comments'],
  ['CONFIG', matrix.access.imsOrgId, 'read', 'IMS organization can read DA configuration'],
  ['CONFIG', adminGroup, 'write', 'DA administrators can update org and site configuration'],
  ['/+**', matrix.access.imsOrgId, 'read', 'IMS organization can read all project content'],
  ['/+**', authorGroup, 'write', 'DA authors can edit base and satellite content'],
];
await fs.writeFile(
  path.join(daDir, 'permissions.csv'),
  `${permissionRows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`,
);

const localeRows = [
  ['site', 'role', 'base', 'country', 'locale', 'rootPath', 'domain', 'localizedFragments'],
  ...localeRoutes.map((route) => [
    route.site,
    route.role,
    route.base,
    route.country,
    route.locale,
    route.rootPath,
    route.domain,
    route.localizedFragments.join(';'),
  ]),
];
await fs.writeFile(
  path.join(daDir, 'site-locales.csv'),
  `${localeRows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`,
);

const routes = [
  {
    priority: 10,
    match: { path: '/api/*' },
    origin: matrix.services.azureBffOrigin,
    purpose: 'Same-domain API calls to Azure BFF',
  },
  {
    priority: 20,
    match: { path: '/assets/*' },
    origin: matrix.services.aemAssetsOrigin,
    purpose: 'Optional AEM Assets/Dynamic Media only; never page content',
  },
  ...matrix.satellites.map((site, index) => ({
    priority: 50 + index,
    match: { host: site.domain, path: '/' },
    action: { type: 'redirect', status: 302, location: `/${site.locales[0]}/` },
    purpose: `${site.country} default-locale redirect`,
  })),
  ...localeRoutes.filter((route) => route.role === 'satellite').map((route, index) => ({
    priority: 100 + index,
    match: { host: route.domain, path: route.routePattern },
    origin: `https://${matrix.git.ref}--${route.site}--${matrix.edsOrg}.aem.live`,
    purpose: `${route.country} ${route.locale.toUpperCase()} EDS live copy`,
  })),
];
await fs.writeFile(
  path.join(cdnDir, 'routes.generated.json'),
  `${JSON.stringify({ generatedFrom: 'config/site-matrix.json', routes }, null, 2)}\n`,
);

await fs.writeFile(
  path.join(ROOT, 'fstab.yaml'),
  `mountpoints:\n  /:\n    url: https://content.da.live/${matrix.daOrg}/${matrix.baseSite.name}/\n    type: markup\n`,
);

await fs.writeFile(
  path.join(ROOT, 'config', 'rollout.env.example'),
  [
    `EDS_ORG=${matrix.edsOrg}`,
    `DA_ORG=${matrix.daOrg}`,
    `CODE_OWNER=${matrix.git.owner}`,
    `CODE_REPO=${matrix.git.repo}`,
    `CODE_REF=${matrix.git.ref}`,
    '',
  ].join('\n'),
);

console.log(`Generated configuration for ${sites.length} sites and ${localeRoutes.length} locale roots.`);
