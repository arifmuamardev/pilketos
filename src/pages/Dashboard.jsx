import { stations } from '../lib/mock'

export default function Dashboard(){
  const total = stations.reduce((a,s)=>a+s.voters,0)
  const voted = stations.reduce((a,s)=>a+s.voted,0)
  return <>
    <header className="page-head"><div><p className="eyebrow">PILKETOS 2026</p><h1>Dashboard Panitia</h1><p>Monitoring partisipasi tanpa menampilkan perolehan suara sementara.</p></div><span className="status live">● Pemungutan berlangsung</span></header>
    <section className="stats">
      <article><span>Total DPT</span><strong>{total}</strong></article>
      <article><span>Sudah memilih</span><strong>{voted}</strong></article>
      <article><span>Belum memilih</span><strong>{total-voted}</strong></article>
      <article><span>Partisipasi</span><strong>{((voted/total)*100).toFixed(1)}%</strong></article>
    </section>
    <section className="card"><div className="card-head"><div><h2>Partisipasi per TPS</h2><p>Hasil kandidat tetap terkunci sampai pemungutan ditutup.</p></div></div>
      <div className="station-list">{stations.map(s => <div className="station-row" key={s.id}><div><strong>{s.name}</strong><small>{s.voted} dari {s.voters} pemilih</small></div><div className="progress"><i style={{width:`${s.voted/s.voters*100}%`}} /></div><b>{(s.voted/s.voters*100).toFixed(0)}%</b></div>)}</div>
    </section>
  </>
}
