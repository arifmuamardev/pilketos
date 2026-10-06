import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import DemoCandidateIllustration from '../components/DemoCandidateIllustration'

export default function Vote(){
  const [election,setElection]=useState(null)
  const [candidates,setCandidates]=useState([])
  const [choice,setChoice]=useState(null)
  const [done,setDone]=useState(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const token=sessionStorage.getItem('pilketos_vote_token')
  const returnTps=sessionStorage.getItem('pilketos_return_tps')

  useEffect(()=>{if(token)load()},[])

  async function load(){
    const {data:e,error:eErr}=await supabase.from('elections').select('id,name,status,allow_blank_vote,is_demo').eq('status','open').limit(1).maybeSingle()
    if(eErr){setMessage(eErr.message);return}
    setElection(e)
    if(!e){setMessage('Tidak ada pemungutan suara yang sedang dibuka.');return}
    const {data:c,error:cErr}=await supabase.from('candidates').select('id,ballot_number,chair_name,vice_name,chair_class,vice_class,vision,photo_url').eq('election_id',e.id).order('ballot_number')
    if(cErr){setMessage(cErr.message);return}
    setCandidates(c||[])
  }

  async function submitVote(){
    if(!token){setMessage('Sesi voting tidak ditemukan. Minta petugas mengaktifkan pemilih kembali.');return}
    if(!choice)return
    setBusy(true);setMessage('')
    const {error}=await supabase.rpc('cast_vote',{p_token:token,p_candidate_id:choice,p_blank:false})
    if(error){setMessage(error.message);setBusy(false);return}
    sessionStorage.removeItem('pilketos_vote_token')
    setDone(true);setBusy(false)
  }

  if(!token&&!done){
    return <div className="vote-page"><div className="success blocked"><div>!</div><h1>Bilik belum diaktifkan</h1><p>Silakan panggil petugas TPS untuk mengaktifkan sesi pemilih.</p>{returnTps&&<a href={`#/tps/${returnTps}`} className="btn primary">Panggil Petugas</a>}</div></div>
  }

  if(done) return <div className="vote-page"><div className="success"><div>✓</div><h1>Suara berhasil disimpan</h1><p>Terima kasih telah menggunakan hak pilih Anda. Silakan panggil petugas.</p>{returnTps&&<a href={`#/tps/${returnTps}`} className="btn primary">Panggil Petugas</a>}</div></div>

  return <div className="vote-page">
    <header className="vote-head"><p>{election?.name||'PILKETOS'}</p><h1>Pilih Ketua & Wakil Ketua OSIS</h1><span>Pilih satu pasangan calon, lalu konfirmasi.</span></header>
    {message&&<div className="alert bad" style={{maxWidth:900,margin:'0 auto 20px'}}>{message}</div>}
    <div className="ballot">{candidates.map(c=><button key={c.id} className={choice===c.id?'ballot-card selected':'ballot-card'} onClick={()=>setChoice(c.id)}><b>{String(c.ballot_number).padStart(2,'0')}</b><div className="photo-placeholder">{c.photo_url?<img src={c.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:12}}/>:election?.is_demo?<DemoCandidateIllustration chairName={c.chair_name} viceName={c.vice_name} number={c.ballot_number}/>: 'Foto Paslon'}</div><h2>{c.chair_name}</h2><h3>& {c.vice_name}</h3><span>{choice===c.id?'✓ Dipilih':'Pilih Pasangan Ini'}</span></button>)}</div>
    {choice&&<div className="confirm-bar"><div><small>Pilihan Anda</small><strong>Pasangan Nomor {String(candidates.find(c=>c.id===choice)?.ballot_number||'').padStart(2,'0')}</strong></div><button className="btn primary lg" disabled={busy} onClick={submitVote}>{busy?'Menyimpan...':'Konfirmasi & Kirim Suara'}</button></div>}
  </div>
}
