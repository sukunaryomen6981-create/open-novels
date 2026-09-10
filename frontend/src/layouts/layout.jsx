import { Outlet } from 'react-router-dom';
import { Header, Footer, BottomNav } from '../components/ui.jsx';
export function MainLayout() {
  return <div className="min-h-screen pb-16 md:pb-0"><Header /><main className="mx-auto max-w-7xl px-4"><Outlet /></main><Footer /><BottomNav /></div>;
}
