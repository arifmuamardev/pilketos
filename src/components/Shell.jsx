import { NavLink, Outlet } from 'react-router-dom'

const items = [
  ['/admin', 'Dashboard'],
  ['/admin/candidates', 'Kandidat'],
  ['/admin/voters', 'DPT'],
  ['/admin/tps', 'TPS'],
  ['/admin/results', 'Hasil'],
]

export default function Shell() {
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">P</span><div><strong>Pilketos</strong><small>Admin Panel</small></div></div>
      <nav>{items.map(([to,label]) => <NavLink key={to} to={to} end={to==='/admin'} className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>{label}</NavLink>)}</nav>
      <div className="sidebar-note">Sistem Pemilihan Ketua & Wakil Ketua OSIS</div>
    </aside>
    <main className="main"><Outlet /></main>
  </div>
}
