import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ArrowRight, Coffee, LoaderCircle, LockKeyhole, LogOut } from 'lucide-react';
import { supabase } from '../orders/client';
import './StaffAuth.css';

const staffEmail = import.meta.env.VITE_STAFF_EMAIL?.trim();

export function StaffAuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    let mounted = true;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError('로그인 상태를 확인할 수 없습니다. 새로고침해 주세요.');
      setSession(data.session);
      setChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setChecking(false);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !staffEmail || !password) return;
    setSubmitting(true); setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: staffEmail, password });
      if (authError) { setPassword(''); setError('비밀번호가 맞지 않거나 로그인할 수 없습니다. 다시 확인해 주세요.'); }
    } catch {
      setError('로그인 서버에 연결할 수 없습니다. 연결을 확인한 뒤 다시 시도해 주세요.');
    } finally { setSubmitting(false); }
  };

  if (checking) return <main className="staffAuthPage"><div className="staffAuthLoading"><LoaderCircle className="staffAuthSpin" size={20}/> 로그인 상태 확인 중</div></main>;
  if (!supabase || !staffEmail) return <main className="staffAuthPage"><section className="staffAuthCard"><Brand/><h1>직원 로그인을 준비 중입니다</h1><p>{!supabase ? 'Supabase URL과 publishable key를 환경 변수에 설정해 주세요.' : 'VITE_STAFF_EMAIL 환경 변수에 직원 계정 이메일을 설정해 주세요.'}</p></section></main>;
  if (session) return <>{children}</>;

  return <main className="staffAuthPage"><section className="staffAuthCard">
    <Brand/><div className="staffAuthIcon"><LockKeyhole size={20}/></div>
    <p className="staffAuthEyebrow">STAFF ACCESS</p><h1>직원 전용 페이지</h1><p className="staffAuthDescription">계속하려면 직원 비밀번호를 입력해 주세요.</p>
    <form onSubmit={(event) => void submit(event)}><label htmlFor="staff-password">비밀번호</label><input id="staff-password" type="password" autoComplete="current-password" autoFocus required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호 입력"/><button type="submit" disabled={!password || submitting}>{submitting ? <><LoaderCircle className="staffAuthSpin" size={17}/> 확인 중</> : <>로그인 <ArrowRight size={17}/></>}</button></form>
    {error&&<p className="staffAuthError" role="alert">{error}</p>}
  </section></main>;
}

export function StaffLogoutButton() {
  const [busy, setBusy] = useState(false);
  const logout = async () => { if (!supabase) return; setBusy(true); try { await supabase.auth.signOut(); } finally { setBusy(false); } };
  return <button className="staffLogout" type="button" onClick={() => void logout()} disabled={busy} aria-label="로그아웃" title="로그아웃"><LogOut size={15}/><span>로그아웃</span></button>;
}

function Brand() { return <div className="staffAuthBrand"><span><Coffee size={17}/></span><b>우주 한입</b></div>; }
