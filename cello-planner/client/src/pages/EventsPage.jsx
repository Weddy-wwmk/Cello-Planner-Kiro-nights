import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays, Plus, Trash2, Pencil, ArrowLeft, CheckSquare,
  Users, Loader2, AlertCircle, X, Save, MapPin, Clock, ChevronRight
} from 'lucide-react';
import api from '../lib/api';

// ─── Shared Modal ───────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sage-900/50 backdrop-blur-sm">
      <div className="glass-card rounded-2xl w-full max-w-md shadow-glass-lg border border-white/60">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sage-100">
          <h3 className="font-display font-semibold text-sage-800 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-sage-100 transition-colors">
            <X size={16} className="text-sage-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Event Form Modal ────────────────────────────────────────
function EventFormModal({ event, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: event?.title || '',
    date: event?.date || '',
    description: event?.description || '',
    location: event?.location || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.date) { setError('Title and date are required.'); return; }
    setLoading(true); setError('');
    try {
      if (event) {
        const { data } = await api.put(`/events/${event.id}`, form);
        onSaved(data.event);
      } else {
        const { data } = await api.post('/events', form);
        onSaved(data.event);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save event.');
    } finally { setLoading(false); }
  }

  return (
    <Modal title={event ? 'Edit Event' : 'New Event'} onClose={onClose}>
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 mb-4 text-sm">
          <AlertCircle size={14} />{error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-sage-700 mb-1">Event Title *</label>
          <input className="input-field" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Annual Gala 2026" required disabled={loading} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-sage-700 mb-1">Date *</label>
          <input type="date" className="input-field" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} required disabled={loading} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-sage-700 mb-1">Location</label>
          <input className="input-field" value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="Grand Ballroom, NYC" disabled={loading} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-sage-700 mb-1">Description</label>
          <textarea rows={3} className="input-field resize-none" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Event notes…" disabled={loading} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {event ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Events List ─────────────────────────────────────────────
function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/events').then(({ data }) => setEvents(data.events || [])).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this event and all its data?')) return;
    await api.delete(`/events/${id}`);
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  function handleSaved(saved) {
    setEvents(prev => {
      const idx = prev.findIndex(e => e.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = {...next[idx], ...saved}; return next; }
      return [saved, ...prev];
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-sage-800 text-xl">All Events</h2>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setEditTarget(null); setShowForm(true); }}>
          <Plus size={16} /> New Event
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(n => <div key={n} className="h-40 glass-card rounded-2xl animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <CalendarDays size={48} className="text-sage-200 mx-auto mb-4" />
          <p className="text-sage-500 font-medium">No events yet.</p>
          <button className="btn-primary mt-4 inline-flex items-center gap-2" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Create your first event
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(evt => (
            <div key={evt.id} className="glass-card rounded-2xl p-5 hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-0.5 group flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-sage-gradient flex items-center justify-center shadow-sm">
                  <CalendarDays size={18} className="text-white" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditTarget(evt); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-sage-100 transition-colors"><Pencil size={14} className="text-sage-500" /></button>
                  <button onClick={() => handleDelete(evt.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={14} className="text-red-400" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-sage-800 text-base mb-1 line-clamp-2">{evt.title}</h3>
              <div className="flex items-center gap-1 text-xs text-sage-500 mb-1">
                <Clock size={11} />
                {new Date(evt.date + 'T00:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' })}
              </div>
              {evt.location && (
                <div className="flex items-center gap-1 text-xs text-sage-500 mb-3">
                  <MapPin size={11} />{evt.location}
                </div>
              )}
              <div className="flex items-center gap-3 mt-auto pt-3 border-t border-sage-100 text-xs text-sage-500">
                <span className="flex items-center gap-1"><CheckSquare size={11} />{evt.task_count ?? 0} tasks</span>
                <span className="flex items-center gap-1"><Users size={11} />{evt.attendee_count ?? 0} attendees</span>
              </div>
              <button onClick={() => navigate(`/events/${evt.id}`)} className="mt-3 w-full text-xs text-sage-600 hover:text-sage-800 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-sage-50 transition-colors font-medium">
                Open <ChevronRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <EventFormModal
          event={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ─── Event Detail ─────────────────────────────────────────────
function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [newAttendee, setNewAttendee] = useState({ name: '', email: '' });
  const [taskLoading, setTaskLoading] = useState(false);
  const [attendeeLoading, setAttendeeLoading] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`).then(({ data: d }) => setData(d)).finally(() => setLoading(false));
  }, [id]);

  async function addTask(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTaskLoading(true);
    const { data: d } = await api.post(`/events/${id}/tasks`, { title: newTask });
    setData(prev => ({ ...prev, tasks: [...prev.tasks, d.task] }));
    setNewTask('');
    setTaskLoading(false);
  }

  async function updateTaskStatus(taskId, status) {
    const { data: d } = await api.put(`/tasks/${taskId}`, { status });
    setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? d.task : t) }));
  }

  async function deleteTask(taskId) {
    await api.delete(`/tasks/${taskId}`);
    setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
  }

  async function addAttendee(e) {
    e.preventDefault();
    if (!newAttendee.name.trim()) return;
    setAttendeeLoading(true);
    const { data: d } = await api.post(`/events/${id}/attendees`, newAttendee);
    setData(prev => ({ ...prev, attendees: [...prev.attendees, d.attendee] }));
    setNewAttendee({ name: '', email: '' });
    setAttendeeLoading(false);
  }

  async function deleteAttendee(aId) {
    await api.delete(`/attendees/${aId}`);
    setData(prev => ({ ...prev, attendees: prev.attendees.filter(a => a.id !== aId) }));
  }

  async function checkIn(aId) {
    const { data: d } = await api.patch(`/attendees/${aId}/check-in`);
    setData(prev => ({ ...prev, attendees: prev.attendees.map(a => a.id === aId ? d.attendee : a) }));
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-sage-400" /></div>;
  if (!data) return <div className="text-center text-sage-500 p-8">Event not found.</div>;

  const { event, tasks, attendees } = data;
  const statusColors = { 'To-Do': 'badge-todo', 'In-Progress': 'badge-inprogress', 'Done': 'badge-done' };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/events')} className="p-2 rounded-xl hover:bg-sage-100 transition-colors">
          <ArrowLeft size={18} className="text-sage-600" />
        </button>
        <div>
          <h2 className="font-display font-bold text-sage-800 text-2xl">{event.title}</h2>
          <p className="text-sage-500 text-sm flex items-center gap-1 mt-0.5">
            <Clock size={12} />
            {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
            {event.location && <><MapPin size={12} className="ml-2" />{event.location}</>}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display font-semibold text-sage-800 mb-4 flex items-center gap-2">
            <CheckSquare size={18} className="text-sage-500" /> Tasks ({tasks.length})
          </h3>
          <form onSubmit={addTask} className="flex gap-2 mb-4">
            <input className="input-field flex-1" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add a task…" disabled={taskLoading} />
            <button type="submit" disabled={taskLoading} className="btn-primary px-3">
              {taskLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            </button>
          </form>
          <ul className="space-y-2">
            {tasks.map(task => (
              <li key={task.id} className="flex items-center gap-2 p-3 rounded-xl bg-cream-100/60 border border-cream-200/40 group">
                <select
                  value={task.status}
                  onChange={e => updateTaskStatus(task.id, e.target.value)}
                  className="text-xs border border-sage-200 rounded-lg px-2 py-1 bg-white text-sage-700 focus:outline-none focus:ring-1 focus:ring-sage-400"
                >
                  <option>To-Do</option>
                  <option>In-Progress</option>
                  <option>Done</option>
                </select>
                <span className={`flex-1 text-sm text-sage-800 ${task.status === 'Done' ? 'line-through text-sage-400' : ''}`}>{task.title}</span>
                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all">
                  <Trash2 size={13} className="text-red-400" />
                </button>
              </li>
            ))}
            {tasks.length === 0 && <p className="text-sage-400 text-sm text-center py-4">No tasks yet.</p>}
          </ul>
        </div>

        {/* Attendees */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display font-semibold text-sage-800 mb-4 flex items-center gap-2">
            <Users size={18} className="text-sage-500" /> Attendees ({attendees.length})
          </h3>
          <form onSubmit={addAttendee} className="space-y-2 mb-4">
            <div className="flex gap-2">
              <input className="input-field flex-1" value={newAttendee.name} onChange={e => setNewAttendee(p => ({...p, name: e.target.value}))} placeholder="Full name *" disabled={attendeeLoading} />
              <input className="input-field flex-1" value={newAttendee.email} onChange={e => setNewAttendee(p => ({...p, email: e.target.value}))} placeholder="Email (opt.)" disabled={attendeeLoading} />
              <button type="submit" disabled={attendeeLoading} className="btn-primary px-3">
                {attendeeLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              </button>
            </div>
          </form>
          <ul className="space-y-2">
            {attendees.map(a => (
              <li key={a.id} className="flex items-center gap-2 p-3 rounded-xl bg-cream-100/60 border border-cream-200/40 group">
                <div className="w-7 h-7 rounded-full bg-sage-gradient flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{a.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sage-800 truncate">{a.name}</p>
                  {a.email && <p className="text-xs text-sage-400 truncate">{a.email}</p>}
                </div>
                {a.has_attended ? (
                  <span className="badge-done text-xs">Checked In</span>
                ) : (
                  <button onClick={() => checkIn(a.id)} className="text-xs btn-ghost py-1 px-2">Check In</button>
                )}
                <button onClick={() => deleteAttendee(a.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all">
                  <Trash2 size={13} className="text-red-400" />
                </button>
              </li>
            ))}
            {attendees.length === 0 && <p className="text-sage-400 text-sm text-center py-4">No attendees yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Routes>
      <Route index element={<EventsList />} />
      <Route path=":id" element={<EventDetail />} />
    </Routes>
  );
}
