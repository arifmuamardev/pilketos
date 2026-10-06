import { voters } from '../lib/mock'
export default function Voters(){
  return <>
    <header className="page-head"><div><p className="eyebrow">DAFTAR PEMILIH TETAP</p><h1>DPT</h1><p>Impor data siswa dan pantau status penggunaan hak pilih.</p></div><div className="actions"><button className="btn">Unduh Template</button><button className="btn primary">Impor Excel</button></div></header>
    <section className="card"><div className="toolbar"><input placeholder="Cari NIS atau nama siswa..."/><select><option>Semua TPS</option><option>TPS 01</option></select><select><option>Semua status</option><option>Belum memilih</option><option>Sudah memilih</option></select></div>
    <table><thead><tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>TPS</th><th>Status</th></tr></thead><tbody>{voters.map(v=><tr key={v.nis}><td>{v.nis}</td><td><strong>{v.name}</strong></td><td>{v.className}</td><td>{v.station}</td><td><span className={v.voted?'pill done':'pill pending'}>{v.voted?'Sudah':'Belum'}</span></td></tr>)}</tbody></table></section>
  </>
}
