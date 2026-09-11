import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export function VerifyEmail() {
  const token = new URLSearchParams(location.search).get('token');
  const [state, setState] = useState('checking');
  const { user, updateUser } = useAuth();
  useEffect(() => {
    if (!token) { setState('bad'); return; }
    api.get('/auth/verify-email', { params: { token } })
      .then(() => { setState('ok'); if (user) updateUser({ isVerified: true }); })
      .catch(() => setState('bad'));
  }, []);
  return (
    <div className="py-16 max-w-md mx-auto text-center">
      {state === 'checking' && <p className="text-paper/60">Confirming your email…</p>}
      {state === 'ok' && (<><p className="text-4xl">✒️</p><h1 className="font-display font-semibold text-2xl mt-3">Email verified!</h1>
        <p className="text-paper/60 text-sm mt-2">Publishing is unlocked. Go write something great.</p>
        <Link to="/write" className="btn-primary mt-5">Start writing →</Link></>)}
      {state === 'bad' && (<><p className="text-4xl">📭</p><h1 className="font-display font-semibold text-2xl mt-3">Link invalid or expired</h1>
        <p className="text-paper/60 text-sm mt-2">Links last 24 hours. Grab a fresh one from your profile.</p>
        <Link to="/profile" className="btn-primary mt-5">Go to profile →</Link></>)}
    </div>
  );
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();
  return (
    <div className="py-10 max-w-md mx-auto"><h1 className="text-2xl font-black">Welcome back, writer</h1>
      <form onSubmit={async (e) => { e.preventDefault(); setErr(''); try { await login(email, password); nav('/'); } catch (er) { setErr(er.response?.status === 429 ? 'Too many attempts — wait a few minutes and try again.' : 'Invalid credentials'); } }} className="mt-4 space-y-3">
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <button className="btn-primary w-full">Login</button>
      </form>
      <p className="text-sm text-zinc-400 mt-3">New here? <Link to="/register" className="text-accent">Create a free account</Link></p></div>
  );
}

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const { register } = useAuth();
  const nav = useNavigate();
  return (
    <div className="py-10 max-w-md mx-auto"><h1 className="text-2xl font-black">Join free — publish tonight</h1>
      <p className="text-sm text-zinc-400 mt-1">Pick a pen name. You keep ownership of everything you write.</p>
      <form onSubmit={async (e) => { e.preventDefault(); setErr(''); try { await register(username, email, password); nav('/write'); } catch (er) { setErr(er.response?.data?.error || 'Failed'); } }} className="mt-4 space-y-3">
        <input className="input" placeholder="Pen name / username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <button className="btn-primary w-full">Create account</button>
        <p className="text-xs text-zinc-500 text-center">By joining you agree to the <Link to="/terms" className="text-brass">Terms</Link>, <Link to="/privacy" className="text-brass">Privacy Policy</Link> and <Link to="/guidelines" className="text-brass">Guidelines</Link>.</p>
      </form></div>
  );
}
