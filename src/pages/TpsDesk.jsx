import { useState } from 'react'
import { voters } from '../lib/mock'

export default function TpsDesk(){
  const [query,setQuery]=useState('')
  const [selected,setSelected]=useState(null)
  const found=voters.filter(v=>(v.nis+v.name).toLowerCase().includes(query.toLowerCase()))
  return <div className="kiosk-wrap"><div className="kiosk-card wide">
    <p className="eyebrow">TPS 01 • MODE PETUGAS</p><h1>Verifikasi Pemilih</h1><p>Cari siswa menggunakan NIS atau nama.</p>
    <input className="search-lg" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Masukkan NIS / nama..." autoFocus/>
    {query && <div className="search-results">{found.map(v=><button key={v.nis} onClick={()=>setSelected(v)}><span><strong>{v.name}</strong><small>{v.nis} • {v.className}</small></span><span className={v.voted?'pill done':'pill pending'}>{v.voted?'Sudah memilih':'Belum memilih'}</span></button>)}</div>}
    {selected && <div className="verify-box"><h3>{selected.name}</h3><p>{selected.nis} • {selected.className}</p>{selected.voted?<div className="alert bad">Pemilih ini sudah menggunakan hak pilih.</div>:<a className="btn primary full" href="#/vote">Aktifkan Bilik Voting</a>}</div>}
  </div></div>
}
