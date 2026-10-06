import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, profile, loading, refresh } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(()=>{
    if (!loading && profile?.role === 'officer') window.location.replace('./tps/')
  },[loading,profile])

  if (!loading && profile?.role === 'admin') return <Navigate to="/admin" replace />
  if (!loading && profile?.role === 'officer') return <div className="landing"><div className="landing-card"><p>Mengarahkan ke Portal TPS...</p></div></div>

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) {
          setMessage('Pendaftaran berhasil. Periksa email untuk verifikasi, lalu login kembali. Setelah itu admin perlu memberi Anda role.')
        } else {
          setMessage('Akun berhasil dibuat. Admin perlu memberi role sebelum akun dapat menggunakan aplikasi.')
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

  if (user && !profile) {
    return <div className="landing"><div className="landing-card">
      <p className="eyebrow">AKUN SUDAH LOGIN</p>
      <h1>Belum memiliki akses Pilketos</h1>
      <p>Akun Anda sudah terdaftar, tetapi belum diberi role. Hubungi administrator Pilketos untuk menetapkan akses Admin atau Petugas TPS.</p>
      <div className="landing-actions">
        <button className="btn lg" onClick={()=>supabase.auth.signOut()}>Keluar</button>
      </div>
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
