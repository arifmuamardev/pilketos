import { stations } from '../lib/mock'
export default function Tps(){
  return <>
    <header className="page-head"><div><p className="eyebrow">TEMPAT PEMUNGUTAN SUARA</p><h1>TPS</h1><p>Atur pembagian pemilih dan akses petugas TPS.</p></div><button className="btn primary">+ Tambah TPS</button></header>
    <div className="tps-grid">{stations.map(s=><article className="card" key={s.id}><div className="card-head"><div><h2>{s.name}</h2><p>{s.voters} pemilih terdaftar</p></div><span className="pill done">Aktif</span></div><div className="tps-big">{s.voted}<small>sudah memilih</small></div><div className="actions"><button className="btn">Kelola</button><a className="btn primary" href="#/tps/1">Buka TPS</a></div></article>)}</div>
  </>
}
