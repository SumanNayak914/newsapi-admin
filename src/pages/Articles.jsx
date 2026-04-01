import React, { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Edit2, Trash2, Save, X, RefreshCw, Image, Eye, TrendingUp, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { db, storage } from '../firebase'
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const inputCls = "w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
const CAT_COLOR = { Technology: 'bg-blue-500/10 text-blue-400', Business: 'bg-violet-500/10 text-violet-400', Health: 'bg-emerald-500/10 text-emerald-400', Sports: 'bg-amber-500/10 text-amber-400', Entertainment: 'bg-red-500/10 text-red-400', General: 'bg-slate-700/50 text-slate-400' }
const PER = 8
const blankForm = { title: '', description: '', category: 'Technology', author: '', content: '', imageUrl: '', isTrending: false, isActive: true }

// Title se URL-safe slug banao (website ke saath match karne ke liye)
function makeSlug(title) {
  return title.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

const LabeledInput = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</label>
    {children}
  </div>
)

function EditorToolbar({ editor }) {
  if (!editor) return null
  const btn = (action, label, active) => (
    <button type="button" onClick={action} className={`rounded px-2 py-1 text-xs font-semibold transition ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}>{label}</button>
  )
  return (
    <div className="flex flex-wrap gap-1 rounded-t-xl border border-b-0 border-slate-700 bg-slate-800/80 px-2 py-2">
      {btn(() => editor.chain().focus().toggleBold().run(), 'B', editor.isActive('bold'))}
      {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', editor.isActive('heading', { level: 3 }))}
      {btn(() => editor.chain().focus().toggleBulletList().run(), '• List', editor.isActive('bulletList'))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. List', editor.isActive('orderedList'))}
      {btn(() => editor.chain().focus().toggleBlockquote().run(), '❝', editor.isActive('blockquote'))}
    </div>
  )
}

export default function Articles() {
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [delId, setDelId] = useState(null)
  const [selected, setSelected] = useState([])

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: { attributes: { class: 'min-h-[140px] px-3 py-2.5 text-sm text-slate-200 outline-none prose prose-invert max-w-none' } },
  })

  const loadArticles = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch {
      try {
        const snap = await getDocs(collection(db, 'articles'))
        setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) { setError('Firestore error: ' + e.message) }
    }
    setLoading(false)
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'categories'))
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch { setCategories([]) }
  }, [])

  useEffect(() => { loadArticles(); loadCategories() }, [loadArticles, loadCategories])

  const catList = categories.length > 0 ? categories.map(c => c.name) : ['Technology', 'Business', 'Health', 'Sports', 'Entertainment', 'General']

  const filtered = articles.filter(a => {
    const matchSearch = (a.title + (a.author || '') + (a.category || '')).toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'all' || a.category === filterCat
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? a.isActive !== false : a.isActive === false)
    return matchSearch && matchCat && matchStatus
  })
  const pages = Math.max(1, Math.ceil(filtered.length / PER))
  const rows = filtered.slice((page - 1) * PER, page * PER)

  const openAdd = () => { setEditId(null); setForm(blankForm); setImageFile(null); setImagePreview(''); editor?.commands.setContent(''); setModal(true) }
  const openEdit = (a) => {
    setEditId(a.id)
    setForm({ title: a.title || '', description: a.description || '', category: a.category || 'Technology', author: a.author || '', content: a.content || '', imageUrl: a.imageUrl || '', isTrending: !!a.isTrending, isActive: a.isActive !== false })
    setImageFile(null); setImagePreview(a.imageUrl || ''); editor?.commands.setContent(a.content || ''); setModal(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return }
    setImageFile(file); setImagePreview(URL.createObjectURL(file))
  }

  const save = async () => {
    if (!form.title.trim()) { alert('Title required'); return }
    setSaving(true)
    try {
      let imageUrl = form.imageUrl
      if (imageFile) {
        const storRef = ref(storage, `articles/${Date.now()}_${imageFile.name}`)
        await uploadBytes(storRef, imageFile)
        imageUrl = await getDownloadURL(storRef)
      }
      const content = editor?.getHTML() || form.content
      // Slug auto-generate karo title se (website ke liye zaroori)
      const slug = editId
        ? (articles.find(a => a.id === editId)?.slug || makeSlug(form.title))
        : makeSlug(form.title)
      const payload = { ...form, content, imageUrl, slug }
      if (editId) {
        await updateDoc(doc(db, 'articles', editId), { ...payload, updatedAt: serverTimestamp() })
        setArticles(p => p.map(a => a.id === editId ? { ...a, ...payload } : a))
      } else {
        payload.views = 0; payload.createdAt = serverTimestamp()
        const newRef = await addDoc(collection(db, 'articles'), payload)
        setArticles(p => [{ id: newRef.id, ...payload, createdAt: new Date() }, ...p])
      }
      setModal(false)
    } catch (e) { alert('Save failed: ' + e.message) }
    setSaving(false)
  }


  const softDelete = async (id) => {
    try { await updateDoc(doc(db, 'articles', id), { isActive: false, updatedAt: serverTimestamp() }); setArticles(p => p.map(a => a.id === id ? { ...a, isActive: false } : a)) } catch (e) { alert('Error: ' + e.message) }
    setDelId(null)
  }

  const toggleTrending = async (a) => {
    const val = !a.isTrending
    try { await updateDoc(doc(db, 'articles', a.id), { isTrending: val, updatedAt: serverTimestamp() }); setArticles(p => p.map(x => x.id === a.id ? { ...x, isTrending: val } : x)) } catch (e) { alert('Error: ' + e.message) }
  }

  const toggleActive = async (a) => {
    const val = a.isActive === false
    try { await updateDoc(doc(db, 'articles', a.id), { isActive: val, updatedAt: serverTimestamp() }); setArticles(p => p.map(x => x.id === a.id ? { ...x, isActive: val } : x)) } catch (e) { alert('Error: ' + e.message) }
  }

  const bulkPublish = async (isActive) => {
    for (const id of selected) await updateDoc(doc(db, 'articles', id), { isActive, updatedAt: serverTimestamp() })
    setArticles(p => p.map(a => selected.includes(a.id) ? { ...a, isActive } : a)); setSelected([])
  }

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const toggleAll = () => setSelected(selected.length === rows.length ? [] : rows.map(r => r.id))

  const downloadTemplate = () => {
    const header = "Title,Description,Category,Content,ImageUrl,Author,IsTrending\n";
    const example = '"The Future of AI","AI is changing everything","Technology","<p>Full HTML content here</p>","https://example.com/image.jpg","Suman Nayak","TRUE"\n';
    const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "articles_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length < 2) throw new Error("File empty or missing data rows.");
      
      const parseCSVRow = (str) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < str.length; i++) {
          if (str[i] === '"') inQuotes = !inQuotes;
          else if (str[i] === ',' && !inQuotes) { result.push(cur); cur = ''; }
          else cur += str[i];
        }
        result.push(cur);
        return result.map(s => s.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      };

      const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase());
      const rows = lines.slice(1);
      
      let count = 0;
      for (const row of rows) {
        const vals = parseCSVRow(row);
        const title = vals[headers.indexOf('title')] || '';
        if (!title) continue;
        
        await addDoc(collection(db, 'articles'), {
          title,
          description: vals[headers.indexOf('description')] || '',
          category: vals[headers.indexOf('category')] || 'General',
          content: vals[headers.indexOf('content')] || '',
          imageUrl: vals[headers.indexOf('imageurl')] || '',
          author: vals[headers.indexOf('author')] || '',
          isTrending: (vals[headers.indexOf('istrending')] || '').toUpperCase() === 'TRUE',
          isActive: true,
          views: 0,
          slug: makeSlug(title),
          createdAt: serverTimestamp()
        });
        count++;
      }
      alert(`Success! Imported ${count} articles.`);
      loadArticles();
    } catch (err) {
      alert("Error parsing CSV: " + err.message);
    }
    setLoading(false);
    e.target.value = null; // reset
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Articles</h1>
          <p className="mt-1 text-sm text-slate-500">{articles.length} total · {articles.filter(a => a.isActive !== false).length} active · {articles.filter(a => a.isTrending).length} trending</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={downloadTemplate} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700">Template</button>
          <button onClick={() => document.getElementById('csvUpload').click()} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-blue-400 transition hover:bg-slate-700 hover:text-blue-300"><Upload size={14} /> Bulk CSV</button>
          <input id="csvUpload" type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          
          <button onClick={loadArticles} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-400 transition hover:text-slate-200"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-90"><Plus size={15} /> Add Article</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[{ label: 'Total', val: articles.length, color: 'text-slate-200' }, { label: 'Active', val: articles.filter(a => a.isActive !== false).length, color: 'text-emerald-400' }, { label: 'Inactive', val: articles.filter(a => a.isActive === false).length, color: 'text-red-400' }, { label: 'Trending', val: articles.filter(a => a.isTrending).length, color: 'text-amber-400' }].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="mb-1 text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {error && <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">⚠️ {error}</div>}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
        <div className="relative min-w-[200px] flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className={`${inputCls} pl-8`} placeholder="Search articles…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-300 outline-none" value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1) }}>
          <option value="all">All Categories</option>
          {catList.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-300 outline-none" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-3">
          <span className="text-sm text-blue-400 font-semibold">{selected.length} selected</span>
          <button onClick={() => bulkPublish(true)} className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20">Publish All</button>
          <button onClick={() => bulkPublish(false)} className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20">Unpublish All</button>
          <button onClick={() => setSelected([])} className="ml-auto text-xs text-slate-500 hover:text-slate-300">Clear</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" /> Loading from Firestore…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="w-10 px-4 py-3"><input type="checkbox" checked={rows.length > 0 && selected.length === rows.length} onChange={toggleAll} className="rounded border-slate-600 bg-slate-800 accent-blue-500" /></th>
                  {['Article', 'Category', 'Author', 'Views', 'Trending', 'Status', 'Date', 'Actions'].map((h, i) => (
                    <th key={i} className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500 ${i === 7 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map(a => (
                  <tr key={a.id} className={`transition hover:bg-slate-800/40 ${a.isActive === false ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3.5"><input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggleSelect(a.id)} className="rounded border-slate-600 bg-slate-800 accent-blue-500" /></td>
                    <td className="px-4 py-3.5 max-w-[220px]">
                      <div className="flex items-center gap-2.5">
                        {a.imageUrl ? <img src={a.imageUrl} alt="" className="h-9 w-12 rounded-lg object-cover shrink-0" /> : <div className="h-9 w-12 rounded-lg bg-slate-700 flex items-center justify-center shrink-0"><Image size={14} className="text-slate-500" /></div>}
                        <div><p className="truncate font-medium text-slate-200 max-w-[160px]">{a.title}</p><p className="text-xs text-slate-600 truncate max-w-[160px]">{a.description}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CAT_COLOR[a.category] || CAT_COLOR.General}`}>{a.category}</span></td>
                    <td className="px-4 py-3.5 text-slate-400">{a.author || '—'}</td>
                    <td className="px-4 py-3.5"><span className="flex items-center gap-1 text-slate-400"><Eye size={12} /> {a.views || 0}</span></td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => toggleTrending(a)} className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${a.isTrending ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700'}`}>
                        <TrendingUp size={11} /> {a.isTrending ? 'Trending' : 'Normal'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => toggleActive(a)} className={`flex items-center gap-1 text-xs font-semibold transition ${a.isActive !== false ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-300'}`}>
                        {a.isActive !== false ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {a.isActive !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString() : a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(a)} className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 transition hover:border-blue-500 hover:text-blue-400"><Edit2 size={13} /></button>
                        <button onClick={() => setDelId(a.id)} className="rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/20"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={9} className="py-14 text-center text-slate-600">No articles found. Click "Add Article" to create one.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3.5">
            <span className="text-xs text-slate-500">Page {page} of {pages} · {filtered.length} articles</span>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 disabled:opacity-40"><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={`rounded-lg border px-3 py-1 text-xs font-semibold ${n === page ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>{n}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-700 bg-slate-900 px-7 py-5">
              <h2 className="text-lg font-bold text-slate-100">{editId ? 'Edit Article' : 'Add New Article'}</h2>
              <button onClick={() => setModal(false)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
            </div>
            <div className="space-y-5 px-7 py-6">
              <LabeledInput label="Cover Image">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-36 rounded-xl border border-slate-700 bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                    {imagePreview ? <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" /> : <Image size={22} className="text-slate-600" />}
                  </div>
                  <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-800/50 px-4 py-3 text-sm text-slate-400 hover:border-blue-500 hover:text-blue-400 transition">
                    <Upload size={15} />{imageFile ? imageFile.name : 'Click to upload image (max 2MB)'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              </LabeledInput>
              <LabeledInput label="Title *"><input className={inputCls} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Article title…" /></LabeledInput>
              <LabeledInput label="Short Description"><textarea className={`${inputCls} resize-none`} rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief summary…" /></LabeledInput>
              <div className="grid grid-cols-2 gap-4">
                <LabeledInput label="Category">
                  <select className={inputCls} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>{catList.map(c => <option key={c}>{c}</option>)}</select>
                </LabeledInput>
                <LabeledInput label="Author"><input className={inputCls} value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} placeholder="Author name" /></LabeledInput>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isTrending} onChange={e => setForm(p => ({ ...p, isTrending: e.target.checked }))} className="rounded border-slate-600 bg-slate-800 accent-amber-400 w-4 h-4" />
                  <span className="text-sm text-slate-300 font-medium">Mark as Trending</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded border-slate-600 bg-slate-800 accent-emerald-400 w-4 h-4" />
                  <span className="text-sm text-slate-300 font-medium">Active (Published)</span>
                </label>
              </div>
              <LabeledInput label="Full Content (Rich Text)">
                <div className="rounded-b-xl border border-slate-700 bg-slate-800">
                  <EditorToolbar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
              </LabeledInput>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 rounded-b-2xl border-t border-slate-700 bg-slate-900 px-7 py-5">
              <button onClick={() => setModal(false)} className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200">Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
                {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save size={14} />}
                {editId ? 'Save Changes' : 'Publish Article'}
              </button>
            </div>
          </div>
        </div>
      )}

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setDelId(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-7 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10"><Trash2 size={22} className="text-red-400" /></div>
            <h3 className="mb-2 text-lg font-bold text-slate-100">Mark as Inactive?</h3>
            <p className="mb-6 text-sm text-slate-500">Article will be hidden from website. You can reactivate anytime.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)} className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200">Cancel</button>
              <button onClick={() => softDelete(delId)} className="flex-1 rounded-xl bg-red-500/15 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/25">Mark Inactive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
