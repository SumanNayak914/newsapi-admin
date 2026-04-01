import React, { useState, useEffect } from 'react'
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { TrendingUp, Globe, Zap, Clock, Activity, Loader2 } from 'lucide-react'
import { fetchAnalytics } from '../api'

const TT = ({ active, payload, label }) =>
    active && payload?.length ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs shadow-xl">
            <p className="mb-2 font-semibold text-slate-400">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color || p.payload?.color || '#3b82f6' }} className="font-semibold">
                    {p.name}: {Number(p.value).toLocaleString()}
                </p>
            ))}
        </div>
    ) : null

export default function Analytics() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [data, setData] = useState({
        dailyData: [],
        hourlyData: [],
        categoryBar: [],
        deviceData: [],
        kpis: { total_7d: 0, today_req: 0, unique_today: 0 }
    })

    useEffect(() => {
        let mounted = true
        fetchAnalytics()
            .then(res => {
                if (!mounted) return
                if (res.success) {
                    setData(res.data)
                } else {
                    setError(res.error || 'Failed to fetch analytics')
                }
            })
            .catch(e => {
                if (mounted) setError(e.message)
            })
            .finally(() => {
                if (mounted) setLoading(false)
            })
        return () => { mounted = false }
    }, [])

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
                <p className="font-semibold">Error loading analytics</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        )
    }

    const { dailyData, hourlyData, categoryBar, deviceData, kpis } = data

    // Calculate dynamic KPIs based on real data
    const kpiCards = [
        { label: 'Total Requests (7D)', value: kpis.total_7d.toLocaleString(), sub: 'Last 7 days', Icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Requests Today', value: kpis.today_req.toLocaleString(), sub: 'Today', Icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Unique IPs Today', value: kpis.unique_today.toLocaleString(), sub: 'Distinct callers', Icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Device Types', value: `${deviceData.length} Platforms`, sub: 'Detected devices', Icon: Globe, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    ]

    return (
        <div className="animate-fade-up space-y-7">
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Live Analytics</h1>
                <p className="mt-1 text-sm text-slate-500">Real-time API performance & usage insights</p>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {kpiCards.map(k => (
                    <div key={k.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${k.bg}`}>
                            <k.Icon size={18} className={k.color} />
                        </div>
                        <p className="text-2xl font-extrabold tracking-tight text-slate-100">{k.value}</p>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">{k.label}</p>
                        <p className="mt-1 text-[11px] text-emerald-500">{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* Daily traffic */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-slate-100">Daily Traffic (Last 7 Days)</h2>
                        <p className="text-xs text-slate-500">Total API requests & unique consumers across all endpoints</p>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Requests</span>
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" />Unique IPs</span>
                    </div>
                </div>
                {dailyData.length === 0 ? (
                    <div className="flex h-60 items-center justify-center text-sm text-slate-500">No traffic data in the last 7 days.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={dailyData}>
                            <defs>
                                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={45} />
                            <Tooltip content={<TT />} />
                            <Area type="monotone" dataKey="requests" name="Requests" stroke="#3b82f6" fill="url(#gR)" strokeWidth={2.5} dot={true} />
                            <Area type="monotone" dataKey="unique" name="Unique IPs" stroke="#8b5cf6" fill="url(#gU)" strokeWidth={2} dot={true} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Hourly + Category */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {/* Hourly heatmap via bar */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <h2 className="mb-1 font-bold text-slate-100">Requests by Hour (Today)</h2>
                    <p className="mb-5 text-xs text-slate-500">Traffic pattern over latest 24 hours</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={hourlyData} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                            <Tooltip content={<TT />} />
                            <Bar dataKey="req" name="Requests" radius={[4, 4, 0, 0]}>
                                {hourlyData.map((d, i) => (
                                    <Cell key={i} fill={d.req > 0 ? '#3b82f6' : '#1e3a5f'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Category hits */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <h2 className="mb-1 font-bold text-slate-100">Requests by Category (7D)</h2>
                    <p className="mb-5 text-xs text-slate-500">Which news categories are most queried</p>
                    
                    {categoryBar.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-slate-500">No category data logged yet.</div>
                    ) : (
                        <div className="space-y-3.5 max-h-[190px] overflow-y-auto pr-2 custom-scrollbar">
                            {categoryBar.map(c => (
                                <div key={c.cat}>
                                    <div className="mb-1.5 flex justify-between">
                                        <span className="text-xs text-slate-400">{c.cat}</span>
                                        <span className="text-xs font-semibold text-slate-300">{c.hits.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${Math.max(2, (c.hits / categoryBar[0].hits) * 100).toFixed(0)}%`, background: c.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Device / Platform distribution */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="mb-1 font-bold text-slate-100">Device & Platform Distribution</h2>
                <p className="mb-5 text-xs text-slate-500">Operating systems and devices hitting the API (Last 7 Days)</p>
                {deviceData.length === 0 ? (
                    <div className="flex justify-center text-sm text-slate-500 py-10">No devices detected yet. Send a request to see it here!</div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
                        {deviceData.map(g => (
                            <div key={g.device} className="rounded-xl border border-slate-800 bg-slate-800/50 p-4 text-center">
                                <div className="mb-2 text-3xl">{g.icon}</div>
                                <p className="text-xl font-extrabold text-slate-100">{g.pct}%</p>
                                <p className="mt-0.5 text-xs text-slate-500">{g.device}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
            `}</style>
        </div>
    )
}
