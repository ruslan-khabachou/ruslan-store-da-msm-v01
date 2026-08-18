import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

export function mount(element, properties) {
  const root = createRoot(element);
  root.render(<App {...properties} />);
  return () => root.unmount();
}

export default mount;
