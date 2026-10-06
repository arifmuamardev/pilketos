import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import DemoCandidateIllustration from '../components/DemoCandidateIllustration'

const emptyForm={ballot_number:'',chair_name:'',vice_name:'',chair_class:'',vice_class:'',vision:'',mission:'',photo_url:''}

export default function Candidates(){
  const [candidates,setCandidates]=useState([])
  const [election,setElection]=useState(null)
  const [form,setForm]=useState(emptyForm)
  const [editing,setEditing]=useState(null)
  const [message,setMessage]=useState('')
  useEffect(()=>{load()},[])

  async function load(){
    const {data:e}=await supabase.from('elections').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle()
    setElection(e)
    if(!e){setCandidates([]);return}
    const {data,error}=await supabase.from('candidates').select('*').eq('election_id',e.id).order('ballot_number')
    if(error)setMessage(error.message)
    setCandidates(data||[])
  }

  function startEdit(c){
    setEditing(c.id)
    setForm({
      ballot_number:c.ballot_number,
      chair_name:c.chair_name,
      vice_name:c.vice_name,
      chair_class:c.chair_class||'',
      vice_class:c.vice_class||'',
      vision:c.vision||'',
      mission:c.mission||'',
      photo_url:c.photo_url||''
    })
  }

  function reset(){setEditing(null);setForm(emptyForm);setMessage('')}

  async function save(e){
    e.preventDefault()
    if(!election)return
    setMessage('')
    const payload={
      election_id:election.id,
      ballot_number:Number(form.ballot_number),
      chair_name:form.chair_name.trim(),
      vice_name:form.vice_name.trim(),
      chair_class:form.chair_class.trim()||null,
      vice_class:form.vice_class.trim()||null,
      vision:form.vision.trim()||null,
      mission:form.mission.trim()||null,
      photo_url:form.photo_url.trim()||null
    }
    const q=editing
      ? supabase.from('candidates').update(payload).eq('id',editing)
      : supabase.from('candidates').insert(payload)
    const {error}=await q
    if(error){setMessage(error.message);return}
    reset();await load()
  }

  async function remove(id){
    if(!confirm('Hapus kandidat ini?'))return
    const {error}=await supabase.from('candidates').delete().eq('id',id)
    if(error){setMessage(error.message);return}
    await load()
  }

  const editable=election && ['draft','ready'].includes(election.status)

  return <>
    <header className="page-head"><div><p className="eyebrow">PERSIAPAN</p><h1>Kandidat Pilketos</h1><p>Kelola pasangan calon Ketua dan Wakil Ketua OSIS.</p></div></header>
    {election && !editable && <div className="alert bad">Data kandidat dikunci karena status pemilihan saat ini: {election.status}.</div>}
    {editable && <section className="card" style={{marginBottom:20}}>
      <form className="form-grid" onSubmit={save}>
        <input required type="number" min="1" placeholder="Nomor urut" value={form.ballot_number} onChange={e=>setForm({...form,ballot_number:e.target.value})}/>
        <input required placeholder="Nama calon ketua" value={form.chair_name} onChange={e=>setForm({...form,chair_name:e.target.value})}/>
        <input required placeholder="Nama calon wakil" value={form.vice_name} onChange={e=>setForm({...form,vice_name:e.target.value})}/>
        <input placeholder="Kelas calon ketua" value={form.chair_class} onChange={e=>setForm({...form,chair_class:e.target.value})}/>
        <input placeholder="Kelas calon wakil" value={form.vice_class} onChange={e=>setForm({...form,vice_class:e.target.value})}/>
        <input placeholder="URL foto pasangan (opsional)" value={form.photo_url} onChange={e=>setForm({...form,photo_url:e.target.value})}/>
        <textarea placeholder="Visi" value={form.vision} onChange={e=>setForm({...form,vision:e.target.value})}/>
        <textarea placeholder="Misi" value={form.mission} onChange={e=>setForm({...form,mission:e.target.value})}/>
        <div className="actions"><button className="btn primary">{editing?'Simpan Perubahan':'Tambah Kandidat'}</button>{editing&&<button type="button" className="btn" onClick={reset}>Batal</button>}</div>
      </form>
      {message&&<p className="form-message">{message}</p>}
    </section>}
    <div className="candidate-grid">{candidates.map(c=><article className="candidate-card" key={c.id}>
      <div className="candidate-number">{String(c.ballot_number).padStart(2,'0')}</div>
      <div className="photo-placeholder">{c.photo_url?<img src={c.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:12}}/>:election?.is_demo?<DemoCandidateIllustration chairName={c.chair_name} viceName={c.vice_name} number={c.ballot_number}/>: 'Foto Paslon'}</div>
      <h3>{c.chair_name}<br/><span>& {c.vice_name}</span></h3>
      <p>{[c.chair_class,c.vice_class].filter(Boolean).join(' / ')}</p>
      <blockquote>{c.vision || 'Visi belum diisi.'}</blockquote>
      {editable&&<div className="actions" style={{justifyContent:'center'}}><button className="btn" onClick={()=>startEdit(c)}>Edit</button><button className="btn danger" onClick={()=>remove(c.id)}>Hapus</button></div>}
    </article>)}</div>
    {!election && <section className="locked"><h2>Belum ada pemilihan</h2><p>Buat pemilihan terlebih dahulu.</p></section>}
  </>
}
