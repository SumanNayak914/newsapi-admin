import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({ title, value, change, changeLabel = 'vs last month', icon: Icon, gradientFrom, gradientTo, glowClass = '', prefix = '', suffix = '' }) {
    const pos = change > 0
    const neutral = change === 0
    return (
        <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all hover:border-slate-700 ${glowClass}`}>
            {/* glow orb */}
            <div
                className="pointer-events-none absolute -right-5 -top-5 h-28 w-28 rounded-full opacity-10 blur-2xl"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
            />

            <div className="mb-4 flex items-start justify-between">
                <p className="text-sm font-medium text-slate-400">{title}</p>
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                >
                    <Icon size={18} className="text-white" />
                </div>
            </div>

            <p className="mb-3 text-4xl font-extrabold tracking-tight text-slate-100">
                {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </p>

            <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold
          ${pos ? 'bg-emerald-500/10 text-emerald-400' : neutral ? 'bg-slate-700/60 text-slate-400' : 'bg-red-500/10 text-red-400'}`}>
                    {pos ? <TrendingUp size={10} /> : neutral ? <Minus size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(change)}%
                </span>
                <span className="text-xs text-slate-500">{changeLabel}</span>
            </div>
        </div>
    )
}
