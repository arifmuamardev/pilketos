import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Tps(){
  const [stations,setStations]=useState([])
  const [election,setElection]=useState(null)
  const [code,setCode]=useState('')
  const [name,setName]=useState('')
  const [message,setMessage]=useState('')
  useEffect(()=>{load()},[])

  async function load(){
    const {data:e}=await supabase.from('elections').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle()
    setElection(e)
    if(!e){setStations([]);return}
    const {data,error}=await supabase.from('polling_stations').select('id,code,name,election_id').eq('election_id',e.id).order('code')
    if(error)setMessage(error.message)
    setStations(data||[])
  }

  async function add(e){
    e.preventDefault()
    setMessage('')
    const {error}=await supabase.from('polling_stations').insert({election_id:election.id,code:code.trim(),name:name.trim()})
    if(error){setMessage(error.message);return}
    setCode('');setName('');await load()
  }

  async function remove(id){
    if(!confirm('Hapus TPS ini? Pastikan belum ada pemilih atau petugas yang terkait.'))return
    const {error}=await supabase.from('polling_stations').delete().eq('id',id)
    if(error){setMessage(error.message);return}
    await load()
  }

  const editable=election && ['draft','ready'].includes(election.status)
  return <>
    <header className="page-head"><div><p className="eyebrow">TEMPAT PEMUNGUTAN SUARA</p><h1>TPS</h1><p>Kelola TPS untuk pemilihan aktif.</p></div></header>
    {editable&&<section className="card" style={{marginBottom:20}}>
      <form className="admin-form" onSubmit={add}>
        <input required placeholder="Kode, mis. TPS-01" value={code} onChange={e=>setCode(e.target.value)}/>
        <input required placeholder="Nama, mis. TPS 01" value={name} onChange={e=>setName(e.target.value)}/>
        <button className="btn primary">Tambah TPS</button>
      </form>
      {message&&<p className="form-message">{message}</p>}
    </section>}
    {election&&!editable&&<div className="alert bad">TPS dikunci karena status pemilihan: {election.status}.</div>}
    <div className="tps-grid">{stations.map(s=><article className="card" key={s.id}>
      <div className="card-head"><div><h2>{s.name}</h2><p>{s.code}</p></div><span className="pill done">Tersedia</span></div>
      <div className="actions"><a className="btn primary" href={`#/tps/${s.id}`}>Buka TPS</a>{editable&&<button className="btn danger" onClick={()=>remove(s.id)}>Hapus</button>}</div>
    </article>)}</div>
  </>
}
