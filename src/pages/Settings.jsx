import React, { useState } from 'react'
import { Save, Check, Globe, Shield, Bell, Database, Key, Palette } from 'lucide-react'

const inputCls = "w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400"

function Section({ icon: Icon, title, children }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                    <Icon size={17} className="text-blue-400" />
                </div>
                <h2 className="font-bold text-slate-100">{title}</h2>
            </div>
            {children}
        </div>
    )
}

function Toggle({ label, desc, checked, onChange }) {
    return (
        <div className="flex items-center justify-between py-3">
            <div>
                <p className="text-sm font-medium text-slate-200">{label}</p>
                {desc && <p className="text-xs text-slate-500">{desc}</p>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
        </div>
    )
}

export default function Settings() {
    const [saved, setSaved] = useState(false)

    /* General */
    const [siteName, setSiteName] = useState('NewsAPI')
    const [siteDesc, setSiteDesc] = useState('Real-time news aggregation and delivery API service')
    const [timezone, setTimezone] = useState('Asia/Kolkata')
    const [theme, setTheme] = useState('dark')

    /* API */
    const [rateLimit, setRateLimit] = useState('1000')
    const [cacheTTL, setCacheTTL] = useState('300')
    const [apiVersion, setApiVersion] = useState('v1')
    const [cors, setCors] = useState(true)

    /* Notifications */
    const [emailAlert, setEmailAlert] = useState(true)
    const [slackAlert, setSlackAlert] = useState(false)
    const [rateAlert, setRateAlert] = useState(true)
    const [errorAlert, setErrorAlert] = useState(true)
    const [alertEmail, setAlertEmail] = useState('admin@newsapi.dev')

    /* Security */
    const [twoFA, setTwoFA] = useState(false)
    const [ipWhitelist, setIpWhitelist] = useState(false)
    const [auditLog, setAuditLog] = useState(true)
    const [keyRotation, setKeyRotation] = useState('90days')

    const handleSave = () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2200)
    }

    return (
        <div className="animate-fade-up space-y-7">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Settings</h1>
                    <p className="mt-1 text-sm text-slate-500">Configure your NewsAPI admin panel</p>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90
            ${saved ? 'bg-gradient-to-r from-emerald-700 to-emerald-500 shadow-emerald-600/20' : 'bg-gradient-to-r from-blue-700 to-blue-500 shadow-blue-600/20'}`}
                >
                    {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {/* General */}
                <Section icon={Globe} title="General">
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Site Name</label>
                            <input className={inputCls} value={siteName} onChange={e => setSiteName(e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Description</label>
                            <textarea className={`${inputCls} resize-none`} rows={3} value={siteDesc} onChange={e => setSiteDesc(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Timezone</label>
                                <select className={inputCls} value={timezone} onChange={e => setTimezone(e.target.value)}>
                                    {['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Singapore'].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Theme</label>
                                <select className={inputCls} value={theme} onChange={e => setTheme(e.target.value)}>
                                    <option value="dark">Dark</option>
                                    <option value="light">Light</option>
                                    <option value="system">System</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* API Config */}
                <Section icon={Key} title="API Configuration">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Default Rate Limit</label>
                                <select className={inputCls} value={rateLimit} onChange={e => setRateLimit(e.target.value)}>
                                    {['500', '1000', '2000', '5000', '10000'].map(v => <option key={v} value={v}>{v}/day</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>API Version</label>
                                <select className={inputCls} value={apiVersion} onChange={e => setApiVersion(e.target.value)}>
                                    <option value="v1">v1 (stable)</option>
                                    <option value="v2">v2 (beta)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Cache TTL (seconds)</label>
                            <input type="number" className={inputCls} value={cacheTTL} onChange={e => setCacheTTL(e.target.value)} min={0} />
                            <p className="mt-1 text-xs text-slate-600">How long API responses are cached. 0 = disabled.</p>
                        </div>
                        <div className="divide-y divide-slate-800">
                            <Toggle label="CORS Enabled" desc="Allow cross-origin API requests" checked={cors} onChange={setCors} />
                        </div>
                    </div>
                </Section>

                {/* Notifications */}
                <Section icon={Bell} title="Notifications">
                    <div>
                        <div>
                            <label className={labelCls}>Alert Email</label>
                            <input type="email" className={inputCls} value={alertEmail} onChange={e => setAlertEmail(e.target.value)} />
                        </div>
                        <div className="mt-4 divide-y divide-slate-800">
                            <Toggle label="Email Alerts" desc="Receive alerts via email" checked={emailAlert} onChange={setEmailAlert} />
                            <Toggle label="Slack Notifications" desc="Send alerts to Slack channel" checked={slackAlert} onChange={setSlackAlert} />
                            <Toggle label="Rate Limit Alerts" desc="Alert when key hits 90% of limit" checked={rateAlert} onChange={setRateAlert} />
                            <Toggle label="Error Spike Alerts" desc="Alert on error rate > 5%" checked={errorAlert} onChange={setErrorAlert} />
                        </div>
                    </div>
                </Section>

                {/* Security */}
                <Section icon={Shield} title="Security">
                    <div>
                        <div className="divide-y divide-slate-800">
                            <Toggle label="Two-Factor Authentication" desc="Require 2FA for admin login" checked={twoFA} onChange={setTwoFA} />
                            <Toggle label="IP Whitelist" desc="Restrict admin access by IP" checked={ipWhitelist} onChange={setIpWhitelist} />
                            <Toggle label="Audit Logging" desc="Log all admin actions" checked={auditLog} onChange={setAuditLog} />
                        </div>
                        <div className="mt-4">
                            <label className={labelCls}>Auto Key Rotation</label>
                            <select className={inputCls} value={keyRotation} onChange={e => setKeyRotation(e.target.value)}>
                                <option value="never">Never</option>
                                <option value="30days">Every 30 days</option>
                                <option value="60days">Every 60 days</option>
                                <option value="90days">Every 90 days</option>
                            </select>
                        </div>
                    </div>
                </Section>
            </div>

            {/* Danger zone */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
                        <Database size={17} className="text-red-400" />
                    </div>
                    <h2 className="font-bold text-red-400">Danger Zone</h2>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-500/15 bg-red-500/5 p-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-200">Reset All API Keys</p>
                        <p className="text-xs text-slate-500">Immediately revoke all existing API keys. This cannot be undone.</p>
                    </div>
                    <button className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20">
                        Reset Keys
                    </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-500/15 bg-red-500/5 p-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-200">Delete All Articles</p>
                        <p className="text-xs text-slate-500">Permanently delete all articles from the database.</p>
                    </div>
                    <button className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20">
                        Delete All
                    </button>
                </div>
            </div>
        </div>
    )
}
