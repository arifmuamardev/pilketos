import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, profile, loading, refresh } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && profile?.role === 'admin') return <Navigate to="/admin" replace />
  if (!loading && profile?.role === 'officer') return <Navigate to={`/tps/${profile.polling_station_id || ''}`} replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) {
          setMessage('Pendaftaran berhasil. Periksa email untuk verifikasi, lalu login kembali.')
        } else {
          setMessage('Akun berhasil dibuat. Jika ini instalasi pertama, jadikan akun sebagai admin pertama.')
          await refresh()
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        await refresh()
      }
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function bootstrap() {
    setBusy(true)
    setMessage('')
    try {
      const { error } = await supabase.rpc('bootstrap_first_admin', {
        p_display_name: displayName || user?.email?.split('@')[0] || 'Administrator'
      })
      if (error) throw error
      await refresh()
      setMessage('Admin pertama berhasil dibuat.')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (user && !profile) {
    return <div className="landing"><div className="landing-card">
      <p className="eyebrow">AKUN SUDAH LOGIN</p>
      <h1>Belum memiliki role Pilketos</h1>
      <p>Jika ini akun pertama pada sistem, Anda dapat menjadikannya administrator pertama. Jika bukan, minta admin memberi role ke akun ini.</p>
      <input className="search-lg" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Nama admin" />
      <div className="landing-actions">
        <button className="btn primary lg" disabled={busy} onClick={bootstrap}>Jadikan Admin Pertama</button>
        <button className="btn lg" onClick={()=>supabase.auth.signOut()}>Keluar</button>
      </div>
      {message && <p className="form-message">{message}</p>}
    </div></div>
  }

  return <div className="landing"><form className="landing-card auth-card" onSubmit={submit}>
    <p className="eyebrow">AKSES PANITIA</p>
    <h1>{mode === 'login' ? 'Login Pilketos' : 'Buat Akun Panitia'}</h1>
    <p>Admin dan petugas TPS menggunakan akun Supabase Auth.</p>
    <input className="search-lg" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
    <input className="search-lg" type="password" minLength="8" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (min. 8 karakter)" />
    <button className="btn primary lg full" disabled={busy}>{busy ? 'Memproses...' : mode === 'login' ? 'Login' : 'Daftar'}</button>
    <button type="button" className="text-button" onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('')}}>
      {mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}
    </button>
    {message && <p className="form-message">{message}</p>}
  </form></div>
}
