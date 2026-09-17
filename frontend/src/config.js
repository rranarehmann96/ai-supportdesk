// Central place for URLs that need to change between local dev and
// production. Set VITE_API_URL in frontend/.env when deploying.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const WS_URL = import.meta.env.VITE_API_URL || "ws://localhost:5000";
