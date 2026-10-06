import { useEffect, useMemo, useState } from 'react'
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
  const [counts,setCounts]=useState({candidates:0,stations:0,voters:0,staff:0})

  useEffect(()=>{load()},[])

  async function load(){
    setMessage('')
    const {data,error}=await supabase.from('elections').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle()
    if(error){setMessage(error.message);return}
    setElection(data||null)
    if(data){
      setName(data.name)
      const [c,s,v,u]=await Promise.all([
        supabase.from('candidates').select('id',{count:'exact',head:true}).eq('election_id',data.id),
        supabase.from('polling_stations').select('id',{count:'exact',head:true}).eq('election_id',data.id),
        supabase.from('voters').select('id',{count:'exact',head:true}).eq('election_id',data.id),
        supabase.from('app_users').select('user_id',{count:'exact',head:true})
      ])
      setCounts({candidates:c.count||0,stations:s.count||0,voters:v.count||0,staff:u.count||0})
    }else{
      setCounts({candidates:0,stations:0,voters:0,staff:0})
    }
  }

  async function createElection(){
    const {data,error}=await supabase.from('elections').insert({name,status:'draft',allow_blank_vote:false}).select().single()
    if(error){setMessage(error.message);return}
    setElection(data);setMessage('Pemilihan baru dibuat.');await load()
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
  const checklist=useMemo(()=>[
    {label:'Minimal 2 pasangan calon',done:counts.candidates>=2,href:'#/admin/candidates',value:`${counts.candidates} kandidat`},
    {label:'Minimal 1 TPS',done:counts.stations>=1,href:'#/admin/tps',value:`${counts.stations} TPS`},
    {label:'DPT sudah tersedia',done:counts.voters>=1,href:'#/admin/voters',value:`${counts.voters} pemilih`},
    {label:'Akun panitia/petugas',done:counts.staff>=1,href:'#/admin/staff',value:`${counts.staff} akun`}
  ],[counts])

  const readyForReady=counts.candidates>=2&&counts.stations>=1
  const readyForOpen=readyForReady&&counts.voters>=1

  return <>
    <header className="page-head"><div><p className="eyebrow">KONFIGURASI</p><h1>Pemilihan</h1><p>Kelola lifecycle Pilketos secara berurutan.</p></div><button className="btn" onClick={load}>Refresh Checklist</button></header>
    {!election ? <section className="locked"><h2>Belum ada pemilihan</h2><p>Buat pemilihan baru untuk mulai menyiapkan kandidat, DPT, dan TPS.</p><button className="btn primary" onClick={createElection}>Buat PILKETOS 2026</button></section>
    : <>
      <section className="card" style={{marginBottom:20}}>
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
          {action&&<button
            className={action.status==='closed'?'btn danger':'btn primary'}
            disabled={(action.status==='ready'&&!readyForReady)||(action.status==='open'&&!readyForOpen)}
            onClick={()=>updateStatus(action.status)}
          >{action.label}</button>}
        </div>
        {message&&<p className="form-message">{message}</p>}
      </section>

      <section className="card">
        <div className="card-head"><div><h2>Checklist Kesiapan</h2><p>Selesaikan persiapan sebelum pemungutan dibuka.</p></div></div>
        <div className="setup-list">{checklist.map(item=><a key={item.label} href={item.href} className={item.done?'setup-item done':'setup-item'}>
          <span className="setup-icon">{item.done?'✓':'!'}</span>
          <div><strong>{item.label}</strong><small>{item.value}</small></div>
          <span className="setup-link">{item.done?'Siap':'Lengkapi →'}</span>
        </a>)}</div>
      </section>
    </>}
  </>
}
