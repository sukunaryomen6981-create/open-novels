import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { MainLayout } from './layouts/layout.jsx';
import Home from './pages/Home.jsx';
import Browse from './pages/Browse.jsx';
import NovelDetails from './pages/NovelDetails.jsx';
import Reader from './pages/Reader.jsx';
import { Write, ManageStory } from './pages/Write.jsx';
import { Login, Register } from './pages/Auth.jsx';
import { Library, Profile, SearchPage, Genres, GenreDetail, Admin, NotFound } from './pages/misc.jsx';
import { Rankings, Contests, Prompts } from './pages/discover.jsx';
import { Terms, Privacy, Guidelines, Copyright } from './pages/legal.jsx';

export default function App() {
  return (
    <ThemeProvider><AuthProvider><BrowserRouter>
      <Suspense fallback={<div className="p-10">Loading…</div>}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/novels/:slug" element={<NovelDetails />} />
            <Route path="/read/:novelSlug/:chapterId" element={<Reader />} />
            <Route path="/write" element={<Write />} />
            <Route path="/write/:slug" element={<ManageStory />} />
            <Route path="/library" element={<Library />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/genres" element={<Genres />} />
            <Route path="/genres/:name" element={<GenreDetail />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/contests" element={<Contests />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/guidelines" element={<Guidelines />} />
            <Route path="/legal" element={<Copyright />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter></AuthProvider></ThemeProvider>
  );
}
