import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
export const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || "http://127.0.0.1:5173/";
export const accessKey = "neojobzinda_admin_access";
export const refreshKey = "neojobzinda_admin_refresh";

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(accessKey);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((response) => response, async (error) => {
  const original = error.config;
  const refresh = localStorage.getItem(refreshKey);
  if (error.response?.status !== 401 || !refresh || original?._retried) {
    return Promise.reject(error);
  }
  original._retried = true;
  try {
    const response = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
    localStorage.setItem(accessKey, response.data.access);
    original.headers.Authorization = `Bearer ${response.data.access}`;
    return api(original);
  } catch (refreshError) {
    localStorage.removeItem(accessKey);
    localStorage.removeItem(refreshKey);
    window.dispatchEvent(new Event("admin-session-expired"));
    return Promise.reject(refreshError);
  }
});

export default api;
