import { readBlockConfig } from '../../scripts/aem.js';

function sameDomainEndpoint(value, fallback) {
  const candidate = value || fallback;
  const url = new URL(candidate, window.location.origin);
  const permittedPath = url.pathname.startsWith('/api/') || url.pathname.startsWith('/mock-data/');
  if (url.origin !== window.location.origin || !permittedPath) return fallback;
  return `${url.pathname}${url.search}`;
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const endpoint = isLocal && config.mockData
    ? sameDomainEndpoint(config.mockData, '/mock-data/store-locations.json')
    : sameDomainEndpoint(config.endpoint, '/api/web/stores');
  const properties = {
    endpoint,
    country: (config.country || 'ca').toLowerCase(),
    language: (config.language || document.documentElement.lang || 'en').toLowerCase(),
    variant: (config.variant || 'default').toLowerCase(),
  };

  block.textContent = '';
  const mountPoint = document.createElement('div');
  mountPoint.className = 'store-locator-mount';
  block.append(mountPoint);
  const { mount } = await import('./store-locator.bundle.js');
  mount(mountPoint, properties);
}
