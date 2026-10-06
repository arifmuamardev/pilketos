import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Voters(){
  const [voters,setVoters]=useState([])
  const [query,setQuery]=useState('')
  useEffect(()=>{load()},[])
  async function load(){
    const {data}=await supabase.from('voters').select('id,student_number,name,class_name,has_voted,polling_stations(name)').order('name')
    setVoters(data||[])
  }
  const filtered=voters.filter(v=>(v.student_number+' '+v.name+' '+v.class_name).toLowerCase().includes(query.toLowerCase()))
  return <>
    <header className="page-head"><div><p className="eyebrow">DAFTAR PEMILIH TETAP</p><h1>DPT</h1><p>Data pemilih langsung dari database.</p></div></header>
    <section className="card"><div className="toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari NIS, nama, atau kelas..."/></div>
    <table><thead><tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>TPS</th><th>Status</th></tr></thead><tbody>{filtered.map(v=><tr key={v.id}><td>{v.student_number}</td><td><strong>{v.name}</strong></td><td>{v.class_name}</td><td>{v.polling_stations?.name || '-'}</td><td><span className={v.has_voted?'pill done':'pill pending'}>{v.has_voted?'Sudah':'Belum'}</span></td></tr>)}</tbody></table></section>
  </>
}
