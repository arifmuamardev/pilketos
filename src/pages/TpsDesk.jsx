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

  useEffect(()=>{load()},[id])

  async function load(){
    const {data:s}=await supabase.from('polling_stations').select('*').eq('id',id).maybeSingle()
    setStation(s)
    const {data:v,error}=await supabase.from('voters')
      .select('id,student_number,name,class_name,has_voted,polling_station_id')
      .eq('polling_station_id',id)
      .order('name')
    if(error) setMessage(error.message)
    setVoters(v||[])
  }

  const found=query.trim()
    ? voters.filter(v=>(v.student_number+' '+v.name+' '+v.class_name).toLowerCase().includes(query.toLowerCase())).slice(0,20)
    : []

  async function activate(){
    if(!selected || selected.has_voted) return
    setBusy(true)
    setMessage('')
    const {data,error}=await supabase.rpc('activate_voter',{p_voter_id:selected.id})
    if(error){
      setMessage(error.message)
      setBusy(false)
      return
    }
    sessionStorage.setItem('pilketos_vote_token',data)
    sessionStorage.setItem('pilketos_return_tps',id)
    setBusy(false)
    navigate('/vote')
  }

  return <div className="kiosk-wrap"><div className="kiosk-card wide">
    <p className="eyebrow">{station?.name || 'TPS'} • MODE PETUGAS</p>
    <h1>Verifikasi Pemilih</h1>
    <p>Login sebagai {profile?.display_name}. Cari siswa berdasarkan NIS atau nama.</p>
    <input className="search-lg" value={query} onChange={e=>{setQuery(e.target.value);setSelected(null)}} placeholder="Masukkan NIS / nama..." autoFocus/>
    {query && <div className="search-results">{found.map(v=><button key={v.id} onClick={()=>setSelected(v)}><span><strong>{v.name}</strong><small>{v.student_number} • {v.class_name}</small></span><span className={v.has_voted?'pill done':'pill pending'}>{v.has_voted?'Sudah memilih':'Belum memilih'}</span></button>)}</div>}
    {selected && <div className="verify-box"><h3>{selected.name}</h3><p>{selected.student_number} • {selected.class_name}</p>{selected.has_voted?<div className="alert bad">Pemilih ini sudah menggunakan hak pilih.</div>:<button className="btn primary full" disabled={busy} onClick={activate}>{busy?'Mengaktifkan...':'Aktifkan Bilik Voting'}</button>}</div>}
    {message && <p className="form-message">{message}</p>}
  </div></div>
}
