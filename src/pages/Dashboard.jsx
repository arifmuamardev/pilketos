import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard(){
  const [election,setElection]=useState(null)
  const [stats,setStats]=useState(null)
  const [stations,setStations]=useState([])

  useEffect(()=>{load()},[])

  async function load(){
    const {data:e}=await supabase.from('elections').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle()
    setElection(e)
    if(!e) return
    const {data:s}=await supabase.rpc('get_turnout_stats',{p_election_id:e.id})
    setStats(s?.[0]||null)
    const {data:t}=await supabase.from('polling_stations').select('id,name,code').eq('election_id',e.id).order('code')
    setStations(t||[])
  }

  return <>
    <header className="page-head"><div><p className="eyebrow">{election?.name || 'PILKETOS'}</p><h1>Dashboard Panitia</h1><p>Monitoring partisipasi tanpa menampilkan perolehan suara sementara.</p></div><span className="status live">● {election?.status || 'belum ada pemilihan'}</span></header>
    <section className="stats">
      <article><span>Total DPT</span><strong>{stats?.total_voters ?? 0}</strong></article>
      <article><span>Sudah memilih</span><strong>{stats?.voted ?? 0}</strong></article>
      <article><span>Belum memilih</span><strong>{stats?.not_voted ?? 0}</strong></article>
      <article><span>Partisipasi</span><strong>{stats?.turnout ?? 0}%</strong></article>
    </section>
    <section className="card">
      <div className="card-head"><div><h2>TPS</h2><p>{stations.length} TPS terdaftar pada pemilihan ini.</p></div></div>
      <div className="station-list">{stations.map(s => <div className="station-row" key={s.id}><div><strong>{s.name}</strong><small>{s.code}</small></div><div className="progress"><i style={{width:'0%'}} /></div><b>Aktif</b></div>)}</div>
    </section>
  </>
}
