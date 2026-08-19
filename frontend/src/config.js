// Central API configuration.
//
// Set REACT_APP_API_URL at build time to point the app at a deployed backend.
// Create React App inlines REACT_APP_* variables during `npm run build`, so this
// is resolved when the bundle is produced, not at runtime.
//
//   local        -> unset, falls back to http://localhost:8000
//   Vercel       -> REACT_APP_API_URL=https://vectorshift-backend.onrender.com

export const API_BASE_URL = (
  process.env.REACT_APP_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

/** Build an absolute API URL from a leading-slash path, e.g. apiUrl('/pipelines/parse'). */
export const apiUrl = (path) => `${API_BASE_URL}${path}`;
