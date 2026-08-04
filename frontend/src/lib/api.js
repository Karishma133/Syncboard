import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true, // backend auth is cookie-based (see auth.middleware.js)
});

export { API_URL };
export default api;
