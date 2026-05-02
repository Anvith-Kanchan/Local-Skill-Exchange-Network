'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Calendar, Coins, Send, ArrowLeftRight } from 'lucide-react';
import TrustBadge from '@/components/TrustBadge';
import StarRating from '@/components/StarRating';

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d=>setMe(d?.user));
    fetch(`/api/users/${id}`).then(r=>r.json()).then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));
  }, [id]);

  if (loading || !data?.user) return <div className="page-container"><div className="skeleton" style={{height:400}}/></div>;
  const u = data.user;
  const offers = data.skills?.filter(s=>s.type==='offer') || [];
  const requests = data.skills?.filter(s=>s.type==='request') || [];

  return (
    <div className="page-container" style={{maxWidth:800}}>
      <div className="glass-card animate-fadeIn" style={{padding:'var(--space-2xl)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'var(--space-xl)',marginBottom:'var(--space-xl)'}}>
          <div className="avatar avatar-xl">{u.fullName?.[0]}</div>
          <div style={{flex:1}}>
            <h1 style={{fontSize:'1.75rem'}}>{u.fullName}</h1>
            <p style={{color:'var(--text-secondary)'}}>@{u.username}</p>
            <div style={{display:'flex',alignItems:'center',gap:12,marginTop:8,flexWrap:'wrap'}}>
              <TrustBadge level={u.trustLevel}/>
              {u.reputationScore > 0 && <div style={{display:'flex',alignItems:'center',gap:4}}><StarRating rating={Math.round(u.reputationScore)} readonly size={14}/><span style={{fontSize:'0.8rem',color:'var(--text-tertiary)'}}>{u.reputationScore.toFixed(1)}</span></div>}
              {u.city && <span style={{fontSize:'0.85rem',color:'var(--text-tertiary)',display:'flex',alignItems:'center',gap:4}}><MapPin size={14}/>{u.city}</span>}
              <span style={{fontSize:'0.85rem',color:'var(--text-tertiary)',display:'flex',alignItems:'center',gap:4}}><ArrowLeftRight size={14}/>{u.totalExchanges} exchanges</span>
            </div>
          </div>
          {me && me.id !== u.id && <button className="btn btn-primary" onClick={()=>router.push('/explore')}><Send size={14}/>Exchange</button>}
        </div>
        {u.bio && <p style={{color:'var(--text-secondary)',lineHeight:1.7,marginBottom:'var(--space-xl)'}}>{u.bio}</p>}
      </div>

      {/* Skills */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-lg)',marginTop:'var(--space-lg)'}}>
        <div className="glass-card animate-fadeIn" style={{padding:'var(--space-xl)'}}>
          <h3 style={{marginBottom:'var(--space-md)',color:'var(--success)'}}>Can Teach ({offers.length})</h3>
          {offers.map(s=>(
            <div key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
              <span className={`category-dot cat-${s.category}`}/>
              <span style={{flex:1,fontSize:'0.9rem'}}>{s.name}</span>
              <span style={{fontSize:'0.75rem',color:'var(--accent-warm)',display:'flex',alignItems:'center',gap:4}}><Coins size={12}/>{s.hourly_rate}/hr</span>
            </div>
          ))}
          {offers.length===0 && <p style={{color:'var(--text-tertiary)',fontSize:'0.85rem'}}>No skills listed</p>}
        </div>
        <div className="glass-card animate-fadeIn" style={{padding:'var(--space-xl)'}}>
          <h3 style={{marginBottom:'var(--space-md)',color:'var(--info)'}}>Wants to Learn ({requests.length})</h3>
          {requests.map(s=>(
            <div key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
              <span className={`category-dot cat-${s.category}`}/>
              <span style={{flex:1,fontSize:'0.9rem'}}>{s.name}</span>
            </div>
          ))}
          {requests.length===0 && <p style={{color:'var(--text-tertiary)',fontSize:'0.85rem'}}>No requests listed</p>}
        </div>
      </div>

      {/* Reviews */}
      <div className="glass-card animate-fadeIn" style={{padding:'var(--space-xl)',marginTop:'var(--space-lg)'}}>
        <h3 style={{marginBottom:'var(--space-md)'}}>Reviews ({data.reviews?.length || 0})</h3>
        {data.reviews?.length === 0 ? <p style={{color:'var(--text-tertiary)',fontSize:'0.85rem'}}>No reviews yet</p>
        : data.reviews.map(r=>(
          <div key={r.id} style={{padding:'var(--space-md) 0',borderBottom:'1px solid var(--border)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <div className="avatar avatar-sm">{r.reviewer_name?.[0]}</div>
              <span style={{fontWeight:500,fontSize:'0.85rem'}}>{r.reviewer_name}</span>
              <StarRating rating={r.rating} readonly size={14}/>
              <span style={{fontSize:'0.7rem',color:'var(--text-tertiary)',marginLeft:'auto'}}>{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            {r.comment && <p style={{fontSize:'0.85rem',color:'var(--text-secondary)',marginLeft:40}}>{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
