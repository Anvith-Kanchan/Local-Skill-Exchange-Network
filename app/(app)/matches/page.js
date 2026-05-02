'use client';
import { useState, useEffect } from 'react';
import { Sparkles, ArrowLeftRight, Coins, Send, X, Loader2, Zap } from 'lucide-react';
import TrustBadge from '@/components/TrustBadge';
import { useToast } from '@/components/Toast';

export default function MatchesPage() {
  const addToast = useToast();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({ type: 'credit', dur: 1, msg: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch('/api/matches').then(r=>r.json()).then(d=>{setMatches(d.matches||[]);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  const sendRequest = async (match, skillId) => {
    setSending(true);
    try {
      const res = await fetch('/api/exchanges', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ providerId: match.user.id, skillRequestedId: skillId, type: form.type, durationHours: form.dur, message: form.msg }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast('Exchange request sent!', 'success');
      setSel(null);
    } catch(e) { addToast(e.message, 'error'); } finally { setSending(false); }
  };

  return (
    <div className="page-container">
      <div className="page-header animate-fadeIn"><h1>Your Matches</h1><p>People who can teach what you want to learn</p></div>
      {loading ? <div className="grid grid-2" style={{marginTop:24}}>{[1,2,3,4].map(i=><div key={i} className="skeleton" style={{height:250}}/>)}</div>
      : matches.length === 0 ? <div className="empty-state glass-card"><Sparkles size={48}/><h3>No matches yet</h3><p>Add skills you want to learn in your profile to get matched!</p></div>
      : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:'var(--space-lg)'}} className="stagger-children">
        {matches.map((m,i) => (
          <div key={m.user.id} className="glass-card" style={{padding:'var(--space-xl)',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:16,right:16,background:'var(--accent-gradient)',borderRadius:'var(--radius-full)',padding:'0.3rem 0.75rem',fontSize:'0.8rem',fontWeight:700,color:'#fff',display:'flex',alignItems:'center',gap:4}}>
              <Zap size={12}/>{m.score}% match
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'var(--space-md)',marginBottom:'var(--space-lg)'}}>
              <div className="avatar avatar-lg">{m.user.fullName?.[0]}</div>
              <div>
                <h3 style={{fontSize:'1.15rem'}}>{m.user.fullName}</h3>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                  <TrustBadge level={m.user.trustLevel} size={14}/>
                  {m.user.city && <span style={{fontSize:'0.8rem',color:'var(--text-tertiary)'}}>{m.user.city}</span>}
                </div>
              </div>
            </div>
            {m.matchedSkills.length > 0 && <div style={{marginBottom:'var(--space-md)'}}>
              <span style={{fontSize:'0.75rem',color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Can teach you</span>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:6}}>
                {m.matchedSkills.map((ms,j) => <span key={j} className="badge badge-primary">{ms.theirOffer.name}</span>)}
              </div>
            </div>}
            {m.canBarter && m.reciprocalSkills.length > 0 && <div style={{marginBottom:'var(--space-md)'}}>
              <span style={{fontSize:'0.75rem',color:'var(--success)',display:'flex',alignItems:'center',gap:4}}><ArrowLeftRight size={12}/>Direct barter possible!</span>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:6}}>
                {m.reciprocalSkills.map((rs,j) => <span key={j} className="badge badge-success">{rs.myOffer.name}</span>)}
              </div>
            </div>}
            <div style={{display:'flex',gap:6,marginTop:'var(--space-md)'}}>
              <div style={{flex:1,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,fontSize:'0.7rem',color:'var(--text-tertiary)'}}>
                <div style={{textAlign:'center'}}><div style={{fontWeight:600,color:'var(--text-secondary)'}}>{m.breakdown.trust}%</div>Trust</div>
                <div style={{textAlign:'center'}}><div style={{fontWeight:600,color:'var(--text-secondary)'}}>{m.breakdown.proficiency}%</div>Skill</div>
                <div style={{textAlign:'center'}}><div style={{fontWeight:600,color:'var(--text-secondary)'}}>{m.breakdown.reciprocity}%</div>Recip.</div>
              </div>
            </div>
            <button className="btn btn-primary w-full" style={{marginTop:'var(--space-lg)'}} onClick={()=>setSel(m)}>
              <Send size={14}/>Request Exchange
            </button>
          </div>
        ))}
      </div>}
      {sel && <div className="overlay" onClick={()=>setSel(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>Send Request to {sel.user.fullName}</h2><button className="modal-close" onClick={()=>setSel(null)}><X size={18}/></button></div>
        <div className="form-group"><label className="label">Which skill?</label>
          <select className="select" id="match-skill-select">{sel.matchedSkills.map((ms,i)=><option key={i} value={ms.theirOffer.id}>{ms.theirOffer.name}</option>)}</select>
        </div>
        <div className="form-group"><label className="label">Type</label><div className="tabs" style={{width:'fit-content'}}>
          <button className={`tab ${form.type==='credit'?'active':''}`} onClick={()=>setForm({...form,type:'credit'})}>SkillCoins</button>
          {sel.canBarter && <button className={`tab ${form.type==='barter'?'active':''}`} onClick={()=>setForm({...form,type:'barter'})}>Barter</button>}
        </div></div>
        <div className="form-group"><label className="label">Duration</label><input type="number" className="input" min="0.5" max="8" step="0.5" value={form.dur} onChange={e=>setForm({...form,dur:parseFloat(e.target.value)||1})}/></div>
        <div className="form-group"><label className="label">Message</label><textarea className="textarea" value={form.msg} onChange={e=>setForm({...form,msg:e.target.value})} placeholder="Say hello..."/></div>
        <button className="btn btn-primary w-full" disabled={sending} onClick={()=>{
          const skillId = document.getElementById('match-skill-select')?.value || sel.matchedSkills[0]?.theirOffer.id;
          sendRequest(sel, skillId);
        }}>{sending?<Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/>:<><Send size={16}/>Send</>}</button>
      </div></div>}
    </div>
  );
}
