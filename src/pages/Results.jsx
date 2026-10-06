export default function Results(){
  return <>
    <header className="page-head"><div><p className="eyebrow">REKAPITULASI</p><h1>Hasil Pilketos</h1><p>Perolehan suara baru tersedia setelah pemungutan ditutup.</p></div></header>
    <section className="locked"><div className="lock-icon">🔒</div><h2>Hasil masih terkunci</h2><p>Untuk menjaga fairness, panitia dan petugas TPS tidak dapat melihat perolehan suara sementara.</p><button className="btn danger">Tutup Pemungutan Suara</button></section>
  </>
}
