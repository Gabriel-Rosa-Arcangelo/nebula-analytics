// src/api.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: false,
});

// injeta o Authorization automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const local = typeof window !== "undefined" ? localStorage.getItem("nebula_token") : null;
  const env = import.meta.env.VITE_DEMO_TOKEN;
  const token = local || env;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
