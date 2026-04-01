import React, { useState, useEffect, useCallback } from 'react'
import { Newspaper, Users, RefreshCw, TrendingUp, Eye, Tag, CheckCircle, Key } from 'lucide-react'
import StatCard from '../components/StatCard'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'
import { fetchAdminData } from '../api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const CAT_COLORS = {
  Technology: '#3b82f6', Business: '#8b5cf6', Health: '#10b981',
  Sports: '#f59e0b', Entertainment: '#ef4444', General: '#94a3b8',
}

function timeAgo(ts) {
  if (!ts) return '—'
  const date = ts?.toDate ? ts.toDate() : new Date(ts)
  const diff = Date.now() - date.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function Dashboard() {
  const [adminStats, setAdminStats] = useState(null)
  const [users, setUsers] = useState([])          // from admin API (Firebase Auth)
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch admin data (accurate user list from Firebase Auth) + Firestore articles/categories
      const [adminData, aSnap, cSnap] = await Promise.all([
        fetchAdminData().catch(() => null),
        getDocs(collection(db, 'articles')),
        getDocs(collection(db, 'categories')),
      ])
      if (adminData?.success) {
        setAdminStats(adminData.stats)
        setUsers(adminData.users || [])
      }
      setArticles(aSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setCategories(cSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error('Load error:', e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Stats
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status !== 'blocked').length
  const totalArticles = articles.length
  const activeArticles = articles.filter(a => a.isActive !== false).length
  const trendingArticles = articles.filter(a => a.isTrending).length
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0)

  // Category distribution for pie chart
  const catCounts = {}
  articles.forEach(a => {
    if (a.category) catCounts[a.category] = (catCounts[a.category] || 0) + 1
  })
  const pieData = Object.entries(catCounts).map(([name, value]) => ({
    name, value, color: CAT_COLORS[name] || '#94a3b8'
  })).sort((a, b) => b.value - a.value)

  // Recent users (last 5)
  const recentUsers = [...users]
    .sort((a, b) => {
      const ta = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at || 0)
      const tb = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at || 0)
      return tb - ta
    })
    .slice(0, 5)

  // Recent articles (last 5)
  const recentArticles = [...articles]
    .sort((a, b) => {
      const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
      const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
      return tb - ta
    })
    .slice(0, 5)

  const Skeleton = () => <div className="h-5 w-16 animate-pulse rounded bg-slate-800" />

  return (
    <div className="animate-fade-up space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Live data from Firebase Firestore</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-400 transition hover:text-slate-200">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={loading ? '—' : (adminStats?.total_users ?? totalUsers)} change={null} icon={Users} gradientFrom="#6d28d9" gradientTo="#8b5cf6" glowClass="glow-purple" />
        <StatCard title="Total Articles" value={loading ? '—' : totalArticles} change={null} icon={Newspaper} gradientFrom="#b45309" gradientTo="#f59e0b" glowClass="glow-amber" />
        <StatCard title="Total API Keys" value={loading ? '—' : (adminStats?.total_api_keys ?? '—')} change={null} icon={Key} gradientFrom="#047857" gradientTo="#10b981" glowClass="glow-green" />
        <StatCard title="Trending" value={loading ? '—' : trendingArticles} change={null} icon={TrendingUp} gradientFrom="#1d4ed8" gradientTo="#3b82f6" glowClass="glow-blue" />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Active Users', val: loading ? null : (adminStats?.active_users ?? activeUsers), color: 'text-emerald-400' },
          { label: 'Blocked Users', val: loading ? null : (adminStats?.blocked_users ?? users.filter(u => u.status === 'blocked').length), color: 'text-red-400' },
          { label: 'Active Articles', val: loading ? null : activeArticles, color: 'text-blue-400' },
          { label: 'Active API Keys', val: loading ? null : (adminStats?.active_api_keys ?? '—'), color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="mb-1 text-xs text-slate-500">{s.label}</p>
            {s.val === null ? <Skeleton /> : <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>}
          </div>
        ))}
      </div>

      {/* Middle Row - Pie Chart + Recent Articles */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Category Pie Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-1 flex items-center gap-2">
            <Tag size={15} className="text-slate-500" />
            <h2 className="font-bold text-slate-100">Articles by Category</h2>
          </div>
          <p className="mb-4 text-xs text-slate-500">Real data from Firestore</p>
          {loading ? (
            <div className="flex h-40 items-center justify-center text-slate-600 text-sm">Loading…</div>
          ) : pieData.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-slate-600 text-sm">No articles yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={v => [v + ' articles']} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-sm" style={{ background: item.color }} />
                      <span className="text-xs text-slate-400">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-200">{item.value} articles</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Articles */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper size={15} className="text-slate-500" />
              <h2 className="font-bold text-slate-100">Recent Articles</h2>
            </div>
            <span className="text-xs text-slate-500">{activeArticles} active</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-600 text-sm">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" /> Loading…
            </div>
          ) : recentArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-600">
              <Newspaper size={28} className="mb-2" />
              <p className="text-sm">No articles yet. Add from Articles page.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentArticles.map(a => (
                <div key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt="" className="h-10 w-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-14 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                      <Newspaper size={14} className="text-slate-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-200">{a.title}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">{a.category}</span>
                      <span className="text-slate-700">·</span>
                      <span className="flex items-center gap-0.5 text-[11px] text-slate-500"><Eye size={10} /> {a.views || 0}</span>
                      {a.isTrending && <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">Trending</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.isActive !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/50 text-slate-500'}`}>
                      {a.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                    <p className="mt-0.5 text-[11px] text-slate-600">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row - Recent Users */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-slate-500" />
            <h2 className="font-bold text-slate-100">Recent Users</h2>
          </div>
          <span className="text-xs text-slate-500">{totalUsers} total</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-600 text-sm">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" /> Loading…
          </div>
        ) : recentUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-600">
            <Users size={28} className="mb-2" />
            <p className="text-sm">No users yet. Users appear after signup.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/40 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-bold text-white">
                  {(u.name || u.email || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-slate-200">{u.name || 'User'}</p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${u.plan === 'pro' ? 'bg-violet-500/10 text-violet-400' : u.plan === 'enterprise' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700/50 text-slate-400'}`}>{u.plan || 'free'}</span>
                  <div className="mt-0.5 flex items-center justify-end gap-1">
                    <CheckCircle size={10} className={u.status === 'blocked' ? 'text-red-400' : 'text-emerald-400'} />
                    <span className="text-[10px] text-slate-600">{u.status || 'active'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
