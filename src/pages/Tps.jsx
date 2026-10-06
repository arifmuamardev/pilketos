import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Tps(){
  const [stations,setStations]=useState([])
  useEffect(()=>{load()},[])
  async function load(){
    const {data}=await supabase.from('polling_stations').select('id,code,name,election_id').order('code')
    setStations(data||[])
  }
  return <>
    <header className="page-head"><div><p className="eyebrow">TEMPAT PEMUNGUTAN SUARA</p><h1>TPS</h1><p>TPS yang tersimpan pada database.</p></div></header>
    <div className="tps-grid">{stations.map(s=><article className="card" key={s.id}><div className="card-head"><div><h2>{s.name}</h2><p>{s.code}</p></div><span className="pill done">Tersedia</span></div><div className="actions"><a className="btn primary" href={`#/tps/${s.id}`}>Buka TPS</a></div></article>)}</div>
  </>
}
