import React, { useState, useEffect } from 'react'
import { Copy, Eye, EyeOff, Trash2, RefreshCw, Check, Key, User } from 'lucide-react'
import { fetchAdminData, deleteApiKey } from '../api'

export default function ApiKeys() {
    const [keys, setKeys] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [delId, setDelId] = useState(null)
    const [copied, setCopied] = useState(null)
    const [revealed, setRevealed] = useState({})
    const [search, setSearch] = useState('')

    const loadKeys = async () => {
        setLoading(true)
        setError('')
        try {
            const data = await fetchAdminData()
            if (data.success) {
                setKeys(data.api_keys || [])
            } else {
                setError(data.error || 'Failed to load API keys. Make sure Next.js server is running on port 3000.')
            }
        } catch (err) {
            setError('Cannot reach Next.js server (port 3000). Make sure it is running.')
        }
        setLoading(false)
    }

    useEffect(() => { loadKeys() }, [])

    const copyKey = (id, k) => {
        navigator.clipboard.writeText(k).catch(() => { })
        setCopied(id)
        setTimeout(() => setCopied(null), 1800)
    }

    const toggleReveal = (id) => setRevealed(p => ({ ...p, [id]: !p[id] }))
    const maskKey = (k) => k ? k.slice(0, 8) + '●'.repeat(20) + k.slice(-6) : '—'
    const displayVal = (k) => k.key ? (revealed[k.id] ? k.key : maskKey(k.key)) : k.masked_key;

    const del = async (id) => {
        try {
            await deleteApiKey(id)
        } catch { }
        setKeys(p => p.filter(k => k.id !== id))
        setDelId(null)
    }

    const filteredKeys = keys.filter(k =>
        (k.name + (k.user_name || '') + (k.user_email || '') + (k.key || '')).toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="animate-fade-up space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">API Keys</h1>
                    <p className="mt-1 text-sm text-slate-500">{keys.filter(k => k.status === 'active').length} active · {keys.length} total across all users</p>
                </div>
                <button onClick={loadKeys} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-400 transition hover:text-slate-200">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                    <span>⚠️</span> {error}
                    <button onClick={loadKeys} className="ml-auto text-xs underline hover:no-underline">Retry</button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                    { label: 'Total Keys', val: keys.length, color: 'text-slate-200' },
                    { label: 'Active', val: keys.filter(k => k.status === 'active').length, color: 'text-emerald-400' },
                    { label: 'Req. Today', val: keys.reduce((a, k) => a + (k.requests_today || 0), 0).toLocaleString(), color: 'text-blue-400' },
                    { label: 'Flagged', val: keys.filter(k => k.flagged).length, color: 'text-red-400' },
                ].map(s => (
                    <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
                        <p className="mb-1 text-xs text-slate-500">{s.label}</p>
                        <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div>
                <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Search by key name, user name, email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Keys list */}
            {loading ? (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 py-16 text-slate-500">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
                    Loading all API keys…
                </div>
            ) : filteredKeys.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 py-14 text-center text-slate-600">
                    {search ? 'No keys match your search.' : 'No API keys created yet by any user.'}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredKeys.map(k => (
                        <div key={k.id} className={`rounded-2xl border bg-slate-900 p-5 transition hover:border-slate-700 ${k.status === 'active' ? 'border-slate-800' : 'border-slate-800/50 opacity-70'}`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                                        <Key size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-100">{k.name}</p>
                                        {/* User info */}
                                        {(k.user_name || k.user_email) && (
                                            <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                <User size={10} />
                                                {k.user_name || k.user_email}
                                                {k.user_name && k.user_email && <span className="text-slate-600">({k.user_email})</span>}
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-600 mt-0.5">
                                            Created {k.created_at ? new Date(k.created_at).toLocaleDateString() : '—'} · {k.rate_limit || '1000/day'} · Plan: {k.plan || 'free'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/60 text-slate-500'}`}>
                                        {k.status || 'active'}
                                    </span>
                                    {k.flagged && (
                                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-500/10 text-red-400">Flagged</span>
                                    )}
                                    <button onClick={() => setDelId(k.id)} className="rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/20">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 flex-1 max-w-[400px]">
                                    <code className="flex-1 truncate font-mono text-xs text-slate-300">
                                        {displayVal(k)}
                                    </code>
                                    {k.key && (
                                        <>
                                            <button onClick={() => toggleReveal(k.id)} className="shrink-0 text-slate-500 transition hover:text-slate-300">
                                                {revealed[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                            <button onClick={() => copyKey(k.id, k.key)} className="shrink-0 rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-400 transition hover:text-slate-200">
                                                {copied === k.id
                                                    ? <span className="flex items-center gap-1 text-emerald-400"><Check size={12} /> Copied</span>
                                                    : <span className="flex items-center gap-1"><Copy size={12} /> Copy</span>
                                                }
                                            </button>
                                        </>
                                    )}
                                </div>
                                {!k.key && <span className="text-[10px] text-amber-500 uppercase tracking-wider font-bold shrink-0 ml-4 border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 rounded shadow-sm">Secure Hashed</span>}
                            </div>

                            {/* Usage bar */}
                            <div className="mt-3">
                                <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                                    <span>Today's Usage</span>
                                    <span className="font-medium text-slate-300">{(k.requests_today || 0).toLocaleString()} / {k.rate_limit || '1000/day'}</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-500"
                                        style={{ width: `${Math.min(100, ((k.requests_today || 0) / parseInt(k.rate_limit || '1000')) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete confirm */}
            {delId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setDelId(null)}>
                    <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-7 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                            <Trash2 size={22} className="text-red-400" />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-slate-100">Revoke API Key?</h3>
                        <p className="mb-6 text-sm text-slate-500">All apps using this key will lose access immediately.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDelId(null)} className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200">Cancel</button>
                            <button onClick={() => del(delId)} className="flex-1 rounded-xl bg-red-500/15 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/25">Revoke</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
