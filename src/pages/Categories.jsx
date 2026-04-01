import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Edit2, Save, X, RefreshCw, Tag } from 'lucide-react'
import { db } from '../firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

const inputCls = "w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"

const DEFAULT_ICONS = ['💻', '💼', '❤️', '⚽', '🎬', '📰', '🌍', '🔬', '🎓', '🏛️', '🎨', '🚗']

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', icon: '📰' })
  const [delId, setDelId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const snap = await getDocs(collection(db, 'categories'))
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { setError('Firestore error: ' + e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditId(null); setForm({ name: '', icon: '📰' }); setModal(true) }
  const openEdit = (c) => { setEditId(c.id); setForm({ name: c.name, icon: c.icon || '📰' }); setModal(true) }

  const save = async () => {
    if (!form.name.trim()) { alert('Category name required'); return }
    setSaving(true)
    try {
      if (editId) {
        await updateDoc(doc(db, 'categories', editId), { ...form, updatedAt: serverTimestamp() })
        setCategories(p => p.map(c => c.id === editId ? { ...c, ...form } : c))
      } else {
        const newRef = await addDoc(collection(db, 'categories'), { ...form, createdAt: serverTimestamp() })
        setCategories(p => [...p, { id: newRef.id, ...form }])
      }
      setModal(false)
    } catch (e) { alert('Save failed: ' + e.message) }
    setSaving(false)
  }

  const del = async (id) => {
    try {
      await deleteDoc(doc(db, 'categories', id))
      setCategories(p => p.filter(c => c.id !== id))
    } catch (e) { alert('Delete failed: ' + e.message) }
    setDelId(null)
  }

  return (
    <div className="animate-fade-up space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">{categories.length} categories</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-400 transition hover:text-slate-200">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-90">
            <Plus size={15} /> Add Category
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">⚠️ {error}</div>}

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" /> Loading…
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 py-16 text-center">
          <Tag size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-500 text-sm">No categories yet.</p>
          <button onClick={openAdd} className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">Add First Category</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(c => (
            <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                {c.icon || '📰'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-100 truncate">{c.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Icon: {c.icon || '—'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(c)} className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 transition hover:border-blue-500 hover:text-blue-400"><Edit2 size={13} /></button>
                <button onClick={() => setDelId(c.id)} className="rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/20"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-700 px-7 py-5">
              <h2 className="text-lg font-bold text-slate-100">{editId ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setModal(false)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
            </div>
            <div className="space-y-5 px-7 py-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Category Name *</label>
                <input className={inputCls} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Technology" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Icon (Emoji)</label>
                <input className={inputCls} value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="Paste an emoji" maxLength={4} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {DEFAULT_ICONS.map(ico => (
                    <button key={ico} type="button" onClick={() => setForm(p => ({ ...p, icon: ico }))}
                      className={`rounded-lg border px-3 py-1.5 text-lg transition ${form.icon === ico ? 'border-blue-500 bg-blue-500/20' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}>
                      {ico}
                    </button>
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-xl">{form.icon || '📰'}</div>
                <span className="font-semibold text-slate-200">{form.name || 'Category Name'}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-700 px-7 py-5">
              <button onClick={() => setModal(false)} className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200">Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
                {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save size={14} />}
                {editId ? 'Save Changes' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setDelId(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-7 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10"><Trash2 size={22} className="text-red-400" /></div>
            <h3 className="mb-2 text-lg font-bold text-slate-100">Delete Category?</h3>
            <p className="mb-6 text-sm text-slate-500">This will permanently delete the category. Articles in this category won't be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)} className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200">Cancel</button>
              <button onClick={() => del(delId)} className="flex-1 rounded-xl bg-red-500/15 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/25">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
