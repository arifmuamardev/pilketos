import { candidates } from '../lib/mock'
export default function Candidates(){
  return <>
    <header className="page-head"><div><p className="eyebrow">PERSIAPAN</p><h1>Kandidat Pilketos</h1><p>Kelola pasangan calon ketua dan wakil ketua OSIS.</p></div><button className="btn primary">+ Tambah Kandidat</button></header>
    <div className="candidate-grid">{candidates.map(c=><article className="candidate-card" key={c.id}><div className="candidate-number">{String(c.number).padStart(2,'0')}</div><div className="photo-placeholder">Foto Paslon</div><h3>{c.chair}<br/><span>& {c.vice}</span></h3><p>{c.className}</p><blockquote>{c.vision}</blockquote><button className="btn">Edit</button></article>)}</div>
  </>
}
