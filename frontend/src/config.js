// ------------------------------------------------------------------
// One place for the backend address.
// Change it in the .env file (VITE_API_URL) - never inside the code.
// ------------------------------------------------------------------
const fromEnv = import.meta.env?.VITE_API_URL;

// remove a trailing "/" so "http://localhost:5000/" and "http://localhost:5000" both work
export const API_URL = (fromEnv || 'http://localhost:5000').replace(/\/+$/, '');
