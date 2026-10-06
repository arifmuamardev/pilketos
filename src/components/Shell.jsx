import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const items = [
  ['/admin', 'Dashboard'],
  ['/admin/candidates', 'Kandidat'],
  ['/admin/voters', 'DPT'],
  ['/admin/tps', 'TPS'],
  ['/admin/results', 'Hasil'],
]

export default function Shell() {
  const { profile, signOut } = useAuth()
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">P</span><div><strong>Pilketos</strong><small>Admin Panel</small></div></div>
      <nav>{items.map(([to,label]) => <NavLink key={to} to={to} end={to==='/admin'} className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>{label}</NavLink>)}</nav>
      <div className="sidebar-note">
        <strong>{profile?.display_name}</strong><br/>
        Administrator
        <br/><br/>
        <button className="btn full" onClick={signOut}>Keluar</button>
      </div>
    </aside>
    <main className="main"><Outlet /></main>
  </div>
}
