import axios from "axios";

// Troque depois para seu backend real
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000",
});
