function initials(name=''){
  return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()
}

export default function DemoCandidateIllustration({ chairName, viceName, number }){
  const palette = [
    ['#dbeafe','#bfdbfe','#1d4ed8'],
    ['#ede9fe','#ddd6fe','#6d28d9'],
    ['#fee2e2','#fecaca','#b91c1c'],
  ][Math.max(0, Math.min(2, Number(number||1)-1))]

  return <div className="demo-illustration" style={{background:`linear-gradient(135deg,${palette[0]},${palette[1]})`}}>
    <div className="demo-person left">
      <div className="demo-head"></div>
      <div className="demo-body"></div>
      <span>{initials(chairName)}</span>
    </div>
    <div className="demo-person right">
      <div className="demo-head"></div>
      <div className="demo-body"></div>
      <span>{initials(viceName)}</span>
    </div>
    <div className="demo-number-badge" style={{background:palette[2]}}>{String(number||'').padStart(2,'0')}</div>
  </div>
}
