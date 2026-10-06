import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function TpsDesk(){
  const {id}=useParams()
  const navigate=useNavigate()
  const {profile}=useAuth()
  const [station,setStation]=useState(null)
  const [nisn,setNisn]=useState('')
  const [pin,setPin]=useState('')
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  const [stats,setStats]=useState({total:0,voted:0})

  useEffect(()=>{load()},[id])

  async function load(){
    setMessage('')
    const [{data:s,error:sErr},{data:v,error:vErr}]=await Promise.all([
      supabase.from('polling_stations').select('id,name,code,election_id').eq('id',id).maybeSingle(),
      supabase.from('voters').select('has_voted').eq('polling_station_id',id)
    ])
    if(sErr||vErr){setMessage(sErr?.message||vErr?.message);return}
    setStation(s)
    const rows=v||[]
    setStats({total:rows.length,voted:rows.filter(x=>x.has_voted).length})
  }

  async function loginVoter(e){
    e.preventDefault()
    if(!nisn.trim()||pin.length!==6)return
    setBusy(true);setMessage('')
    const {data,error}=await supabase.rpc('student_login',{
      p_polling_station_id:id,
      p_student_number:nisn.trim(),
      p_pin:pin
    })
    if(error){
      setMessage(error.message)
      setPin('')
      setBusy(false)
      return
    }
    sessionStorage.setItem('pilketos_vote_token',data)
    sessionStorage.setItem('pilketos_return_tps',id)
    setNisn('');setPin('');setBusy(false)
    navigate('/vote')
  }

  return <div className="kiosk-wrap">
    <div className="kiosk-card auth-card voter-login-card">
      <div className="tps-login-head">
        <div>
          <p className="eyebrow">{station?.code||'TPS'} • {station?.name||'LOADING'}</p>
          <h1>Login Pemilih</h1>
          <p>Masukkan NISN dan PIN 6 digit yang diberikan panitia.</p>
        </div>
        <span className="pill done">{stats.voted} / {stats.total}</span>
      </div>

      <form onSubmit={loginVoter} className="voter-login-form">
        <label>NISN
          <input
            className="search-lg"
            inputMode="numeric"
            autoComplete="off"
            required
            value={nisn}
            onChange={e=>setNisn(e.target.value.replace(/\D/g,''))}
            placeholder="Masukkan NISN"
            autoFocus
          />
        </label>

        <label>PIN Pemilih
          <input
            className="pin-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            minLength="6"
            maxLength="6"
            required
            value={pin}
            onChange={e=>setPin(e.target.value.replace(/\D/g,''))}
            placeholder="••••••"
          />
        </label>

        <button className="btn primary lg full" disabled={busy||pin.length!==6}>
          {busy?'Memverifikasi...':'Masuk ke Bilik Suara'}
        </button>
      </form>

      {message&&<div className="alert bad">{message}</div>}
      <p className="kiosk-note">Laptop ini tetap berada di TPS. Setelah satu pemilih selesai, layar akan kembali ke login untuk pemilih berikutnya.</p>
      <small className="muted">Perangkat TPS aktif sebagai {profile?.display_name||'petugas'}.</small>
    </div>
  </div>
}
