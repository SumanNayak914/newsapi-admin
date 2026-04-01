import React, { useState, useEffect } from 'react'
import { Users, RefreshCw, Search, Shield, Mail, Key, Activity, Trash2, Ban, CheckCircle } from 'lucide-react'
import { fetchAdminData, deleteUser, blockUser, unblockUser, upgradePlan } from '../api'

function timeAgo(iso) {
    if (!iso) return '—'
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

const PLAN_BADGE = {
    free: 'bg-slate-700/50 text-slate-400',
    pro: 'bg-violet-500/10 text-violet-400',
    enterprise: 'bg-amber-500/10 text-amber-400',
}

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState('users')
    const [selectedUser, setSelectedUser] = useState(null)
    const [actionLoading, setActionLoading] = useState(null) // uid of user being actioned
    const [deleteConfirm, setDeleteConfirm] = useState(null) // uid of user to confirm delete

    const load = async () => {
        setLoading(true)
        setError('')
        try {
            const data = await fetchAdminData()
            if (data.success) {
                setUsers(data.users || [])
                setLogs(data.login_logs || [])
            } else {
                setError('Failed to load user data')
            }
        } catch {
            setError('Cannot reach NewsHub backend (port 3000). Please start it.')
        }
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const filteredUsers = users.filter(u =>
        (u.name + u.email).toLowerCase().includes(search.toLowerCase())
    )
    const filteredLogs = logs.filter(l =>
        (l.user_name + l.email + l.ip + l.device).toLowerCase().includes(search.toLowerCase())
    )

    const handleBlock = async (u) => {
        setActionLoading(u.id)
        try {
            const action = u.status === 'blocked' ? 'unblock' : 'block'
            const fn = action === 'block' ? blockUser : unblockUser
            const res = await fn(u.id)
            if (res.success) {
                setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: action === 'block' ? 'blocked' : 'active' } : x))
                if (selectedUser?.id === u.id) setSelectedUser(prev => ({ ...prev, status: action === 'block' ? 'blocked' : 'active' }))
            } else {
                alert(res.error || 'Action failed')
            }
        } catch {
            alert('Server error')
        }
        setActionLoading(null)
    }

    const handleDelete = async (uid) => {
        setDeleteConfirm(null)
        setActionLoading(uid)
        try {
            const res = await deleteUser(uid)
            if (res.success) {
                setUsers(prev => prev.filter(u => u.id !== uid))
                if (selectedUser?.id === uid) setSelectedUser(null)
            } else {
                alert(res.error || 'Delete failed')
            }
        } catch {
            alert('Server error')
        }
        setActionLoading(null)
    }

    const handlePlanChange = async (uid, newPlan) => {
        setActionLoading(uid + '_plan')
        try {
            const res = await upgradePlan(uid, newPlan)
            if (res.success) {
                setUsers(prev => prev.map(u => u.id === uid ? { ...u, plan: newPlan } : u))
                if (selectedUser?.id === uid) setSelectedUser(prev => ({ ...prev, plan: newPlan }))
            } else {
                alert(res.error || 'Plan update failed')
            }
        } catch {
            alert('Server error')
        }
        setActionLoading(null)
    }

    const inputCls = "w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"

    return (
        <div className="animate-fade-up space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Users</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {users.length} registered &nbsp;·&nbsp;
                        {users.filter(u => u.status === 'blocked').length} blocked &nbsp;·&nbsp;
                        <span className="text-blue-400">{users.filter(u => u.provider === 'google').length} Google</span> &nbsp;·&nbsp;
                        <span className="text-slate-400">{users.filter(u => u.provider !== 'google').length} Email</span>
                    </p>
                </div>
                <button onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-400 transition hover:text-slate-200">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                    <span>⚠️</span> {error}
                    <button onClick={load} className="ml-auto text-xs underline">Retry</button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                {[
                    { label: 'Total Users', val: users.length, color: 'text-slate-200' },
                    { label: 'Active', val: users.filter(u => u.status === 'active').length, color: 'text-emerald-400' },
                    { label: 'Blocked', val: users.filter(u => u.status === 'blocked').length, color: 'text-red-400' },
                    { label: 'Google Users', val: users.filter(u => u.provider === 'google').length, color: 'text-blue-400' },
                    { label: 'No Password', val: users.filter(u => !u.has_password).length, color: 'text-amber-400' },
                ].map(s => (
                    <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
                        <p className="mb-1 text-xs text-slate-500">{s.label}</p>
                        <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
                    </div>
                ))}
            </div>

            {/* Tabs + Search */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1">
                    {[['users', 'Users'], ['logins', 'Login History']].map(([id, label]) => (
                        <button key={id} onClick={() => setTab(id)}
                            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${tab === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                            {label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input className={`${inputCls} pl-8`} placeholder={tab === 'users' ? 'Search users…' : 'Search logs…'} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {/* Users Table */}
            {tab === 'users' && (
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                    {loading ? (
                        <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" /> Loading users…
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        {['User', 'Email', 'Provider', 'Plan', 'API Keys', 'Status', 'Last Login', 'Actions'].map((h, i) => (
                                            <th key={i} className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500 ${i === 7 ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="transition hover:bg-slate-800/40 cursor-pointer" onClick={() => setSelectedUser(u)}>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-xs font-bold text-white">{u.name?.[0] || '?'}</div>
                                                    <span className="font-medium text-slate-200">{u.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-400">{u.email}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold w-fit ${
                                                        u.provider === 'google'
                                                            ? 'bg-blue-500/10 text-blue-400'
                                                            : 'bg-slate-700/50 text-slate-400'
                                                    }`}>
                                                        {u.provider === 'google' ? '🔵 Google' : '✉️ Email'}
                                                    </span>
                                                    {!u.has_password && (
                                                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 w-fit">No Password</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PLAN_BADGE[u.plan] || PLAN_BADGE.free}`}>{u.plan}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-300">{u.api_keys}</td>
                                            <td className="px-4 py-3.5">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-500">{timeAgo(u.last_login)}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                    {/* Block / Unblock */}
                                                    <button
                                                        disabled={actionLoading === u.id}
                                                        onClick={() => handleBlock(u)}
                                                        title={u.status === 'blocked' ? 'Unblock user' : 'Block user'}
                                                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition disabled:opacity-40 flex items-center gap-1 ${u.status === 'blocked' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}>
                                                        {actionLoading === u.id ? (
                                                            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                                        ) : u.status === 'blocked' ? (
                                                            <><CheckCircle size={11} /> Unblock</>
                                                        ) : (
                                                            <><Ban size={11} /> Block</>
                                                        )}
                                                    </button>
                                                    {/* Permanent Delete */}
                                                    <button
                                                        disabled={actionLoading === u.id}
                                                        onClick={() => setDeleteConfirm(u.id)}
                                                        title="Permanently delete user"
                                                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-40 flex items-center gap-1">
                                                        <Trash2 size={11} /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr><td colSpan={8} className="py-14 text-center text-slate-600">No users found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Login History Table */}
            {tab === 'logins' && (
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                    {loading ? (
                        <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" /> Loading login logs…
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-14 text-center text-slate-600">No login records yet</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        {['Status', 'User', 'Email', 'IP Address', 'Device/Browser', 'Time'].map((h, i) => (
                                            <th key={i} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {filteredLogs.map(log => (
                                        <tr key={log.id} className={`transition hover:bg-slate-800/40 ${log.status === 'failed' ? 'bg-red-500/[0.02]' : ''}`}>
                                            <td className="px-4 py-3.5">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {log.status === 'success' ? '✓ Success' : '✗ Failed'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 font-medium text-slate-200">{log.user_name}</td>
                                            <td className="px-4 py-3.5 text-slate-400">{log.email}</td>
                                            <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{log.ip}</td>
                                            <td className="px-4 py-3.5 text-slate-400">{log.device}</td>
                                            <td className="px-4 py-3.5 text-xs text-slate-500">{timeAgo(log.time)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl">
                        <div className="flex items-center justify-center mb-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                                <Trash2 size={24} className="text-red-400" />
                            </div>
                        </div>
                        <h2 className="text-lg font-bold text-slate-100 text-center mb-2">Delete User?</h2>
                        <p className="text-sm text-slate-400 text-center mb-6">
                            Yeh action permanent hai. User ka account aur data permanently delete ho jayega.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)}
                                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200">
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-sm font-semibold text-white transition">
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
                    <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-xl font-bold text-white">{selectedUser.name?.[0] || '?'}</div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-100">{selectedUser.name}</h2>
                                <p className="text-sm text-slate-500">{selectedUser.email}</p>
                                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${selectedUser.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {selectedUser.status}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: Shield, label: 'Plan', val: selectedUser.plan },
                                { icon: Activity, label: 'Provider', val: selectedUser.provider || 'email' },
                                { icon: Key, label: 'API Keys', val: selectedUser.api_keys },
                                { icon: Activity, label: 'Total Requests', val: (selectedUser.total_requests || 0).toLocaleString() },
                                { icon: Mail, label: 'Email', val: selectedUser.email },
                                { icon: Users, label: 'Joined', val: selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '—' },
                            ].map(item => (
                                <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-800/50 p-3">
                                    <p className="mb-1 text-xs text-slate-500">{item.label}</p>
                                    <p className="text-sm font-semibold text-slate-200 truncate">{item.val}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex gap-2">
                            {['free', 'pro', 'enterprise'].map(p => (
                                <button
                                    key={p}
                                    disabled={selectedUser.plan === p || actionLoading === selectedUser.id + '_plan'}
                                    onClick={() => handlePlanChange(selectedUser.id, p)}
                                    className={`flex-1 rounded-xl border py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                                        selectedUser.plan === p
                                            ? 'border-blue-500 bg-blue-500/10 text-blue-400 opacity-100 cursor-default'
                                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-50'
                                    }`}
                                >
                                    {actionLoading === selectedUser.id + '_plan' && selectedUser.plan !== p ? '...' : p}
                                </button>
                            ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button
                                onClick={() => handleBlock(selectedUser)}
                                disabled={actionLoading === selectedUser.id}
                                className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition disabled:opacity-40 ${selectedUser.status === 'blocked' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}>
                                {selectedUser.status === 'blocked' ? 'Unblock' : 'Block'}
                            </button>
                            <button
                                onClick={() => { setSelectedUser(null); setDeleteConfirm(selectedUser.id) }}
                                className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 transition">
                                Delete
                            </button>
                        </div>
                        <button onClick={() => setSelectedUser(null)} className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200">Close</button>
                    </div>
                </div>
            )}
        </div>
    )
}
