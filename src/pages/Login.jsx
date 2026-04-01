import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Zap, AlertCircle } from 'lucide-react'
import { auth } from '../firebase'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

const googleProvider = new GoogleAuthProvider()

// Admin emails — inhe hi admin access milega
const ADMIN_EMAILS = [
  'sumannayak811789@gmail.com',
  // aur emails yahan add karo
]

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const loginSuccess = (user) => {
        // Check karo ki user admin hai
        if (!ADMIN_EMAILS.includes(user.email)) {
            auth.signOut()
            setError('Access denied. Aapka email admin list mein nahi hai.')
            return
        }
        localStorage.setItem('admin_token', 'firebase_' + Date.now())
        localStorage.setItem('admin_user', JSON.stringify({
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role: 'Super Admin',
            uid: user.uid,
        }))
        navigate('/dashboard')
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const result = await signInWithEmailAndPassword(auth, email.trim(), password.trim())
            loginSuccess(result.user)
        } catch (err) {
            const msgs = {
                'auth/user-not-found': 'Email se koi account nahi mila.',
                'auth/wrong-password': 'Password galat hai.',
                'auth/invalid-credential': 'Email ya password galat hai.',
                'auth/invalid-email': 'Email sahi nahi hai.',
                'auth/too-many-requests': 'Bahut zyada attempts. Kuch der baad try karein.',
                'auth/user-disabled': 'Yeh account block hai.',
            }
            setError(msgs[err.code] || 'Login failed: ' + err.message)
        }
        setLoading(false)
    }

    const handleGoogle = async () => {
        setError('')
        setGoogleLoading(true)
        try {
            const result = await signInWithPopup(auth, googleProvider)
            loginSuccess(result.user)
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError('Google login failed. Dobara try karein.')
            }
        }
        setGoogleLoading(false)
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
            {/* Background */}
            <div className="pointer-events-none absolute left-[15%] top-[10%] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[15%] right-[10%] h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            <div className="animate-fade-up relative z-10 w-full max-w-sm">
                {/* Logo */}
                <div className="mb-9 text-center">
                    <div className="pulse-glow mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-2xl shadow-blue-500/30">
                        <Zap size={30} className="fill-white text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">NewsAPI</h1>
                    <p className="mt-1.5 text-sm text-slate-500">Admin Console — Firebase Login</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        {error && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Email</label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@example.com" required
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
                            <div className="relative">
                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPass ? 'text' : 'password'} value={password}
                                    onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-9 pr-10 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                                <button
                                    type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                                >
                                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 py-3 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:opacity-90 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Signing in…
                                </>
                            ) : 'Sign In with Email'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-5 flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-xs text-slate-600">OR</span>
                        <div className="flex-1 h-px bg-slate-800" />
                    </div>

                    {/* Google Login */}
                    <button
                        onClick={handleGoogle}
                        disabled={googleLoading}
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {googleLoading ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />
                        ) : (
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        )}
                        Continue with Google
                    </button>

                    <div className="mt-5 rounded-xl border border-blue-500/15 bg-blue-500/5 px-4 py-3 text-center text-xs text-slate-500">
                        <span className="font-semibold text-slate-400">Note:</span> Sirf authorized admin emails login kar sakte hain
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-slate-600">NewsAPI Admin Console © 2026</p>
            </div>
        </div>
    )
}
