import React, { useState } from 'react';
import useStore from '../lib/store';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const signIn = useStore((state) => state.signIn);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
        } catch (err) {
            setError(
                err.message === 'Invalid login credentials'
                    ? 'Credenziali non valide. Riprova.'
                    : err.message || 'Errore durante il login.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #1E3F2F 0%, #2E5C45 40%, #3E6E55 70%, #1E3F2F 100%)',
            }}
        >
            {/* Sottili cerchi decorativi */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.04]"
                    style={{ background: 'radial-gradient(circle, white, transparent)' }}
                />
                <div className="absolute -bottom-48 -right-48 w-[32rem] h-[32rem] rounded-full opacity-[0.04]"
                    style={{ background: 'radial-gradient(circle, white, transparent)' }}
                />
                <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-[0.03]"
                    style={{ background: 'radial-gradient(circle, white, transparent)' }}
                />
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                        background: 'linear-gradient(to bottom right, rgba(255,255,255,0.12), rgba(255,255,255,0.05))',
                        border: '1px solid rgba(255,255,255,0.15)',
                    }}
                >
                    {/* Header con Logo */}
                    <div className="flex flex-col items-center pt-10 pb-6 px-8">
                        <img
                            src="/RainesNero.svg"
                            alt="Raines Logo"
                            className="h-20 w-auto mb-4 brightness-0 invert opacity-90"
                        />
                        <h2 className="text-white/90 text-lg font-light tracking-[0.3em] uppercase">
                            Catalog Manager
                        </h2>
                        <div className="w-12 h-[1px] bg-white/20 mt-4"></div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
                        {error && (
                            <div className="bg-red-500/15 border border-red-400/30 rounded-lg px-4 py-3 text-red-200 text-sm text-center backdrop-blur-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-white/50 text-xs font-medium tracking-wider uppercase">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="w-full px-4 py-3 rounded-lg text-white placeholder-white/30 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-white/20"
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                }}
                                placeholder="admin@raines.it"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-white/50 text-xs font-medium tracking-wider uppercase">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="w-full px-4 py-3 rounded-lg text-white placeholder-white/30 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-white/20"
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                }}
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-lg font-semibold text-sm tracking-wider uppercase transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            style={{
                                background: loading
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'linear-gradient(to bottom, #4A7A60, #2E5C45)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: 'white',
                                boxShadow: loading
                                    ? 'none'
                                    : '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Accesso in corso...
                                </span>
                            ) : (
                                'Accedi'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-white/20 text-xs mt-6 tracking-wider">
                    © {new Date().getFullYear()} Raines S.r.l. — Area Riservata
                </p>
            </div>
        </div>
    );
}
