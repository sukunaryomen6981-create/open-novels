import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
export default api;
export async function safeGet(promise, fallback) {
  try { const { data } = await promise; return data; } catch { return fallback; }
}
// Device upload: file goes to our API, which forwards it to a free image
// host and returns a permanent URL. Nothing is stored on our servers.
export async function uploadImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/uploads/image', fd);
  return data.url;
}
