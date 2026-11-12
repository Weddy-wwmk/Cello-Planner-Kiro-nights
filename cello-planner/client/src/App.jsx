import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CheckSquare,
  Mic,
  QrCode,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Music2,
  Bell,
  Menu,
  X,
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';

// ── Pages (stubs for phases 2–4, Login is fully implemented below)
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EventsPage from './pages/EventsPage';
import AttendeesPage from './pages/AttendeesPage';
import TasksPage from './pages/TasksPage';
import TranscribePage from './pages/TranscribePage';
import GateScannerPage from './pages/GateScannerPage';
import SettingsPage from './pages/SettingsPage';

// ─────────────────────────────────────────────
//  Route Guard
// ─────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sage-50 to-cream-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
          <p className="text-sage-600 font-medium">Loading Cello Planner…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ─────────────────────────────────────────────
//  Sidebar Nav Items
// ─────────────────────────────────────────────
const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/events',     icon: CalendarDays,    label: 'Events'       },
  { to: '/tasks',      icon: CheckSquare,     label: 'Tasks'        },
  { to: '/attendees',  icon: Users,           label: 'Attendees'    },
  { to: '/transcribe', icon: Mic,             label: 'AI Transcribe'},
  { to: '/scanner',    icon: QrCode,          label: 'Gate Scanner' },
];

// ─────────────────────────────────────────────
//  Sidebar Component
// ─────────────────────────────────────────────
function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold-glow flex-shrink-0">
            <Music2 size={16} className="text-sage-900" />
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-display font-bold text-lg leading-none truncate">Cello</h1>
            <p className="text-sage-300 text-xs leading-none mt-0.5">Planner</p>
          </div>
        </div>

        {/* Collapsed logo icon */}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold-glow mx-auto">
            <Music2 size={16} className="text-sage-900" />
          </div>
        )}

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggle}
          className="hidden lg:flex w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 items-center justify-center transition-colors duration-200 flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} className="text-sage-200" /> : <ChevronLeft size={14} className="text-sage-200" />}
        </button>
      </div>

      {/* ── Nav Links ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={20} className="flex-shrink-0" />
            <span
              className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              }`}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* ── User Footer ── */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <NavLink
          to="/settings"
          onClick={onMobileClose}
          className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={20} className="flex-shrink-0" />
          <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            Settings
          </span>
        </NavLink>

        <button
          onClick={logout}
          className="sidebar-link w-full text-left group"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} className="flex-shrink-0 group-hover:text-red-300 transition-colors" />
          <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap group-hover:text-red-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            Logout
          </span>
        </button>

        {/* User badge */}
        {!collapsed && user && (
          <div className="mt-3 px-4 py-3 rounded-xl bg-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center flex-shrink-0 shadow-gold-glow">
              <span className="text-sage-900 font-bold text-sm">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.name}</p>
              <p className="text-sage-300 text-xs truncate">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 bg-sage-gradient transition-all duration-300 ease-in-out flex-shrink-0 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-sage-900/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside className="relative w-72 h-full bg-sage-gradient flex flex-col shadow-2xl">
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-sage-200" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
//  Top Bar
// ─────────────────────────────────────────────
function TopBar({ onMobileMenuOpen }) {
  const { user } = useAuth();
  const location = useLocation();

  const currentPage = navItems.find((n) => location.pathname.startsWith(n.to));
  const pageTitle = currentPage?.label ?? 'Settings';

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 bg-white/60 backdrop-blur-md border-b border-white/40 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-xl hover:bg-sage-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} className="text-sage-700" />
        </button>
        <h2 className="text-sage-800 font-display font-semibold text-xl">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell (static for now) */}
        <button className="relative p-2 rounded-xl hover:bg-sage-100 transition-colors">
          <Bell size={20} className="text-sage-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold-400 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center shadow-gold-glow">
          <span className="text-sage-900 font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────
//  Authenticated Shell
// ─────────────────────────────────────────────
function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMobileMenuOpen={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Routes>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/events/*"   element={<EventsPage />} />
            <Route path="/tasks"      element={<TasksPage />} />
            <Route path="/attendees"  element={<AttendeesPage />} />
            <Route path="/transcribe" element={<TranscribePage />} />
            <Route path="/scanner"    element={<GateScannerPage />} />
            <Route path="/settings"   element={<SettingsPage />} />
            <Route path="*"           element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
//  Root App
// ─────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected Shell */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Redirect authenticated users away from login/register
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}
