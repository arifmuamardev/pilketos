import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Results(){
  const [election,setElection]=useState(null)
  const [results,setResults]=useState([])
  const [message,setMessage]=useState('')
  useEffect(()=>{load()},[])

  async function load(){
    const {data:e}=await supabase.from('elections').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle()
    setElection(e)
    if(e && ['closed','published','archived'].includes(e.status)){
      const {data,error}=await supabase.rpc('get_results',{p_election_id:e.id})
      if(error)setMessage(error.message)
      else setResults(data||[])
    }
  }

  async function closeElection(){
    if(!election) return
    if(!confirm('Tutup pemungutan suara? Setelah ditutup, pemilih tidak dapat mengirim suara lagi.')) return
    const {error}=await supabase.from('elections').update({status:'closed'}).eq('id',election.id)
    if(error){setMessage(error.message);return}
    await load()
  }

  async function publish(){
    const {error}=await supabase.from('elections').update({status:'published'}).eq('id',election.id)
    if(error){setMessage(error.message);return}
    await load()
  }

  const locked=!election || !['closed','published','archived'].includes(election.status)
  return <>
    <header className="page-head"><div><p className="eyebrow">REKAPITULASI</p><h1>Hasil Pilketos</h1><p>Perolehan suara tidak tersedia selama pemungutan berlangsung.</p></div></header>
    {message && <div className="alert bad">{message}</div>}
    {locked ? <section className="locked"><div className="lock-icon">🔒</div><h2>Hasil masih terkunci</h2><p>Untuk menjaga fairness, hasil kandidat baru dapat dihitung setelah pemungutan ditutup.</p>{election?.status==='open' && <button className="btn danger" onClick={closeElection}>Tutup Pemungutan Suara</button>}</section>
    : <section className="card"><div className="card-head"><div><h2>Perolehan suara</h2><p>Status: {election.status}</p></div>{election.status==='closed' && <button className="btn primary" onClick={publish}>Publikasikan Hasil</button>}</div>
      <table><thead><tr><th>No.</th><th>Pasangan calon</th><th>Suara</th></tr></thead><tbody>{results.map(r=><tr key={r.candidate_id}><td>{r.ballot_number}</td><td><strong>{r.chair_name} & {r.vice_name}</strong></td><td>{r.votes}</td></tr>)}</tbody></table>
    </section>}
  </>
}
