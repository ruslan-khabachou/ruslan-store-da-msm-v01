import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MATRIX_PATH = path.join(ROOT, 'config', 'site-matrix.json');

export async function readMatrix() {
  return JSON.parse(await fs.readFile(MATRIX_PATH, 'utf8'));
}

export async function writeMatrix(matrix) {
  await fs.writeFile(MATRIX_PATH, `${JSON.stringify(matrix, null, 2)}\n`);
}

export function listSites(matrix) {
  const base = {
    ...matrix.baseSite,
    role: 'base',
    base: '',
    country: 'GLOBAL',
    domain: '',
  };
  const satellites = matrix.satellites.map((site) => ({
    ...site,
    role: 'satellite',
  }));
  return [base, ...satellites];
}

export function listLocaleRoutes(matrix) {
  return listSites(matrix).flatMap((site) => site.locales.map((locale) => ({
    site: site.name,
    role: site.role,
    base: site.base,
    country: site.country,
    domain: site.domain,
    locale,
    rootPath: `/${locale}`,
    routePattern: `/${locale}/*`,
    localizedFragments: matrix.localizedFragments.map((fragment) => `/${locale}/${fragment}`),
  })));
}

export function providerUrl(matrix, siteName, daOrg = matrix.daOrg) {
  return matrix.contentProvider
    .replace('{org}', daOrg)
    .replace('{site}', siteName);
}

export function ueCanvasHost(matrix) {
  return matrix.universalEditor.canvasHost
    .replace('{owner}', matrix.git.owner)
    .replace('{repo}', matrix.git.repo);
}

export function ueEditorUrl(matrix) {
  return `https://experience.adobe.com/#/${matrix.universalEditor.dxHandle}/aem/editor/canvas/${ueCanvasHost(matrix)}`;
}

export function csvCell(value = '') {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export { ROOT };
