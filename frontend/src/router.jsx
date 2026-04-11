// src/router.jsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Splash       from '@/pages/Splash';
import Dashboard    from '@/pages/Dashboard';
import LiveTiming   from '@/pages/LiveTiming';
import Strategy     from '@/pages/Strategy';
import HeadToHead   from '@/pages/HeadToHead';
import Standings    from '@/pages/Standings';
import Calendar     from '@/pages/Calendar';
import Circuit      from '@/pages/Circuit';
import Weather      from '@/pages/Weather';
import News         from '@/pages/News';
import RadioSentiment from '@/pages/RadioSentiment';
import Encyclopedia from '@/pages/Encyclopedia';
import Championship from '@/pages/Championship';
import Auth         from '@/pages/Auth';
import PageShell    from '@/components/layout/PageShell';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0D0D0D' }}>
        <div className="apex-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

const router = createBrowserRouter([
  { path: '/',         element: <Splash /> },
  { path: '/auth',     element: <Auth /> },
  {
    element: (
      <ProtectedRoute>
        <PageShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard',  element: <Dashboard /> },
      { path: '/live',       element: <LiveTiming /> },
      { path: '/strategy',   element: <Strategy /> },
      { path: '/h2h',        element: <HeadToHead /> },
      { path: '/standings',  element: <Standings /> },
      { path: '/championship', element: <Championship /> },
      { path: '/calendar',   element: <Calendar /> },
      { path: '/circuit',    element: <Circuit /> },
      { path: '/weather',    element: <Weather /> },
      { path: '/news',       element: <News /> },
      { path: '/radio',      element: <RadioSentiment /> },
      { path: '/encyclopedia', element: <Encyclopedia /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
