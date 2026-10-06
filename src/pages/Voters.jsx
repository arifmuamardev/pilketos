import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'

function normalizeKey(v=''){return String(v).trim().toLowerCase().replace(/\s+/g,' ')}
function pick(row,names){
  const entries=Object.entries(row)
  for(const name of names){
    const hit=entries.find(([k])=>normalizeKey(k)===normalizeKey(name))
    if(hit)return hit[1]
  }
  return ''
}

export default function Voters(){
  const [voters,setVoters]=useState([])
  const [stations,setStations]=useState([])
  const [election,setElection]=useState(null)
  const [query,setQuery]=useState('')
  const [preview,setPreview]=useState([])
  const [message,setMessage]=useState('')
  const [manual,setManual]=useState({student_number:'',name:'',class_name:'',polling_station_id:''})
  const fileRef=useRef(null)

  useEffect(()=>{load()},[])

  async function load(){
    const {data:e}=await supabase.from('elections').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle()
    setElection(e)
    if(!e){setVoters([]);setStations([]);return}
    const [{data:v,error:vErr},{data:s,error:sErr}]=await Promise.all([
      supabase.from('voters').select('id,student_number,name,class_name,has_voted,polling_station_id,polling_stations(name,code)').eq('election_id',e.id).order('name'),
      supabase.from('polling_stations').select('id,name,code').eq('election_id',e.id).order('code')
    ])
    if(vErr||sErr)setMessage(vErr?.message||sErr?.message)
    setVoters(v||[])
    setStations(s||[])
  }

  const editable=election&&['draft','ready'].includes(election.status)
  const filtered=voters.filter(v=>(v.student_number+' '+v.name+' '+v.class_name+' '+(v.polling_stations?.name||'')).toLowerCase().includes(query.toLowerCase()))

  const stationMap=useMemo(()=>{
    const map=new Map()
    stations.forEach(s=>{
      map.set(normalizeKey(s.code),s)
      map.set(normalizeKey(s.name),s)
    })
    return map
  },[stations])

  function downloadTemplate(){
    const rows=[['NIS','Nama','Kelas','TPS'],['10231','Ahmad Fauzan','X TKJ 1','TPS-01']]
    const ws=XLSX.utils.aoa_to_sheet(rows)
    const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'DPT')
    XLSX.writeFile(wb,'template-dpt-pilketos.xlsx')
  }

  async function parseFile(file){
    setMessage('')
    setPreview([])
    try{
      const buffer=await file.arrayBuffer()
      const wb=XLSX.read(buffer,{type:'array'})
      const ws=wb.Sheets[wb.SheetNames[0]]
      const rows=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false})
      const existing=new Set(voters.map(v=>String(v.student_number).trim()))
      const seen=new Set()
      const parsed=rows.map((row,i)=>{
        const nis=String(pick(row,['NIS','NISN','Nomor Induk','student_number'])).trim()
        const name=String(pick(row,['Nama','Nama Siswa','name'])).trim()
        const className=String(pick(row,['Kelas','class','class_name'])).trim()
        const tpsText=String(pick(row,['TPS','Kode TPS','polling_station'])).trim()
        const station=stationMap.get(normalizeKey(tpsText))
        const errors=[]
        if(!nis)errors.push('NIS kosong')
        if(!name)errors.push('Nama kosong')
        if(!className)errors.push('Kelas kosong')
        if(!tpsText)errors.push('TPS kosong')
        else if(!station)errors.push('TPS tidak ditemukan')
        if(nis&&existing.has(nis))errors.push('NIS sudah ada di DPT')
        if(nis&&seen.has(nis))errors.push('NIS duplikat dalam file')
        if(nis)seen.add(nis)
        return {row:i+2,student_number:nis,name,class_name:className,tps:tpsText,polling_station_id:station?.id||null,errors}
      }).filter(r=>r.student_number||r.name||r.class_name||r.tps)
      setPreview(parsed)
      if(!parsed.length)setMessage('Tidak ada data yang terbaca dari file.')
    }catch(err){
      setMessage('Gagal membaca file: '+err.message)
    }
  }

  async function importRows(){
    const invalid=preview.filter(r=>r.errors.length)
    if(invalid.length){setMessage('Perbaiki semua baris bermasalah sebelum impor.');return}
    if(!preview.length)return
    const payload=preview.map(r=>({
      election_id:election.id,
      polling_station_id:r.polling_station_id,
      student_number:r.student_number,
      name:r.name,
      class_name:r.class_name
    }))
    for(let i=0;i<payload.length;i+=500){
      const chunk=payload.slice(i,i+500)
      const {error}=await supabase.from('voters').insert(chunk)
      if(error){setMessage(`Impor berhenti pada baris ${i+1}-${i+chunk.length}: ${error.message}`);await load();return}
    }
    setMessage(`${payload.length} pemilih berhasil diimpor.`)
    setPreview([])
    if(fileRef.current)fileRef.current.value=''
    await load()
  }

  async function addManual(e){
    e.preventDefault()
    const {error}=await supabase.from('voters').insert({
      election_id:election.id,
      polling_station_id:manual.polling_station_id,
      student_number:manual.student_number.trim(),
      name:manual.name.trim(),
      class_name:manual.class_name.trim()
    })
    if(error){setMessage(error.message);return}
    setManual({student_number:'',name:'',class_name:'',polling_station_id:''})
    await load()
  }

  async function remove(id){
    if(!confirm('Hapus pemilih ini dari DPT?'))return
    const {error}=await supabase.from('voters').delete().eq('id',id)
    if(error){setMessage(error.message);return}
    await load()
  }

  return <>
    <header className="page-head"><div><p className="eyebrow">DAFTAR PEMILIH TETAP</p><h1>DPT</h1><p>Impor Excel/CSV dengan validasi sebelum data masuk database.</p></div>{editable&&<div className="actions"><button className="btn" onClick={downloadTemplate}>Unduh Template Excel</button><button className="btn primary" onClick={()=>fileRef.current?.click()}>Pilih File</button><input ref={fileRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={e=>e.target.files?.[0]&&parseFile(e.target.files[0])}/></div>}</header>

    {election&&!editable&&<div className="alert bad">DPT dikunci karena status pemilihan: {election.status}.</div>}

    {editable&&<section className="card" style={{marginBottom:20}}>
      <h2>Tambah Pemilih Manual</h2>
      <form className="admin-form" onSubmit={addManual}>
        <input required placeholder="NIS" value={manual.student_number} onChange={e=>setManual({...manual,student_number:e.target.value})}/>
        <input required placeholder="Nama siswa" value={manual.name} onChange={e=>setManual({...manual,name:e.target.value})}/>
        <input required placeholder="Kelas" value={manual.class_name} onChange={e=>setManual({...manual,class_name:e.target.value})}/>
        <select required value={manual.polling_station_id} onChange={e=>setManual({...manual,polling_station_id:e.target.value})}><option value="">Pilih TPS</option>{stations.map(s=><option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}</select>
        <button className="btn primary">Tambah</button>
      </form>
    </section>}

    {preview.length>0&&<section className="card import-preview" style={{marginBottom:20}}>
      <div className="card-head"><div><h2>Preview Impor</h2><p>{preview.length} baris terbaca • {preview.filter(r=>r.errors.length).length} bermasalah</p></div><div className="actions"><button className="btn" onClick={()=>setPreview([])}>Batal</button><button className="btn primary" disabled={preview.some(r=>r.errors.length)} onClick={importRows}>Impor {preview.length} Pemilih</button></div></div>
      <div className="table-scroll"><table><thead><tr><th>Baris</th><th>NIS</th><th>Nama</th><th>Kelas</th><th>TPS</th><th>Validasi</th></tr></thead><tbody>
        {preview.map(r=><tr key={r.row} className={r.errors.length?'row-error':''}><td>{r.row}</td><td>{r.student_number||'-'}</td><td>{r.name||'-'}</td><td>{r.class_name||'-'}</td><td>{r.tps||'-'}</td><td>{r.errors.length?<span className="error-text">{r.errors.join('; ')}</span>:<span className="pill done">Valid</span>}</td></tr>)}
      </tbody></table></div>
    </section>}

    {message&&<p className="form-message">{message}</p>}

    <section className="card"><div className="toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari NIS, nama, kelas, atau TPS..."/></div>
      <div className="table-scroll"><table><thead><tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>TPS</th><th>Status</th>{editable&&<th></th>}</tr></thead><tbody>{filtered.map(v=><tr key={v.id}><td>{v.student_number}</td><td><strong>{v.name}</strong></td><td>{v.class_name}</td><td>{v.polling_stations?.name||'-'}</td><td><span className={v.has_voted?'pill done':'pill pending'}>{v.has_voted?'Sudah':'Belum'}</span></td>{editable&&<td><button className="btn danger" onClick={()=>remove(v.id)}>Hapus</button></td>}</tr>)}</tbody></table></div>
    </section>
  </>
}
