'use client';
import { useState, useEffect } from 'react';
import { Search, Filter, Code, Music, Dumbbell, Palette, ChefHat, Globe, Briefcase, Wrench, GraduationCap, Coins, X, Loader2, Send, ArrowLeftRight, MapPin } from 'lucide-react';
import TrustBadge from '@/components/TrustBadge';
import { useToast } from '@/components/Toast';

const CATS = [
  { v: '', l: 'All', i: Filter }, { v: 'tech', l: 'Tech', i: Code }, { v: 'music', l: 'Music', i: Music },
  { v: 'fitness', l: 'Fitness', i: Dumbbell }, { v: 'art', l: 'Art', i: Palette }, { v: 'cooking', l: 'Cooking', i: ChefHat },
  { v: 'language', l: 'Language', i: Globe }, { v: 'business', l: 'Business', i: Briefcase },
  { v: 'craft', l: 'Craft', i: Wrench }, { v: 'academic', l: 'Academic', i: GraduationCap },
];
const PROF = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

export default function ExplorePage() {
  const addToast = useToast();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('offer');
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({ type: 'credit', dur: 1, msg: '' });
  const [sending, setSending] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => { fetch('/api/auth/me').then(r=>r.json()).then(d=>setMe(d?.user)).catch(()=>{}); }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (type) p.set('type', type);
    if (search) p.set('search', search);
    fetch(`/api/skills?${p}`).then(r=>r.json()).then(d=>{setSkills(d.skills||[]);setLoading(false);}).catch(()=>setLoading(false));
  }, [category, type, search]);

  const sendRequest = async () => {
    if (!sel) return;
    setSending(true);
    try {
      const res = await fetch('/api/exchanges', { method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ providerId: sel.user_id, skillRequestedId: sel.id, type: form.type, durationHours: form.dur, message: form.msg }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast('Exchange request sent!', 'success');
      setSel(null);
    } catch (e) { addToast(e.message, 'error'); } finally { setSending(false); }
  };

  return (
    <div className="page-container">
      <div className="page-header animate-fadeIn"><h1>Explore Skills</h1><p>Discover skills from people in your community</p></div>
      <div className="glass-card animate-fadeIn" style={{padding:'var(--space-lg)'}}>
        <div style={{position:'relative',marginBottom:'var(--space-md)'}}>
          <Search size={18} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-tertiary)',pointerEvents:'none'}} />
          <input type="text" className="input" placeholder="Search skills..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:40}} />
        </div>
        <div className="tabs" style={{width:'fit-content',marginBottom:'var(--space-md)'}}>
          <button className={`tab ${type==='offer'?'active':''}`} onClick={()=>setType('offer')}>People Teaching</button>
          <button className={`tab ${type==='request'?'active':''}`} onClick={()=>setType('request')}>People Learning</button>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {CATS.map(({v,l,i:Icon})=>(<button key={v} onClick={()=>setCategory(v)} style={{display:'flex',alignItems:'center',gap:5,padding:'0.3rem 0.7rem',border:`1px solid ${category===v?'var(--accent-primary)':'var(--border)'}`,background:category===v?'var(--accent-primary)':'transparent',color:category===v?'#fff':'var(--text-secondary)',borderRadius:'9999px',fontSize:'0.8rem',cursor:'pointer',fontFamily:'var(--font-body)'}}><Icon size={14}/><span>{l}</span></button>))}
        </div>
      </div>
      {loading ? <div className="grid grid-3" style={{marginTop:24}}>{[1,2,3,4,5,6].map(i=><div key={i} className="skeleton" style={{height:200}}/>)}</div>
      : skills.filter(s=>s.user_id!==me?.id).length===0 ? <div className="empty-state glass-card" style={{marginTop:24}}><h3>No skills found</h3><p>Try adjusting your filters</p></div>
      : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'var(--space-lg)',marginTop:24}} className="stagger-children">
          {skills.filter(s=>s.user_id!==me?.id).map(s=>(
            <div key={s.id} className="glass-card" style={{padding:'var(--space-xl)',cursor:'pointer'}} onClick={()=>setSel(s)}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:'var(--space-sm)'}}>
                <span className={`category-dot cat-${s.category}`}/><span style={{fontSize:'0.75rem',color:'var(--text-tertiary)',textTransform:'uppercase',flex:1}}>{s.category}</span>
                <span style={{display:'flex',alignItems:'center',gap:4,fontSize:'0.8rem',color:'var(--accent-warm)',fontWeight:600}}><Coins size={12}/>{s.hourly_rate}/hr</span>
              </div>
              <h3 style={{fontSize:'1.15rem',marginBottom:'var(--space-sm)'}}>{s.name}</h3>
              {s.description && <p style={{fontSize:'0.85rem',color:'var(--text-secondary)',lineHeight:1.5,marginBottom:'var(--space-md)'}}>{s.description.substring(0,100)}</p>}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'var(--space-md)'}}>
                <span style={{fontSize:'0.75rem',color:'var(--text-tertiary)',textTransform:'capitalize',minWidth:80}}>{s.proficiency_level}</span>
                <div className="proficiency-bar">{[1,2,3,4].map(i=><div key={i} className={`proficiency-segment ${i<=PROF[s.proficiency_level]?'filled':''}`}/>)}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:'var(--space-md)',borderTop:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div className="avatar avatar-sm">{s.full_name?.[0]}</div>
                  <div><span style={{fontSize:'0.85rem',fontWeight:500,display:'block'}}>{s.full_name}</span>
                    {s.city && <span style={{fontSize:'0.7rem',color:'var(--text-tertiary)',display:'flex',alignItems:'center',gap:3}}><MapPin size={10}/>{s.city}</span>}
                  </div>
                </div>
                <TrustBadge level={s.trust_level} showLabel={false} size={14}/>
              </div>
            </div>
          ))}
        </div>}
      {sel && <div className="overlay" onClick={()=>setSel(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>Request Exchange</h2><button className="modal-close" onClick={()=>setSel(null)}><X size={18}/></button></div>
        <div style={{display:'flex',alignItems:'center',gap:'var(--space-md)',marginBottom:16}}><div className="avatar">{sel.full_name?.[0]}</div><div><h4>{sel.full_name}</h4><p style={{color:'var(--text-secondary)',fontSize:'0.85rem'}}>{sel.name} • {sel.proficiency_level}</p></div></div>
        <div className="form-group"><label className="label">Exchange Type</label><div className="tabs" style={{width:'fit-content'}}>
          <button className={`tab ${form.type==='credit'?'active':''}`} onClick={()=>setForm({...form,type:'credit'})}><Coins size={14}/>SkillCoins</button>
          <button className={`tab ${form.type==='barter'?'active':''}`} onClick={()=>setForm({...form,type:'barter'})}><ArrowLeftRight size={14}/>Barter</button>
        </div></div>
        <div className="form-group"><label className="label">Duration (hours)</label><input type="number" className="input" min="0.5" max="8" step="0.5" value={form.dur} onChange={e=>setForm({...form,dur:parseFloat(e.target.value)||1})}/>
          {form.type==='credit' && <p style={{color:'var(--accent-warm)',fontSize:'0.8rem',marginTop:4}}>Cost: {(sel.hourly_rate*form.dur).toFixed(1)} SkillCoins</p>}
        </div>
        <div className="form-group"><label className="label">Message</label><textarea className="textarea" placeholder="Introduce yourself..." value={form.msg} onChange={e=>setForm({...form,msg:e.target.value})}/></div>
        <button className="btn btn-primary w-full" onClick={sendRequest} disabled={sending}>{sending?<Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/>:<><Send size={16}/>Send Request</>}</button>
      </div></div>}
    </div>
  );
}
