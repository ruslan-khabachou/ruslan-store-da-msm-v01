import React, { useEffect, useMemo, useState } from 'react';

const COPY = {
  en: {
    title: 'Find a Ruslan Store', loading: 'Loading stores…', empty: 'No stores found.', error: 'Store data is temporarily unavailable.', distance: 'Distance', details: 'Store details',
  },
  fr: {
    title: 'Trouver un magasin Ruslan', loading: 'Chargement des magasins…', empty: 'Aucun magasin trouvé.', error: 'Les données des magasins sont temporairement indisponibles.', distance: 'Distance', details: 'Détails du magasin',
  },
};

function StoreCard({ store, labels }) {
  return (
    <li className="store-locator-card">
      <h3>{store.name}</h3>
      <p>{store.address}</p>
      <p><strong>{labels.distance}:</strong> {store.distanceKm} km</p>
      {store.url && <a href={store.url}>{labels.details}</a>}
    </li>
  );
}

export default function App({ endpoint, country = 'ca', language = 'en', variant = 'default' }) {
  const locale = language.toLowerCase().split(/[-_]/)[0];
  const labels = COPY[locale] || COPY.en;
  const [state, setState] = useState({ status: 'loading', stores: [] });
  const requestUrl = useMemo(() => {
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set('country', country);
    url.searchParams.set('language', locale);
    return url;
  }, [country, endpoint, locale]);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', stores: [] });
    fetch(requestUrl, { credentials: 'same-origin', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Store API returned ${response.status}`);
        return response.json();
      })
      .then((payload) => setState({
        status: 'ready',
        stores: Array.isArray(payload) ? payload : payload.stores || [],
      }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ status: 'error', stores: [] });
      });
    return () => controller.abort();
  }, [requestUrl]);

  return (
    <section className={`store-locator-app store-locator-app-${variant}`} aria-live="polite">
      <h2>{labels.title}</h2>
      {state.status === 'loading' && <p>{labels.loading}</p>}
      {state.status === 'error' && <p className="store-locator-error">{labels.error}</p>}
      {state.status === 'ready' && state.stores.length === 0 && <p>{labels.empty}</p>}
      {state.stores.length > 0 && (
        <ul>{state.stores.map((store) => <StoreCard key={store.id} store={store} labels={labels} />)}</ul>
      )}
    </section>
  );
}
