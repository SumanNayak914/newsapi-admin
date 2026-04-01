import React, { useState, useEffect, useCallback } from 'react'
import { Mail, MailOpen, RefreshCw, Reply, Trash2, Search, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const API_BASE = 'http://localhost:3000'

const STATUS_CONFIG = {
  unread:  { label: 'Unread',  color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   icon: Mail },
  read:    { label: 'Read',    color: 'bg-slate-700/50 text-slate-400 border-slate-600/20', icon: MailOpen },
  replied: { label: 'Replied', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Messages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState(null) // selected message detail
  const [updating, setUpdating] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE}/api/contact`)
      const data = await res.json()
      if (data.success) setMessages(data.messages)
      else setError(data.error || 'Messages load nahi hue.')
    } catch (e) { setError('API se connect nahi ho paya: ' + e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    setUpdating(id)
    try {
      await fetch(`${API_BASE}/api/contact`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      setMessages(p => p.map(m => m.id === id ? { ...m, status } : m))
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
    } catch (e) { alert('Update failed: ' + e.message) }
    setUpdating(null)
  }

  const filtered = messages.filter(m => {
    const matchSearch = (m.name + m.email + m.subject + m.message).toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || m.status === filterStatus
    return matchSearch && matchStatus
  })

  const unread = messages.filter(m => m.status === 'unread').length

  return (
    <div className="animate-fade-up h-full">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            Messages
            {unread > 0 && (
              <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white">
                {unread} new
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{messages.length} total · {unread} unread</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-400 transition hover:text-slate-200">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: messages.length, color: 'text-slate-200' },
          { label: 'Unread', value: messages.filter(m => m.status === 'unread').length, color: 'text-blue-400' },
          { label: 'Replied', value: messages.filter(m => m.status === 'replied').length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="mb-1 text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="flex gap-5" style={{ height: 'calc(100vh - 260px)' }}>
        {/* Message List */}
        <div className="flex w-full max-w-sm flex-col rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          {/* Filters */}
          <div className="border-b border-slate-800 p-3 space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-8 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-blue-500"
                placeholder="Search messages…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1">
              {['all', 'unread', 'read', 'replied'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`flex-1 rounded-lg py-1 text-xs font-semibold capitalize transition ${filterStatus === s ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >{s}</button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-600">
                {messages.length === 0 ? 'Koi message nahi aaya abhi tak.' : 'No messages match your filter.'}
              </div>
            ) : (
              filtered.map(m => {
                const S = STATUS_CONFIG[m.status] || STATUS_CONFIG.read
                const isSelected = selected?.id === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => { setSelected(m); if (m.status === 'unread') updateStatus(m.id, 'read') }}
                    className={`w-full text-left px-4 py-3.5 transition hover:bg-slate-800/60 ${isSelected ? 'bg-slate-800/80 border-l-2 border-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-sm ${m.status === 'unread' ? 'text-slate-100' : 'text-slate-300'}`}>{m.name}</span>
                      <span className="text-[11px] text-slate-600">{timeAgo(m.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{m.subject}</p>
                    <p className={`text-xs truncate mt-0.5 ${m.status === 'unread' ? 'text-slate-300' : 'text-slate-500'}`}>{m.message}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${S.color}`}>
                        <S.icon size={10} />{S.label}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col">
          {selected ? (
            <>
              {/* Detail Header */}
              <div className="border-b border-slate-800 px-7 py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">{selected.subject}</h2>
                    <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                      <span className="font-medium text-slate-400">{selected.name}</span>
                      <span>·</span>
                      <a href={`mailto:${selected.email}`} className="text-blue-400 hover:underline">{selected.email}</a>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock size={12} />{timeAgo(selected.createdAt)}</span>
                    </div>
                  </div>
                  <div>
                    {(() => { const S = STATUS_CONFIG[selected.status] || STATUS_CONFIG.read; return (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${S.color}`}>
                        <S.icon size={12} />{S.label}
                      </span>
                    )})()}
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div className="flex-1 overflow-y-auto px-7 py-6">
                <div className="max-w-2xl">
                  <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6">
                    <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{selected.message}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-800 px-7 py-4 flex items-center gap-3">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                  onClick={() => updateStatus(selected.id, 'replied')}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-90"
                >
                  <Reply size={14} /> Reply via Email
                </a>
                {selected.status !== 'read' && (
                  <button
                    onClick={() => updateStatus(selected.id, 'read')}
                    disabled={updating === selected.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-400 transition hover:text-slate-200 disabled:opacity-50"
                  >
                    <MailOpen size={14} /> Mark Read
                  </button>
                )}
                {selected.status !== 'replied' && (
                  <button
                    onClick={() => updateStatus(selected.id, 'replied')}
                    disabled={updating === selected.id}
                    className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <CheckCircle size={14} /> Mark Replied
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
              <div className="h-16 w-16 text-slate-700 mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
                <Mail size={28} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">Select a message to read</p>
              <p className="text-slate-600 text-sm mt-1">Messages from the Contact Us form will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
