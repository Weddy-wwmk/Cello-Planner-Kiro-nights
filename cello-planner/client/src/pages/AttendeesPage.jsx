import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Loader2, CheckCircle, XCircle, CalendarDays, Search } from 'lucide-react';
import api from '../lib/api';

export default function AttendeesPage() {
  const [events, setEvents] = useState([]);
  const [allAttendees, setAllAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | checked | pending

  useEffect(() => {
    async function load() {
      const { data } = await api.get('/events');
      const evts = data.events || [];
      setEvents(evts);
      const arrays = await Promise.all(
        evts.map(e =>
          api.get(`/events/${e.id}/attendees`).then(r =>
            r.data.attendees.map(a => ({ ...a, eventTitle: e.title, eventId: e.id }))
          )
        )
      );
      setAllAttendees(arrays.flat());
      setLoading(false);
    }
    load().catch(console.error);
  }, []);

  async function checkIn(id) {
    const { data } = await api.patch(`/attendees/${id}/check-in`);
    setAllAttendees(prev => prev.map(a => a.id === id ? { ...a, has_attended: data.attendee.has_attended } : a));
  }

  const filtered = allAttendees
    .filter(a => {
      if (filter === 'checked') return a.has_attended;
      if (filter === 'pending') return !a.has_attended;
      return true;
    })
    .filter(a => {
      const q = search.toLowerCase();
      return a.name.toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q) || a.eventTitle.toLowerCase().includes(q);
    });

  const checkedCount = allAttendees.filter(a => a.has_attended).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display font-semibold text-sage-800 text-xl">All Attendees</h2>
        <div className="flex items-center gap-2 text-sm text-sage-600">
          <CheckCircle size={16} className="text-sage-500" />
          <span>{checkedCount} / {allAttendees.length} checked in</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" />
          <input className="input-field pl-9 text-sm" placeholder="Search name, email, event…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex rounded-xl border border-sage-200 overflow-hidden bg-white/70">
          {['all','checked','pending'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-sage-500 text-white' : 'text-sage-600 hover:bg-sage-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 size={32} className="animate-spin text-sage-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Users size={40} className="text-sage-200 mx-auto mb-3" />
          <p className="text-sage-500">No attendees found.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sage-100 bg-sage-50/50">
                <th className="text-left px-4 py-3 text-sage-600 font-semibold">Name</th>
                <th className="text-left px-4 py-3 text-sage-600 font-semibold hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-sage-600 font-semibold hidden md:table-cell">Event</th>
                <th className="text-left px-4 py-3 text-sage-600 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.id} className={`border-b border-sage-50 transition-colors hover:bg-cream-100/40 ${i % 2 === 0 ? '' : 'bg-white/30'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-sage-gradient flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{a.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-sage-800">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sage-500 hidden sm:table-cell">{a.email || '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Link to={`/events/${a.eventId}`} className="flex items-center gap-1 text-sage-500 hover:text-sage-700 transition-colors">
                      <CalendarDays size={12} />{a.eventTitle}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {a.has_attended ? (
                      <span className="badge-done flex items-center gap-1 w-fit">
                        <CheckCircle size={11} /> Checked In
                      </span>
                    ) : (
                      <button onClick={() => checkIn(a.id)} className="badge-todo flex items-center gap-1 w-fit hover:bg-sage-200 transition-colors cursor-pointer">
                        <XCircle size={11} /> Check In
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
