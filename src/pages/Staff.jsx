import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Staff(){
  const [stations,setStations]=useState([])
  const [users,setUsers]=useState([])
  const [form,setForm]=useState({email:'',display_name:'',role:'officer',polling_station_id:''})
  const [message,setMessage]=useState('')

  useEffect(()=>{load()},[])

  async function load(){
    const [{data:s},{data:u}] = await Promise.all([
      supabase.from('polling_stations').select('id,name,code').order('code'),
      supabase.from('app_users').select('user_id,display_name,role,polling_station_id,polling_stations(name)').order('display_name')
    ])
    setStations(s||[])
    setUsers(u||[])
  }

  async function assign(e){
    e.preventDefault()
    setMessage('')
    const {error}=await supabase.rpc('assign_app_user',{
      p_email:form.email,
      p_display_name:form.display_name,
      p_role:form.role,
      p_polling_station_id:form.role==='officer' ? form.polling_station_id || null : null
    })
    if(error){setMessage(error.message);return}
    setMessage('Role berhasil diberikan.')
    setForm({email:'',display_name:'',role:'officer',polling_station_id:''})
    await load()
  }

  return <>
    <header className="page-head"><div><p className="eyebrow">AKSES PANITIA</p><h1>Admin & Petugas TPS</h1><p>Petugas harus mendaftar akun terlebih dahulu, lalu admin memberikan role di sini.</p></div></header>
    <section className="card" style={{marginBottom:20}}>
      <form className="admin-form" onSubmit={assign}>
        <input required type="email" placeholder="Email akun petugas" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
        <input required placeholder="Nama petugas" value={form.display_name} onChange={e=>setForm({...form,display_name:e.target.value})}/>
        <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
          <option value="officer">Petugas TPS</option>
          <option value="admin">Admin</option>
        </select>
        {form.role==='officer' && <select required value={form.polling_station_id} onChange={e=>setForm({...form,polling_station_id:e.target.value})}>
          <option value="">Pilih TPS</option>
          {stations.map(s=><option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
        </select>}
        <button className="btn primary">Simpan Akses</button>
      </form>
      {message && <p className="form-message">{message}</p>}
    </section>
    <section className="card">
      <table><thead><tr><th>Nama</th><th>Role</th><th>TPS</th></tr></thead><tbody>
        {users.map(u=><tr key={u.user_id}><td><strong>{u.display_name}</strong></td><td>{u.role}</td><td>{u.polling_stations?.name || '-'}</td></tr>)}
      </tbody></table>
    </section>
  </>
}
