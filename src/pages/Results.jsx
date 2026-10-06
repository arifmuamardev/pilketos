import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Results(){
  const [election,setElection]=useState(null)
  const [results,setResults]=useState([])
  const [recon,setRecon]=useState(null)
  const [message,setMessage]=useState('')
  useEffect(()=>{load()},[])

  async function load(){
    setMessage('')
    const {data:e,error:eErr}=await supabase.from('elections').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle()
    if(eErr){setMessage(eErr.message);return}
    setElection(e)
    setResults([]);setRecon(null)
    if(e && ['closed','published','archived'].includes(e.status)){
      const [{data:r,error:rErr},{data:rc,error:rcErr}]=await Promise.all([
        supabase.rpc('get_results',{p_election_id:e.id}),
        supabase.rpc('get_reconciliation',{p_election_id:e.id})
      ])
      if(rErr||rcErr)setMessage(rErr?.message||rcErr?.message)
      else{setResults(r||[]);setRecon(rc?.[0]||null)}
    }
  }

  async function closeElection(){
    if(!election)return
    if(!confirm('Tutup pemungutan suara? Setelah ditutup, pemilih tidak dapat mengirim suara lagi.'))return
    const {error}=await supabase.from('elections').update({status:'closed'}).eq('id',election.id)
    if(error){setMessage(error.message);return}
    await load()
  }

  async function publish(){
    if(!recon?.is_consistent){setMessage('Hasil tidak dapat dipublikasikan sebelum data konsisten.');return}
    const {error}=await supabase.from('elections').update({status:'published'}).eq('id',election.id)
    if(error){setMessage(error.message);return}
    await load()
  }

  const totalVotes=useMemo(()=>results.reduce((a,r)=>a+Number(r.votes||0),0),[results])
  const locked=!election || !['closed','published','archived'].includes(election.status)

  return <>
    <header className="page-head"><div><p className="eyebrow">REKAPITULASI</p><h1>Hasil Pilketos</h1><p>Perolehan suara tidak tersedia selama pemungutan berlangsung.</p></div></header>
    {message&&<div className="alert bad">{message}</div>}
    {locked ? <section className="locked"><div className="lock-icon">🔒</div><h2>Hasil masih terkunci</h2><p>Untuk menjaga fairness, hasil kandidat baru dapat dihitung setelah pemungutan ditutup.</p>{election?.status==='open'&&<button className="btn danger" onClick={closeElection}>Tutup Pemungutan Suara</button>}</section>
    : <>
      <section className={recon?.is_consistent?'recon good':'recon bad'}>
        <div><strong>Rekonsiliasi</strong><span>Pemilih berstatus sudah memilih: {recon?.voted_voters ?? 0}</span></div>
        <div><strong>{recon?.ballots ?? 0}</strong><span>ballot tersimpan</span></div>
        <div><strong>{recon?.difference ?? 0}</strong><span>selisih</span></div>
        <div><strong>{recon?.is_consistent?'✓ Konsisten':'⚠ Periksa data'}</strong></div>
      </section>
      <section className="card">
        <div className="card-head"><div><h2>Perolehan suara</h2><p>Status: {election.status} • Total suara: {totalVotes}</p></div>{election.status==='closed'&&<button className="btn primary" disabled={!recon?.is_consistent} onClick={publish}>Publikasikan Hasil</button>}</div>
        <table><thead><tr><th>No.</th><th>Pasangan calon</th><th>Suara</th><th>Persentase</th></tr></thead><tbody>{results.map(r=><tr key={r.candidate_id}><td>{r.ballot_number}</td><td><strong>{r.chair_name} & {r.vice_name}</strong></td><td>{r.votes}</td><td>{totalVotes?((Number(r.votes)/totalVotes)*100).toFixed(1):'0.0'}%</td></tr>)}</tbody></table>
      </section>
    </>}
  </>
}
