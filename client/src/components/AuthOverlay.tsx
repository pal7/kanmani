import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useT } from '../i18n/index.js';
import BrandMark from './BrandMark.js';
import KolamBackground from './KolamBackground.js';
import LanguageToggle from './LanguageToggle.js';

// Deliberately bilingual brand content (like the ஃ mark), shown to every visitor.
const GREETINGS = ['வணக்கம்', 'Vanakkam', 'நல்வரவு', 'Welcome'];

export default function AuthOverlay() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [greeting, setGreeting] = useState(0);
  const [verse, setVerse] = useState(0);
  const t = useT();

  useEffect(() => {
    const id = setInterval(() => setGreeting((g) => (g + 1) % GREETINGS.length), 2800);
    return () => clearInterval(id);
  }, []);

  // Ancient voices: Thirukkural alternating with the Sangam-era Purananuru verse.
  const currentVerse =
    verse === 0
      ? { line1: t.kuralLine1, line2: t.kuralLine2, credit: t.kuralCredit }
      : { line1: t.sangamLine1, line2: t.sangamLine2, credit: t.sangamCredit };

  useEffect(() => {
    const id = setInterval(() => setVerse((v) => (v + 1) % 2), 8000);
    return () => clearInterval(id);
  }, []);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await (mode === 'signin'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password }));
    setLoading(false);
    if (error) setMessage(error.message);
    else if (mode === 'signup') setMessage(t.checkEmail);
  }

  return (
    <div className="relative min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-14 overflow-hidden">
      <KolamBackground />
      <div className="temple-border absolute top-0 inset-x-0" />
      <div className="temple-border absolute bottom-0 inset-x-0 rotate-180" />

      <div className="absolute top-5 right-5 z-10">
        <LanguageToggle />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-7">
          <BrandMark className="glyph-glow text-6xl block mb-3" />
          <h1 className="font-tamil font-bold text-4xl text-ink tracking-tight">{t.appName}</h1>
          <p className="text-muted text-sm mt-2">{t.tagline}</p>
          <p key={greeting} className="animate-fade-up font-tamil text-accent text-lg mt-3 h-7">
            {GREETINGS[greeting]}
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-accent-soft rounded-2xl shadow-soft p-6">
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-brand border border-accent-soft text-sm font-medium text-ink hover:bg-accent-soft transition-colors mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t.continueWithGoogle}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-accent-soft" />
            <span className="text-xs text-muted">{t.or}</span>
            <div className="flex-1 h-px bg-accent-soft" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <input type="email" placeholder={t.emailPlaceholder} value={email} required
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-brand border border-accent-soft text-sm outline-none focus:border-accent transition-colors bg-white/80" />
            <input type="password" placeholder={t.passwordPlaceholder} value={password} required
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-brand border border-accent-soft text-sm outline-none focus:border-accent transition-colors bg-white/80" />
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-brand bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60">
              {loading ? '…' : mode === 'signin' ? t.signIn : t.signUp}
            </button>
          </form>

          {message && <p className="text-center text-sm mt-3 text-muted">{message}</p>}

          <p className="text-center text-sm text-muted mt-4">
            {mode === 'signin' ? t.noAccount : t.hasAccount}{' '}
            <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}
              className="text-accent font-medium">
              {mode === 'signin' ? t.signUp : t.signIn}
            </button>
          </p>
        </div>

        <div key={verse} className="animate-fade-up text-center mt-8 text-muted min-h-[5.5rem]">
          <p className="font-tamil text-sm leading-relaxed">
            {currentVerse.line1}
            <br />
            {currentVerse.line2}
          </p>
          <p className="text-xs mt-2 italic opacity-80">{currentVerse.credit}</p>
        </div>
      </div>
    </div>
  );
}
