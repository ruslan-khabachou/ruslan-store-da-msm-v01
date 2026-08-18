import { readMatrix, writeMatrix } from './site-config-lib.mjs';

function readArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const token = values[index];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const value = values[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${token}`);
    result[token.slice(2)] = value;
    index += 1;
  }
  return result;
}

const args = readArgs(process.argv.slice(2));
const siteName = args.site?.toLowerCase();
const country = args.country?.toUpperCase();
if (!/^[a-z0-9][a-z0-9-]*$/.test(siteName || '')) {
  throw new Error('Required: --site <lowercase-site-id>, for example de-site.');
}
if (!/^[A-Z]{2}$/.test(country || '')) {
  throw new Error('Required: --country <two-letter-code>, for example DE.');
}
if (!args.name || !args.domain) {
  throw new Error('Required: --name <display-name> --domain <host>.');
}

const matrix = await readMatrix();
if (matrix.satellites.some((site) => site.name === siteName)) {
  throw new Error(`Satellite ${siteName} already exists.`);
}

const allowedLocales = [...new Set([
  ...matrix.baseSite.locales,
  ...matrix.satellites.flatMap((site) => site.locales),
])];
const locales = (args.locales || matrix.baseSite.locales.join(','))
  .split(',')
  .map((locale) => locale.trim().toLowerCase())
  .filter(Boolean);
const invalidLocales = locales.filter((locale) => !allowedLocales.includes(locale));
if (!locales.length || invalidLocales.length) {
  throw new Error(`Locales must be selected from: ${allowedLocales.join(', ')}.`);
}

const base = args.base || matrix.baseSite.name;
if (base !== matrix.baseSite.name) {
  throw new Error(`This sample has one MSM base site: ${matrix.baseSite.name}.`);
}

matrix.satellites.push({
  name: siteName,
  title: args.name,
  country,
  domain: args.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''),
  base,
  locales: [...new Set(locales)],
});
matrix.satellites.sort((left, right) => left.name.localeCompare(right.name));
await writeMatrix(matrix);
await import('./generate-site-configs.mjs');
console.log(`Added ${siteName} with locale root(s): ${locales.join(', ')}.`);
