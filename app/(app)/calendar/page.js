'use client';
import { useState, useEffect } from 'react';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calendar').then(r=>r.json()).then(d=>{setEvents(d.events||[]);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const getEventsForDay = (day) => {
    return events.filter(e => {
      const d = new Date(e.start_time);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const prev = () => setDate(new Date(year, month - 1, 1));
  const next = () => setDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const STATUS_COLORS = { scheduled: 'var(--accent-primary)', completed: 'var(--success)', cancelled: 'var(--text-tertiary)' };

  return (
    <div className="page-container">
      <div className="page-header animate-fadeIn"><h1>Calendar</h1><p>Your scheduled skill exchange sessions</p></div>
      <div className="glass-card animate-fadeIn" style={{ padding: 'var(--space-xl)' }}>
        {/* Month Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
          <button className="btn btn-ghost btn-icon" onClick={prev}><ChevronLeft size={20} /></button>
          <h2 style={{ fontSize: '1.3rem' }}>{date.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <button className="btn btn-ghost btn-icon" onClick={next}><ChevronRight size={20} /></button>
        </div>
        {/* Day Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, padding: '8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>
          ))}
        </div>
        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {days.map((day, i) => {
            if (!day) return <div key={i} />;
            const dayEvents = getEventsForDay(day);
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            return (
              <div key={i} style={{ minHeight: 80, padding: 6, borderRadius: 'var(--radius-md)',
                background: isToday ? 'rgba(99,102,241,0.08)' : 'transparent',
                border: isToday ? '1px solid var(--accent-primary)' : '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--accent-primary-hover)' : 'var(--text-secondary)' }}>{day}</span>
                {dayEvents.map(ev => (
                  <div key={ev.id} title={`${ev.title} - ${ev.partner_name}`}
                    style={{ marginTop: 4, padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 500,
                      background: `${STATUS_COLORS[ev.status]}20`, color: STATUS_COLORS[ev.status],
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default' }}>
                    {ev.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      {/* Upcoming List */}
      <div className="glass-card animate-fadeIn" style={{ padding: 'var(--space-xl)', marginTop: 'var(--space-lg)' }}>
        <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={18} />Upcoming Sessions</h3>
        {events.filter(e => e.status === 'scheduled' && new Date(e.start_time) > new Date()).length === 0
          ? <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>No upcoming sessions</p>
          : events.filter(e => e.status === 'scheduled' && new Date(e.start_time) > new Date()).slice(0, 5).map(ev => (
            <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 48, height: 48, background: 'rgba(99,102,241,0.1)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-primary-hover)', lineHeight: 1 }}>{new Date(ev.start_time).getDate()}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{new Date(ev.start_time).toLocaleString('default', { month: 'short' })}</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{ev.title}</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  {new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(ev.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {ev.partner_name && ` • with ${ev.partner_name}`}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
