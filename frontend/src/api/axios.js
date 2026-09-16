import axios from "axios";

// In development this falls back to localhost. In production, set
// VITE_API_URL in the frontend's .env to your deployed backend's URL.
const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
