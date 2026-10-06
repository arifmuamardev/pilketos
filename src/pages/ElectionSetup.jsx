import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const nextAction={
  draft:{label:'Tandai Siap',status:'ready'},
  ready:{label:'Buka Pemungutan',status:'open'},
  open:{label:'Tutup Pemungutan',status:'closed'},
  closed:{label:'Publikasikan Hasil',status:'published'},
  published:{label:'Arsipkan',status:'archived'}
}

export default function ElectionSetup(){
  const [election,setElection]=useState(null)
  const [name,setName]=useState('PILKETOS 2026')
  const [message,setMessage]=useState('')

  useEffect(()=>{load()},[])

  async function load(){
    const {data,error}=await supabase.from('elections').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle()
    if(error){setMessage(error.message);return}
    setElection(data||null)
    if(data) setName(data.name)
  }

  async function createElection(){
    const {data,error}=await supabase.from('elections').insert({name,status:'draft',allow_blank_vote:false}).select().single()
    if(error){setMessage(error.message);return}
    setElection(data);setMessage('Pemilihan baru dibuat.')
  }

  async function updateStatus(status){
    const labels={ready:'menandai konfigurasi siap',open:'membuka pemungutan suara',closed:'menutup pemungutan suara',published:'mempublikasikan hasil',archived:'mengarsipkan pemilihan',draft:'mengembalikan ke draft'}
    if(!confirm(`Yakin ingin ${labels[status]||'mengubah status'}?`))return
    setMessage('')
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

  const action=election?nextAction[election.status]:null

  return <>
    <header className="page-head"><div><p className="eyebrow">KONFIGURASI</p><h1>Pemilihan</h1><p>Kelola lifecycle Pilketos secara berurutan.</p></div></header>
    {!election ? <section className="locked"><h2>Belum ada pemilihan</h2><p>Buat pemilihan baru untuk mulai menyiapkan kandidat, DPT, dan TPS.</p><button className="btn primary" onClick={createElection}>Buat PILKETOS 2026</button></section>
    : <section className="card">
      <div className="admin-form">
        <input value={name} onChange={e=>setName(e.target.value)}/>
        <button className="btn" onClick={saveName}>Simpan Nama</button>
      </div>
      <div className="state-flow">
        {['draft','ready','open','closed','published','archived'].map(s=><span key={s} className={election.status===s?'state-chip active':'state-chip'}>{s}</span>)}
      </div>
      <p>Status saat ini: <strong>{election.status}</strong></p>
      <p className="muted">Alur: draft → ready → open → closed → published → archived.</p>
      <div className="actions">
        {election.status==='ready'&&<button className="btn" onClick={()=>updateStatus('draft')}>Kembali ke Draft</button>}
        {action&&<button className={action.status==='closed'?'btn danger':'btn primary'} onClick={()=>updateStatus(action.status)}>{action.label}</button>}
      </div>
      {message&&<p className="form-message">{message}</p>}
    </section>}
  </>
}
