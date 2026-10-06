import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard(){
  const [election,setElection]=useState(null)
  const [stats,setStats]=useState(null)
  const [stations,setStations]=useState([])
  const [message,setMessage]=useState('')

  useEffect(()=>{load()},[])

  async function load(){
    setMessage('')
    const {data:e,error:eErr}=await supabase.from('elections').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle()
    if(eErr){setMessage(eErr.message);return}
    setElection(e)
    if(!e){setStats(null);setStations([]);return}

    const [{data:s,error:sErr},{data:t,error:tErr}]=await Promise.all([
      supabase.rpc('get_turnout_stats',{p_election_id:e.id}),
      supabase.rpc('get_station_turnout',{p_election_id:e.id})
    ])
    if(sErr||tErr)setMessage(sErr?.message||tErr?.message)
    setStats(s?.[0]||null)
    setStations(t||[])
  }

  if(!election){
    return <>
      <header className="page-head"><div><p className="eyebrow">PILKETOS</p><h1>Dashboard Panitia</h1><p>Selamat datang. Sistem siap dikonfigurasi untuk pemilihan pertama.</p></div><span className="status live">● Belum ada pemilihan</span></header>
      {message&&<p className="form-message">{message}</p>}
      <section className="empty-dashboard">
        <div className="empty-icon">✓</div>
        <h2>Admin berhasil terhubung</h2>
        <p>Mulai dengan membuat pemilihan, lalu siapkan TPS, kandidat, DPT, dan akun petugas sebelum membuka pemungutan suara.</p>
        <a className="btn primary lg" href="#/admin/election">Mulai Setup Pilketos</a>
        <div className="setup-roadmap">
          <span><b>1</b>Pemilihan</span>
          <span><b>2</b>TPS</span>
          <span><b>3</b>Kandidat</span>
          <span><b>4</b>DPT</span>
          <span><b>5</b>Petugas</span>
        </div>
      </section>
    </>
  }

  return <>
    <header className="page-head"><div><p className="eyebrow">{election.name}</p><h1>Dashboard Panitia</h1><p>Monitoring partisipasi tanpa menampilkan perolehan suara sementara.</p></div><span className="status live">● {election.status}</span></header>
    {message&&<p className="form-message">{message}</p>}
    <section className="stats">
      <article><span>Total DPT</span><strong>{stats?.total_voters ?? 0}</strong></article>
      <article><span>Sudah memilih</span><strong>{stats?.voted ?? 0}</strong></article>
      <article><span>Belum memilih</span><strong>{stats?.not_voted ?? 0}</strong></article>
      <article><span>Partisipasi</span><strong>{stats?.turnout ?? 0}%</strong></article>
    </section>
    <section className="card">
      <div className="card-head"><div><h2>Partisipasi per TPS</h2><p>{stations.length} TPS terdaftar.</p></div><button className="btn" onClick={load}>Refresh</button></div>
      <div className="station-list">{stations.map(s => <div className="station-row" key={s.polling_station_id}><div><strong>{s.name}</strong><small>{s.voted} / {s.total_voters} pemilih</small></div><div className="progress"><i style={{width:`${s.turnout || 0}%`}} /></div><b>{s.turnout || 0}%</b></div>)}</div>
    </section>
  </>
}
