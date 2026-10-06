import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function TpsDesk(){
  const {id}=useParams()
  const navigate=useNavigate()
  const {profile}=useAuth()
  const [station,setStation]=useState(null)
  const [voters,setVoters]=useState([])
  const [query,setQuery]=useState('')
  const [selected,setSelected]=useState(null)
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  const [locked,setLocked]=useState(sessionStorage.getItem('pilketos_staff_locked')==='1')
  const [hasPin,setHasPin]=useState(null)
  const [pin,setPin]=useState('')

  useEffect(()=>{load()},[id])

  async function load(){
    setMessage('')
    const [{data:s},{data:v,error},{data:p,error:pErr}]=await Promise.all([
      supabase.from('polling_stations').select('*').eq('id',id).maybeSingle(),
      supabase.from('voters').select('id,student_number,name,class_name,has_voted,polling_station_id').eq('polling_station_id',id).order('name'),
      supabase.rpc('has_operator_pin')
    ])
    setStation(s)
    if(error||pErr)setMessage(error?.message||pErr?.message)
    setVoters(v||[])
    setHasPin(Boolean(p))
  }

  const found=query.trim()
    ? voters.filter(v=>(v.student_number+' '+v.name+' '+v.class_name).toLowerCase().includes(query.toLowerCase())).slice(0,20)
    : []

  async function savePin(e){
    e.preventDefault()
    setBusy(true);setMessage('')
    const {error}=await supabase.rpc('set_operator_pin',{p_pin:pin})
    if(error){setMessage(error.message);setBusy(false);return}
    setHasPin(true);setPin('');setMessage('PIN petugas berhasil dibuat.');setBusy(false)
  }

  async function unlock(e){
    e.preventDefault()
    setBusy(true);setMessage('')
    const {data,error}=await supabase.rpc('verify_operator_pin',{p_pin:pin})
    if(error){setMessage(error.message);setBusy(false);return}
    if(!data){setMessage('PIN salah.');setBusy(false);return}
    sessionStorage.removeItem('pilketos_staff_locked')
    setLocked(false);setPin('');setBusy(false)
    await load()
  }

  async function activate(){
    if(!selected||selected.has_voted)return
    if(!hasPin){setMessage('Buat PIN petugas terlebih dahulu sebelum mengaktifkan bilik.');return}
    setBusy(true);setMessage('')
    const {data,error}=await supabase.rpc('activate_voter',{p_voter_id:selected.id})
    if(error){setMessage(error.message);setBusy(false);return}
    sessionStorage.setItem('pilketos_vote_token',data)
    sessionStorage.setItem('pilketos_return_tps',id)
    sessionStorage.setItem('pilketos_staff_locked','1')
    setBusy(false)
    navigate('/vote')
  }

  if(locked){
    return <div className="kiosk-wrap"><form className="kiosk-card auth-card" onSubmit={unlock}>
      <p className="eyebrow">{station?.name||'TPS'} • TERKUNCI</p>
      <h1>Masukkan PIN Petugas</h1>
      <p>Sesi pemilih selesai. Masukkan PIN petugas untuk memproses pemilih berikutnya.</p>
      <input className="pin-input" inputMode="numeric" pattern="[0-9]{4,6}" minLength="4" maxLength="6" required value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} placeholder="••••"/>
      <button className="btn primary lg full" disabled={busy}>{busy?'Memeriksa...':'Buka Mode Petugas'}</button>
      {message&&<p className="form-message">{message}</p>}
    </form></div>
  }

  return <div className="kiosk-wrap"><div className="kiosk-card wide">
    <div className="card-head"><div><p className="eyebrow">{station?.name||'TPS'} • MODE PETUGAS</p><h1>Verifikasi Pemilih</h1></div><span className="pill done">{voters.filter(v=>v.has_voted).length} / {voters.length}</span></div>
    <p>Login sebagai {profile?.display_name}. Cari siswa berdasarkan NIS atau nama.</p>

    {hasPin===false&&<form className="pin-setup" onSubmit={savePin}>
      <div><strong>Buat PIN Petugas</strong><small>PIN 4–6 digit dipakai untuk membuka mode petugas setelah satu sesi pemilih selesai.</small></div>
      <input inputMode="numeric" pattern="[0-9]{4,6}" minLength="4" maxLength="6" required value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} placeholder="PIN"/>
      <button className="btn primary" disabled={busy}>Simpan PIN</button>
    </form>}

    <input className="search-lg" value={query} onChange={e=>{setQuery(e.target.value);setSelected(null)}} placeholder="Masukkan NIS / nama..." autoFocus/>
    {query&&<div className="search-results">{found.map(v=><button key={v.id} onClick={()=>setSelected(v)}><span><strong>{v.name}</strong><small>{v.student_number} • {v.class_name}</small></span><span className={v.has_voted?'pill done':'pill pending'}>{v.has_voted?'Sudah memilih':'Belum memilih'}</span></button>)}</div>}
    {selected&&<div className="verify-box"><h3>{selected.name}</h3><p>{selected.student_number} • {selected.class_name}</p>{selected.has_voted?<div className="alert bad">Pemilih ini sudah menggunakan hak pilih.</div>:<button className="btn primary full" disabled={busy||!hasPin} onClick={activate}>{busy?'Mengaktifkan...':'Aktifkan Bilik Voting'}</button>}</div>}
    {message&&<p className="form-message">{message}</p>}
  </div></div>
}
