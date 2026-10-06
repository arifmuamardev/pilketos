import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './context/AuthContext'
import DemoCandidateIllustration from './components/DemoCandidateIllustration'

function queryStation(){
  return new URLSearchParams(window.location.search).get('station') || ''
}

export default function TpsPortal(){
  const {user,profile,loading,refresh,signOut}=useAuth()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  const [stations,setStations]=useState([])
  const [stationId,setStationId]=useState(queryStation())
  const [station,setStation]=useState(null)
  const [stats,setStats]=useState({total:0,voted:0})
  const [nisn,setNisn]=useState('')
  const [pin,setPin]=useState('')
  const [voteToken,setVoteToken]=useState('')
  const [election,setElection]=useState(null)
  const [candidates,setCandidates]=useState([])
  const [choice,setChoice]=useState(null)
  const [done,setDone]=useState(false)

  useEffect(()=>{
    if(!profile)return
    if(profile.role==='officer' && profile.polling_station_id){
      setStationId(profile.polling_station_id)
    }
    if(profile.role==='admin') loadStations()
  },[profile])

  useEffect(()=>{
    if(profile && stationId) loadStation(stationId)
  },[profile,stationId])

  async function loginStaff(e){
    e.preventDefault()
    setBusy(true);setMessage('')
    const {error}=await supabase.auth.signInWithPassword({email,password})
    if(error){setMessage(error.message);setBusy(false);return}
    await refresh()
    setBusy(false)
  }

  async function loadStations(){
    const {data:e,error:eErr}=await supabase.from('elections').select('id,name,status').order('created_at',{ascending:false}).limit(1).maybeSingle()
    if(eErr){setMessage(eErr.message);return}
    if(!e){setStations([]);return}
    const {data,error}=await supabase.from('polling_stations').select('id,code,name,election_id').eq('election_id',e.id).order('code')
    if(error){setMessage(error.message);return}
    setStations(data||[])
    const requested=queryStation()
    if(requested && (data||[]).some(s=>s.id===requested)) setStationId(requested)
  }

  async function loadStation(id){
    setMessage('')
    const [{data:s,error:sErr},{data:v,error:vErr}]=await Promise.all([
      supabase.from('polling_stations').select('id,code,name,election_id').eq('id',id).maybeSingle(),
      supabase.from('voters').select('has_voted').eq('polling_station_id',id)
    ])
    if(sErr||vErr){setMessage(sErr?.message||vErr?.message);return}
    setStation(s)
    const rows=v||[]
    setStats({total:rows.length,voted:rows.filter(x=>x.has_voted).length})
  }

  async function studentLogin(e){
    e.preventDefault()
    if(!stationId||!nisn.trim()||pin.length!==6)return
    setBusy(true);setMessage('')
    const {data,error}=await supabase.rpc('student_login',{
      p_polling_station_id:stationId,
      p_student_number:nisn.trim(),
      p_pin:pin
    })
    if(error){
      setMessage(error.message)
      setPin('')
      setBusy(false)
      return
    }

    const {data:el,error:eErr}=await supabase.from('elections')
      .select('id,name,status,is_demo')
      .eq('id',station.election_id)
      .eq('status','open')
      .maybeSingle()
    if(eErr||!el){
      setMessage(eErr?.message||'Pemungutan suara tidak sedang dibuka.')
      setBusy(false)
      return
    }

    const {data:c,error:cErr}=await supabase.from('candidates')
      .select('id,ballot_number,chair_name,vice_name,chair_class,vice_class,vision,photo_url')
      .eq('election_id',el.id)
      .order('ballot_number')
    if(cErr){setMessage(cErr.message);setBusy(false);return}

    setVoteToken(data)
    setElection(el)
    setCandidates(c||[])
    setChoice(null)
    setNisn('')
    setPin('')
    setBusy(false)
  }

  async function submitVote(){
    if(!voteToken||!choice)return
    setBusy(true);setMessage('')
    const {error}=await supabase.rpc('cast_vote',{
      p_token:voteToken,
      p_candidate_id:choice,
      p_blank:false
    })
    if(error){setMessage(error.message);setBusy(false);return}
    setVoteToken('')
    setChoice(null)
    setDone(true)
    setBusy(false)
    await loadStation(stationId)
  }

  function nextVoter(){
    setDone(false)
    setElection(null)
    setCandidates([])
    setChoice(null)
    setMessage('')
    setNisn('')
    setPin('')
  }

  async function logout(){
    await signOut()
    setStation(null);setStationId('');setStations([]);setDone(false);setVoteToken('')
  }

  const selectedCandidate=useMemo(
    ()=>candidates.find(c=>c.id===choice),
    [candidates,choice]
  )

  if(loading){
    return <div className="tps-portal-shell"><div className="kiosk-card auth-card"><h2>Memuat Portal TPS...</h2></div></div>
  }

  if(!user){
    return <div className="tps-portal-shell">
      <form className="kiosk-card auth-card" onSubmit={loginStaff}>
        <p className="eyebrow">PORTAL TPS</p>
        <h1>Login Petugas TPS</h1>
        <p>Login ini dilakukan sekali pada laptop TPS sebelum pemungutan dimulai.</p>
        <input className="search-lg" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email petugas"/>
        <input className="search-lg" type="password" required minLength="8" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/>
        <button className="btn primary lg full" disabled={busy}>{busy?'Memproses...':'Masuk Portal TPS'}</button>
        {message&&<div className="alert bad">{message}</div>}
      </form>
    </div>
  }

  if(!profile){
    return <div className="tps-portal-shell"><div className="kiosk-card auth-card">
      <p className="eyebrow">PORTAL TPS</p>
      <h1>Akun belum memiliki akses</h1>
      <p>Minta Admin menetapkan akun ini sebagai Petugas TPS.</p>
      <button className="btn full" onClick={logout}>Keluar</button>
    </div></div>
  }

  if(profile.role==='officer' && !profile.polling_station_id){
    return <div className="tps-portal-shell"><div className="kiosk-card auth-card">
      <p className="eyebrow">PORTAL TPS</p>
      <h1>TPS belum ditetapkan</h1>
      <p>Akun petugas ini belum dihubungkan ke TPS tertentu.</p>
      <button className="btn full" onClick={logout}>Keluar</button>
    </div></div>
  }

  if(profile.role==='admin' && !stationId){
    return <div className="tps-portal-shell"><div className="kiosk-card wide">
      <div className="card-head">
        <div><p className="eyebrow">PORTAL TPS • MODE ADMIN</p><h1>Pilih TPS untuk Simulasi</h1></div>
        <button className="btn" onClick={logout}>Keluar</button>
      </div>
      <p>Akun Admin dapat memilih TPS untuk keperluan pengujian. Pada hari H, gunakan akun Petugas yang sudah dikunci ke TPS masing-masing.</p>
      <div className="tps-grid">
        {stations.map(s=><button key={s.id} className="card tps-select-card" onClick={()=>setStationId(s.id)}>
          <strong>{s.code}</strong><span>{s.name}</span>
        </button>)}
      </div>
      {!stations.length&&<div className="alert bad">Belum ada TPS pada pemilihan terbaru.</div>}
      {message&&<div className="alert bad">{message}</div>}
    </div></div>
  }

  if(done){
    return <div className="tps-portal-shell"><div className="success tps-success">
      <div>✓</div>
      <h1>Suara berhasil disimpan</h1>
      <p>Terima kasih. Sesi pemilih telah selesai.</p>
      <button className="btn primary lg" onClick={nextVoter}>Pemilih Berikutnya</button>
    </div></div>
  }

  if(voteToken){
    return <div className="vote-page tps-vote-embedded">
      <header className="vote-head">
        <p>{election?.name||'PILKETOS'} • {station?.code}</p>
        <h1>Pilih Ketua & Wakil Ketua OSIS</h1>
        <span>Pilih satu pasangan calon, lalu konfirmasi.</span>
      </header>
      {message&&<div className="alert bad" style={{maxWidth:900,margin:'0 auto 20px'}}>{message}</div>}
      <div className="ballot">{candidates.map(c=><button key={c.id} className={choice===c.id?'ballot-card selected':'ballot-card'} onClick={()=>setChoice(c.id)}>
        <b>{String(c.ballot_number).padStart(2,'0')}</b>
        <div className="photo-placeholder">{c.photo_url?<img src={c.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:12}}/>:election?.is_demo?<DemoCandidateIllustration chairName={c.chair_name} viceName={c.vice_name} number={c.ballot_number}/>: 'Foto Paslon'}</div>
        <h2>{c.chair_name}</h2><h3>& {c.vice_name}</h3>
        <span>{choice===c.id?'✓ Dipilih':'Pilih Pasangan Ini'}</span>
      </button>)}</div>
      {choice&&<div className="confirm-bar">
        <div><small>Pilihan Anda</small><strong>Pasangan Nomor {String(selectedCandidate?.ballot_number||'').padStart(2,'0')}</strong></div>
        <button className="btn primary lg" disabled={busy} onClick={submitVote}>{busy?'Menyimpan...':'Konfirmasi & Kirim Suara'}</button>
      </div>}
    </div>
  }

  return <div className="tps-portal-shell">
    <div className="kiosk-card auth-card voter-login-card">
      <div className="tps-login-head">
        <div>
          <p className="eyebrow">{station?.code||'TPS'} • {station?.name||'LOADING'}</p>
          <h1>Login Pemilih</h1>
          <p>Masukkan NISN dan PIN 6 digit yang diberikan panitia.</p>
        </div>
        <span className="pill done">{stats.voted} / {stats.total}</span>
      </div>

      <form onSubmit={studentLogin} className="voter-login-form">
        <label>NISN
          <input className="search-lg" inputMode="numeric" autoComplete="off" required value={nisn}
            onChange={e=>setNisn(e.target.value.replace(/\D/g,''))} placeholder="Masukkan NISN" autoFocus/>
        </label>
        <label>PIN Pemilih
          <input className="pin-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength="6" maxLength="6"
            required value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} placeholder="••••••"/>
        </label>
        <button className="btn primary lg full" disabled={busy||pin.length!==6}>{busy?'Memverifikasi...':'Masuk ke Bilik Suara'}</button>
      </form>

      {message&&<div className="alert bad">{message}</div>}
      <div className="tps-device-foot">
        <small>Perangkat TPS aktif • {station?.code||'TPS'}</small>
      </div>
    </div>
  </div>
}
