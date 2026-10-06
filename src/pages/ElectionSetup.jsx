import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ElectionSetup(){
  const [election,setElection]=useState(null)
  const [name,setName]=useState('PILKETOS 2026')
  const [message,setMessage]=useState('')

  useEffect(()=>{load()},[])

  async function load(){
    const {data}=await supabase.from('elections').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle()
    setElection(data||null)
    if(data) setName(data.name)
  }

  async function createElection(){
    const {data,error}=await supabase.from('elections').insert({name,status:'draft',allow_blank_vote:false}).select().single()
    if(error){setMessage(error.message);return}
    setElection(data);setMessage('Pemilihan baru dibuat.')
  }

  async function updateStatus(status){
    const {error}=await supabase.from('elections').update({status}).eq('id',election.id)
    if(error){setMessage(error.message);return}
    await load()
  }

  async function saveName(){
    const {error}=await supabase.from('elections').update({name}).eq('id',election.id)
    if(error){setMessage(error.message);return}
    setMessage('Nama pemilihan disimpan.')
    await load()
  }

  return <>
    <header className="page-head"><div><p className="eyebrow">KONFIGURASI</p><h1>Pemilihan</h1><p>Kelola status utama Pilketos.</p></div></header>
    {!election ? <section className="locked"><h2>Belum ada pemilihan</h2><p>Buat pemilihan baru untuk mulai menyiapkan kandidat, DPT, dan TPS.</p><button className="btn primary" onClick={createElection}>Buat PILKETOS 2026</button></section>
    : <section className="card">
      <div className="admin-form">
        <input value={name} onChange={e=>setName(e.target.value)}/>
        <button className="btn" onClick={saveName}>Simpan Nama</button>
      </div>
      <div className="state-flow">
        {['draft','ready','open','closed','published','archived'].map(s=><button key={s} disabled={election.status===s} className={election.status===s?'btn primary':'btn'} onClick={()=>updateStatus(s)}>{s}</button>)}
      </div>
      <p>Status saat ini: <strong>{election.status}</strong></p>
      <p className="muted">Gunakan alur normal: draft → ready → open → closed → published → archived.</p>
      {message && <p className="form-message">{message}</p>}
    </section>}
  </>
}
