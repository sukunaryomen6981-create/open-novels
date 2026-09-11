import { createContext, useContext, useState } from 'react';
import api from '../services/api.js';
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } });
  const save = (token, u) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(u)); setUser(u); };
  const login = async (email, password) => {
    try { const { data } = await api.post('/auth/login', { email, password }); save(data.token, data.user); return data.user; }
    catch (e) {
      if (!e.response) { const g = { id: 'guest', username: email.split('@')[0] || 'writer', penName: 'Guest Writer', email, role: 'user', guest: true, isVerified: true, avatar: '' }; save('demo-token', g); return g; }
      throw e;
    }
  };
  const register = async (username, email, password) => {
    try { const { data } = await api.post('/auth/register', { username, penName: username, email, password }); save(data.token, data.user); return data.user; }
    catch (e) {
      if (!e.response) { const g = { id: 'guest', username, penName: username, email, role: 'user', guest: true, isVerified: true, avatar: '' }; save('demo-token', g); return g; }
      throw e;
    }
  };
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };
  const updateUser = (patch) => {
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, ...patch };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };
  return <Ctx.Provider value={{ user, login, register, logout, updateUser, isAdmin: user?.role === 'admin', isAuthor: !!user?.isAuthor || user?.guest === true }}>{children}</Ctx.Provider>;
}
