'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, Save, Plus, X, Trash2, Coins, Loader2 } from 'lucide-react';
import TrustBadge from '@/components/TrustBadge';
import StarRating from '@/components/StarRating';
import { useToast } from '@/components/Toast';

const CATEGORIES = ['tech','music','fitness','art','cooking','language','business','craft','academic','other'];

export default function ProfilePage() {
  const router = useRouter();
  const addToast = useToast();
  const [me, setMe] = useState(null);
  const [skills, setSkills] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [newSkill, setNewSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d=>{
      if (!d?.user) { router.push('/login'); return; }
      setMe(d.user);
      setForm({ fullName: d.user.fullName, bio: d.user.bio, city: d.user.city });
      return Promise.all([
        fetch(`/api/skills?userId=${d.user.id}`).then(r=>r.json()),
        fetch(`/api/reviews?userId=${d.user.id}`).then(r=>r.json()),
      ]);
    }).then(([skillData, reviewData]) => {
      if (skillData) setSkills(skillData.skills || []);
      if (reviewData) setReviews(reviewData.reviews || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${me.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
      if (!res.ok) throw new Error('Failed to update');
      addToast('Profile updated!', 'success');
      setEditing(false);
    } catch(e) { addToast(e.message, 'error'); } finally { setSaving(false); }
  };

  const addSkill = async () => {
    if (!newSkill?.name || !newSkill?.category || !newSkill?.type) return;
    try {
      const res = await fetch('/api/skills', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(newSkill) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSkills([data.skill, ...skills]);
      setNewSkill(null);
      addToast('Skill added!', 'success');
    } catch(e) { addToast(e.message, 'error'); }
  };

  const deleteSkill = async (id) => {
    try {
      await fetch(`/api/skills/${id}`, { method: 'DELETE' });
      setSkills(skills.filter(s => s.id !== id));
      addToast('Skill removed', 'info');
    } catch(e) { addToast(e.message, 'error'); }
  };

  if (loading || !me) return <div className="page-container"><div className="skeleton" style={{height:400}}/></div>;

  return (
    <div className="page-container">
      <div className="page-header animate-fadeIn"><h1>My Profile</h1><p>Manage your profile and skill listings</p></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-xl)'}}>
        {/* Left: Profile Info */}
        <div>
          <div className="glass-card animate-fadeIn" style={{padding:'var(--space-2xl)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'var(--space-lg)',marginBottom:'var(--space-xl)'}}>
              <div className="avatar avatar-xl">{me.fullName?.[0]}</div>
              <div>
                <h2>{me.fullName}</h2>
                <p style={{color:'var(--text-secondary)',fontSize:'0.9rem'}}>@{me.username}</p>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
                  <TrustBadge level={me.trustLevel}/>
                  <span style={{display:'flex',alignItems:'center',gap:4,color:'var(--accent-warm)',fontSize:'0.85rem',fontWeight:600}}><Coins size={14}/>{me.skillCoins?.toFixed(1)} SC</span>
                </div>
              </div>
            </div>
            {editing ? <>
              <div className="form-group"><label className="label">Full Name</label><input className="input" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></div>
              <div className="form-group"><label className="label">Bio</label><textarea className="textarea" value={form.bio||''} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="Tell people about yourself..."/></div>
              <div className="form-group"><label className="label">City</label><input className="input" value={form.city||''} onChange={e=>setForm({...form,city:e.target.value})}/></div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving?<Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>:<><Save size={14}/>Save</>}</button>
                <button className="btn btn-secondary" onClick={()=>setEditing(false)}>Cancel</button>
              </div>
            </> : <>
              {me.bio && <p style={{color:'var(--text-secondary)',marginBottom:'var(--space-md)'}}>{me.bio}</p>}
              {me.city && <p style={{color:'var(--text-tertiary)',fontSize:'0.85rem',display:'flex',alignItems:'center',gap:4,marginBottom:'var(--space-md)'}}><MapPin size={14}/>{me.city}</p>}
              <button className="btn btn-secondary" onClick={()=>setEditing(true)}><User size={14}/>Edit Profile</button>
            </>}
          </div>
          {/* Reviews */}
          <div className="glass-card animate-fadeIn" style={{padding:'var(--space-xl)',marginTop:'var(--space-lg)'}}>
            <h3 style={{marginBottom:'var(--space-md)'}}>Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? <p style={{color:'var(--text-tertiary)',fontSize:'0.85rem'}}>No reviews yet</p>
            : reviews.map(r=>(
              <div key={r.id} style={{padding:'var(--space-md) 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <div className="avatar avatar-sm">{r.reviewer_name?.[0]}</div>
                  <span style={{fontWeight:500,fontSize:'0.85rem'}}>{r.reviewer_name}</span>
                  <StarRating rating={r.rating} readonly size={14}/>
                </div>
                {r.comment && <p style={{fontSize:'0.85rem',color:'var(--text-secondary)',marginLeft:40}}>{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
        {/* Right: Skills */}
        <div>
          <div className="glass-card animate-fadeIn" style={{padding:'var(--space-xl)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'var(--space-lg)'}}>
              <h3>My Skills ({skills.length})</h3>
              <button className="btn btn-primary btn-sm" onClick={()=>setNewSkill({name:'',category:'tech',type:'offer',description:'',proficiencyLevel:'intermediate',hourlyRate:1})}><Plus size={14}/>Add Skill</button>
            </div>
            {newSkill && <div style={{padding:'var(--space-lg)',background:'var(--bg-input)',borderRadius:'var(--radius-md)',marginBottom:'var(--space-lg)',border:'1px solid var(--accent-primary)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'var(--space-md)'}}><h4>New Skill</h4><button className="btn btn-ghost btn-sm" onClick={()=>setNewSkill(null)}><X size={14}/></button></div>
              <div className="form-group"><label className="label">Name</label><input className="input" value={newSkill.name} onChange={e=>setNewSkill({...newSkill,name:e.target.value})} placeholder="e.g. Python Programming"/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-md)'}}>
                <div className="form-group"><label className="label">Category</label><select className="select" value={newSkill.category} onChange={e=>setNewSkill({...newSkill,category:e.target.value})}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="label">Type</label><select className="select" value={newSkill.type} onChange={e=>setNewSkill({...newSkill,type:e.target.value})}><option value="offer">I can teach</option><option value="request">I want to learn</option></select></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-md)'}}>
                <div className="form-group"><label className="label">Level</label><select className="select" value={newSkill.proficiencyLevel} onChange={e=>setNewSkill({...newSkill,proficiencyLevel:e.target.value})}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></div>
                <div className="form-group"><label className="label">Rate (SC/hr)</label><input type="number" className="input" min="0.5" step="0.5" value={newSkill.hourlyRate} onChange={e=>setNewSkill({...newSkill,hourlyRate:parseFloat(e.target.value)||1})}/></div>
              </div>
              <div className="form-group"><label className="label">Description</label><textarea className="textarea" value={newSkill.description} onChange={e=>setNewSkill({...newSkill,description:e.target.value})} placeholder="Describe what you teach or want to learn..."/></div>
              <button className="btn btn-primary" onClick={addSkill}><Plus size={14}/>Add Skill</button>
            </div>}
            {skills.length===0 ? <p style={{color:'var(--text-tertiary)'}}>No skills listed yet. Add your first skill!</p>
            : <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {skills.map(s=>(
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:'var(--space-md)',padding:'var(--space-md)',background:'var(--bg-input)',borderRadius:'var(--radius-md)'}}>
                  <span className={`category-dot cat-${s.category}`}/>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontWeight:500,fontSize:'0.9rem'}}>{s.name}</span>
                      <span className={`badge ${s.type==='offer'?'badge-success':'badge-info'}`}>{s.type==='offer'?'Teaching':'Learning'}</span>
                    </div>
                    <span style={{fontSize:'0.75rem',color:'var(--text-tertiary)'}}>{s.category} • {s.proficiency_level} • {s.hourly_rate} SC/hr</span>
                  </div>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>deleteSkill(s.id)}><Trash2 size={14}/></button>
                </div>
              ))}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
