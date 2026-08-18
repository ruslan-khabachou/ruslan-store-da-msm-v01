/**
 * Returns the locale represented by the first URL segment.
 * @param {string} pathname current pathname
 * @param {string} fallback locale used when the first segment is not a locale
 * @returns {string} lowercase locale code
 */
export function getPathLocale(pathname, fallback = 'en') {
  const firstSegment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  return /^[a-z]{2}(?:-[a-z]{2})?$/.test(firstSegment || '')
    ? firstSegment.split('-')[0]
    : fallback.toLowerCase().split(/[-_]/)[0];
}

/**
 * Resolves fragments beneath the current locale root unless page metadata
 * supplies an explicit fragment path.
 * @param {string} fragment fragment name, for example nav or footer
 * @param {string} metadataValue optional explicit metadata value
 * @param {Location|URL} location current browser location
 * @param {string} fallbackLocale document locale
 * @returns {string} fragment pathname
 */
export function getLocalizedFragmentPath(
  fragment,
  metadataValue,
  location = typeof window === 'undefined' ? undefined : window.location,
  fallbackLocale = '',
) {
  if (metadataValue) return new URL(metadataValue, location).pathname;
  const browserLocale = typeof document === 'undefined' ? '' : document.documentElement.lang;
  const documentLocale = fallbackLocale || browserLocale || 'en';
  return `/${getPathLocale(location.pathname, documentLocale)}/${fragment}`;
}
