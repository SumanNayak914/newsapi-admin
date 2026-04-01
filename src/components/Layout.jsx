import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Newspaper, Key, BarChart3, Settings,
  LogOut, Menu, X, Zap, Bell, ChevronRight, Users, Tag, Mail
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/articles', label: 'Articles', icon: Newspaper },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/messages', label: 'Messages', icon: Mail, badge: true },
  { to: '/api-keys', label: 'API Keys', icon: Key },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout({ children }) {
  const [open, setOpen] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('admin_user') || '{"name":"Admin","email":"admin@newsapi.dev","role":"Super Admin"}')

  // Unread messages count fetch karo
  useEffect(() => {
    fetch('http://localhost:3000/api/contact')
      .then(r => r.json())
      .then(d => { if (d.success) setUnreadCount(d.unread || 0) })
      .catch(() => {})
  }, [])

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 transition-all duration-300 ${open ? 'w-64' : 'w-[72px]'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
          <div className="pulse-glow flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500">
            <Zap size={18} className="text-white fill-white" />
          </div>
          {open && (
            <div className="animate-fade-up overflow-hidden">
              <p className="text-base font-bold leading-none text-slate-100">NewsAPI</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">Admin Console</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {open && (
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Navigation</p>
          )}
          {navItems.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${open ? '' : 'justify-center'}
                 ${isActive ? 'sidebar-link-active' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`
              }
            >
              <div className="relative shrink-0">
                <Icon size={18} />
                {badge && unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {open && (
                <span className="animate-fade-up flex flex-1 items-center justify-between">
                  {label}
                  {badge && unreadCount > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User area */}
        <div className="border-t border-slate-800 p-3">
          {open ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-800/50 px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-500 text-sm font-bold text-white">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-600 text-slate-200">{user.name}</p>
                <p className="text-[11px] text-slate-500">{user.role}</p>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="rounded-lg p-1.5 text-slate-500 transition hover:text-red-400"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="flex w-full items-center justify-center rounded-xl p-2.5 text-slate-500 transition hover:text-red-400"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${open ? 'ml-64' : 'ml-[72px]'}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(!open)}
              className="rounded-lg border border-slate-700 bg-slate-800/60 p-2 text-slate-400 transition hover:text-slate-200"
            >
              {open ? <X size={15} /> : <Menu size={15} />}
            </button>
            <div className="flex items-center gap-2 text-[13px] text-slate-500">
              <span>NewsAPI</span>
              <ChevronRight size={13} />
              <span className="text-slate-400">Admin Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button className="rounded-lg border border-slate-700 bg-slate-800/60 p-2 text-slate-400 transition hover:text-slate-200">
                <Bell size={15} />
              </button>
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-slate-950 bg-red-500" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-xs font-bold text-white">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-[13px] font-medium text-slate-200">{user.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-slate-950 p-7">
          {children}
        </main>
      </div>
    </div>
  )
}
