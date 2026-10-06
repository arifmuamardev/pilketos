import { useState } from 'react'
import { candidates } from '../lib/mock'

export default function Vote(){
  const [choice,setChoice]=useState(null)
  const [done,setDone]=useState(false)
  if(done) return <div className="vote-page"><div className="success"><div>✓</div><h1>Suara berhasil disimpan</h1><p>Terima kasih telah menggunakan hak pilih Anda.</p><a href="#/tps/1" className="btn primary">Kembali ke Petugas</a></div></div>
  return <div className="vote-page">
    <header className="vote-head"><p>PILKETOS 2026</p><h1>Pilih Ketua & Wakil Ketua OSIS</h1><span>Pilih satu pasangan calon.</span></header>
    <div className="ballot">{candidates.map(c=><button key={c.id} className={choice===c.id?'ballot-card selected':'ballot-card'} onClick={()=>setChoice(c.id)}><b>{String(c.number).padStart(2,'0')}</b><div className="photo-placeholder">Foto Paslon</div><h2>{c.chair}</h2><h3>& {c.vice}</h3><span>{choice===c.id?'✓ Dipilih':'Pilih Pasangan Ini'}</span></button>)}</div>
    {choice && <div className="confirm-bar"><div><small>Pilihan Anda</small><strong>Pasangan Nomor {String(choice).padStart(2,'0')}</strong></div><button className="btn primary lg" onClick={()=>setDone(true)}>Konfirmasi & Kirim Suara</button></div>}
  </div>
}
