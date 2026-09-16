// Central place for URLs that need to change between local dev and
// production. Set VITE_API_URL in frontend/.env when deploying.
export const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
