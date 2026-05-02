'use client';
import { useState, useEffect } from 'react';
import { ArrowLeftRight, Check, X, Clock, AlertTriangle, CheckCircle, Star, Loader2 } from 'lucide-react';
import TrustBadge from '@/components/TrustBadge';
import StarRating from '@/components/StarRating';
import { useToast } from '@/components/Toast';

const STATUS_MAP = { pending:'warning', in_progress:'primary', completed:'success', cancelled:'danger', disputed:'danger' };

export default function ExchangesPage() {
  const addToast = useToast();
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [me, setMe] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [acting, setActing] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d=>setMe(d?.user));
    loadExchanges();
  }, []);

  const loadExchanges = () => {
    fetch('/api/exchanges').then(r=>r.json()).then(d=>{setExchanges(d.exchanges||[]);setLoading(false);}).catch(()=>setLoading(false));
  };

  const handleAction = async (id, action, extra={}) => {
    setActing(id+action);
    try {
      const res = await fetch(`/api/exchanges/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action,...extra}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast(`Exchange ${action}ed successfully`, 'success');
      loadExchanges();
      setScheduleModal(null);
    } catch(e) { addToast(e.message, 'error'); } finally { setActing(null); }
  };

  const submitReview = async () => {
    try {
      const res = await fetch('/api/reviews', { method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ exchangeId:reviewModal.id, rating:review.rating, comment:review.comment }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast('Review submitted!', 'success');
      setReviewModal(null);
      setReview({ rating:5, comment:'' });
    } catch(e) { addToast(e.message, 'error'); }
  };

  const filtered = tab === 'all' ? exchanges : exchanges.filter(e=>e.status===tab);

  return (
    <div className="page-container">
      <div className="page-header animate-fadeIn"><h1>My Exchanges</h1><p>Track and manage your skill exchanges</p></div>
      <div className="tabs animate-fadeIn">
        {['all','pending','in_progress','completed','cancelled'].map(t=>(
          <button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>
            {t==='all'?'All':t==='in_progress'?'Active':t.charAt(0).toUpperCase()+t.slice(1)}
            {t!=='all' && <span style={{marginLeft:6,opacity:0.7}}>({exchanges.filter(e=>t==='all'||e.status===t).length})</span>}
          </button>
        ))}
      </div>
      {loading ? <div style={{display:'flex',flexDirection:'column',gap:16}}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{height:120}}/>)}</div>
      : filtered.length === 0 ? <div className="empty-state glass-card"><ArrowLeftRight size={48}/><h3>No exchanges</h3><p>Start by exploring skills and sending requests!</p></div>
      : <div style={{display:'flex',flexDirection:'column',gap:'var(--space-md)'}} className="stagger-children">
        {filtered.map(ex => {
          const isReq = ex.requester_id === me?.id;
          const partner = isReq ? { name:ex.provider_name, avatar:ex.provider_avatar, trust:ex.provider_trust, id:ex.provider_id }
                                : { name:ex.requester_name, avatar:ex.requester_avatar, trust:ex.requester_trust, id:ex.requester_id };
          return (
            <div key={ex.id} className="glass-card" style={{padding:'var(--space-xl)'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:'var(--space-lg)'}}>
                <div className="avatar avatar-lg">{partner.name?.[0]}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div>
                      <h3 style={{fontSize:'1.1rem'}}>{partner.name}</h3>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}><TrustBadge level={partner.trust} size={13}/></div>
                    </div>
                    <span className={`badge badge-${STATUS_MAP[ex.status]}`}>{ex.status.replace('_',' ')}</span>
                  </div>
                  <div style={{display:'flex',gap:'var(--space-xl)',fontSize:'0.85rem',color:'var(--text-secondary)',marginBottom:8,flexWrap:'wrap'}}>
                    <span><strong>Skill:</strong> {ex.skill_requested_name}</span>
                    <span><strong>Type:</strong> {ex.type}</span>
                    <span><strong>Duration:</strong> {ex.duration_hours}h</span>
                    {ex.type==='credit' && <span><strong>Cost:</strong> {ex.coins_amount} SC</span>}
                  </div>
                  {ex.message && <p style={{fontSize:'0.85rem',color:'var(--text-tertiary)',fontStyle:'italic'}}>"{ex.message}"</p>}
                  {ex.scheduled_at && <p style={{fontSize:'0.8rem',color:'var(--accent-secondary)',marginTop:4}}>📅 {new Date(ex.scheduled_at).toLocaleString()}</p>}
                  <div style={{display:'flex',gap:8,marginTop:'var(--space-md)',flexWrap:'wrap'}}>
                    {ex.status==='pending' && !isReq && <>
                      <button className="btn btn-success btn-sm" disabled={acting===ex.id+'accept'} onClick={()=>setScheduleModal(ex)}>
                        {acting===ex.id+'accept'?<Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>:<><Check size={14}/>Accept</>}
                      </button>
                      <button className="btn btn-danger btn-sm" disabled={acting===ex.id+'cancel'} onClick={()=>handleAction(ex.id,'cancel')}>
                        <X size={14}/>Decline
                      </button>
                    </>}
                    {ex.status==='pending' && isReq && <button className="btn btn-secondary btn-sm" onClick={()=>handleAction(ex.id,'cancel')}><X size={14}/>Cancel</button>}
                    {ex.status==='in_progress' && <>
                      <button className="btn btn-success btn-sm" disabled={acting===ex.id+'complete'} onClick={()=>handleAction(ex.id,'complete')}>
                        <CheckCircle size={14}/>{isReq?ex.requester_confirmed:ex.provider_confirmed?'Confirmed':'Confirm Complete'}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={()=>handleAction(ex.id,'cancel')}><X size={14}/>Cancel</button>
                    </>}
                    {ex.status==='completed' && <button className="btn btn-primary btn-sm" onClick={()=>setReviewModal(ex)}><Star size={14}/>Leave Review</button>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>}
      {scheduleModal && <div className="overlay" onClick={()=>setScheduleModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>Accept & Schedule</h2><button className="modal-close" onClick={()=>setScheduleModal(null)}><X size={18}/></button></div>
        <div className="form-group"><label className="label">Schedule Date & Time</label>
          <input type="datetime-local" className="input" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)}/></div>
        <button className="btn btn-primary w-full" onClick={()=>handleAction(scheduleModal.id,'accept',{scheduledAt:scheduleDate||null})}>
          <Check size={16}/>Accept Exchange
        </button>
      </div></div>}
      {reviewModal && <div className="overlay" onClick={()=>setReviewModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>Leave a Review</h2><button className="modal-close" onClick={()=>setReviewModal(null)}><X size={18}/></button></div>
        <div className="form-group"><label className="label">Rating</label><StarRating rating={review.rating} onChange={r=>setReview({...review,rating:r})}/></div>
        <div className="form-group"><label className="label">Comment</label><textarea className="textarea" value={review.comment} onChange={e=>setReview({...review,comment:e.target.value})} placeholder="How was the experience?"/></div>
        <button className="btn btn-primary w-full" onClick={submitReview}><Star size={16}/>Submit Review</button>
      </div></div>}
    </div>
  );
}
