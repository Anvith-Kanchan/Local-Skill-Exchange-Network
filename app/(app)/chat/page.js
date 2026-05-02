'use client';
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Search } from 'lucide-react';
import TrustBadge from '@/components/TrustBadge';

export default function ChatPage() {
  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [input, setInput] = useState('');
  const [me, setMe] = useState(null);
  const [search, setSearch] = useState('');
  const messagesEnd = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d=>setMe(d?.user));
    fetch('/api/messages').then(r=>r.json()).then(d=>setConvos(d.conversations||[]));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const load = () => {
      fetch(`/api/messages/${activeId}`).then(r=>r.json()).then(d=>{
        setMessages(d.messages||[]);
        setPartner(d.partner);
      });
    };
    load();
    pollRef.current = setInterval(load, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeId]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMsg = async () => {
    if (!input.trim() || !activeId) return;
    const content = input;
    setInput('');
    try {
      await fetch('/api/messages', { method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ receiverId:activeId, content }) });
      fetch(`/api/messages/${activeId}`).then(r=>r.json()).then(d=>setMessages(d.messages||[]));
    } catch(e) {}
  };

  const filteredConvos = convos.filter(c => !search || c.partner_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container" style={{height:'calc(100vh - 72px)',padding:0,display:'flex'}}>
      {/* Sidebar */}
      <div style={{width:340,borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',background:'var(--bg-secondary)'}}>
        <div style={{padding:'var(--space-lg)',borderBottom:'1px solid var(--border)'}}>
          <h2 style={{fontSize:'1.25rem',marginBottom:'var(--space-md)'}}>Messages</h2>
          <div style={{position:'relative'}}>
            <Search size={16} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-tertiary)'}}/>
            <input className="input" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:34,fontSize:'0.85rem'}}/>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {filteredConvos.length===0 ? <div style={{padding:'var(--space-xl)',textAlign:'center',color:'var(--text-tertiary)',fontSize:'0.85rem'}}>No conversations yet</div>
          : filteredConvos.map(c=>(
            <div key={c.partner_id} onClick={()=>setActiveId(c.partner_id)}
              style={{display:'flex',alignItems:'center',gap:'var(--space-md)',padding:'var(--space-md) var(--space-lg)',cursor:'pointer',
                background:activeId===c.partner_id?'rgba(99,102,241,0.08)':'transparent',borderBottom:'1px solid var(--border)',
                transition:'background 150ms'}}>
              <div className="avatar">{c.partner_name?.[0]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:600,fontSize:'0.9rem'}}>{c.partner_name}</span>
                  {c.unread_count>0 && <span className="badge badge-primary" style={{minWidth:20,justifyContent:'center'}}>{c.unread_count}</span>}
                </div>
                <p style={{fontSize:'0.8rem',color:'var(--text-tertiary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {c.last_sender_id===me?.id?'You: ':''}{c.last_message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        {!activeId ? (
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',color:'var(--text-tertiary)'}}>
            <MessageCircle size={48} style={{opacity:0.3,marginBottom:16}}/>
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            {partner && <div style={{padding:'var(--space-md) var(--space-xl)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'var(--space-md)',background:'var(--bg-secondary)'}}>
              <div className="avatar">{partner.full_name?.[0]}</div>
              <div><span style={{fontWeight:600}}>{partner.full_name}</span>
                <div style={{marginTop:2}}><TrustBadge level={partner.trust_level} size={12}/></div>
              </div>
            </div>}
            {/* Messages */}
            <div style={{flex:1,overflowY:'auto',padding:'var(--space-xl)',display:'flex',flexDirection:'column',gap:'var(--space-sm)'}}>
              {messages.map(msg=>(
                <div key={msg.id} style={{display:'flex',justifyContent:msg.sender_id===me?.id?'flex-end':'flex-start'}}>
                  <div style={{maxWidth:'70%',padding:'0.6rem 1rem',borderRadius:msg.sender_id===me?.id?'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)':'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
                    background:msg.sender_id===me?.id?'var(--accent-primary)':'var(--bg-card)',
                    color:msg.sender_id===me?.id?'#fff':'var(--text-primary)',fontSize:'0.9rem',lineHeight:1.5}}>
                    {msg.content}
                    <div style={{fontSize:'0.65rem',opacity:0.6,marginTop:4,textAlign:'right'}}>{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEnd}/>
            </div>
            {/* Input */}
            <div style={{padding:'var(--space-md) var(--space-xl)',borderTop:'1px solid var(--border)',display:'flex',gap:'var(--space-sm)',background:'var(--bg-secondary)'}}>
              <input className="input" placeholder="Type a message..." value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter')sendMsg()}} style={{flex:1}}/>
              <button className="btn btn-primary" onClick={sendMsg} disabled={!input.trim()}><Send size={16}/></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
