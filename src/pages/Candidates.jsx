import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Candidates(){
  const [candidates,setCandidates]=useState([])
  const [election,setElection]=useState(null)
  useEffect(()=>{load()},[])
  async function load(){
    const {data:e}=await supabase.from('elections').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle()
    setElection(e)
    if(!e) return
    const {data}=await supabase.from('candidates').select('*').eq('election_id',e.id).order('ballot_number')
    setCandidates(data||[])
  }
  return <>
    <header className="page-head"><div><p className="eyebrow">PERSIAPAN</p><h1>Kandidat Pilketos</h1><p>Data kandidat sekarang dibaca langsung dari Supabase.</p></div></header>
    <div className="candidate-grid">{candidates.map(c=><article className="candidate-card" key={c.id}><div className="candidate-number">{String(c.ballot_number).padStart(2,'0')}</div><div className="photo-placeholder">{c.photo_url?<img src={c.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:12}}/>:'Foto Paslon'}</div><h3>{c.chair_name}<br/><span>& {c.vice_name}</span></h3><p>{[c.chair_class,c.vice_class].filter(Boolean).join(' / ')}</p><blockquote>{c.vision || 'Visi belum diisi.'}</blockquote></article>)}</div>
    {!election && <section className="locked"><h2>Belum ada pemilihan</h2><p>Buat atau siapkan data pemilihan terlebih dahulu.</p></section>}
  </>
}
