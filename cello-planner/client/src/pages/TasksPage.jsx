import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Loader2, CalendarDays, GripVertical } from 'lucide-react';
import api from '../lib/api';

const COLUMNS = ['To-Do', 'In-Progress', 'Done'];
const colStyle = {
  'To-Do':       { header: 'bg-cream-200 text-sage-700',      card: 'border-l-4 border-cream-400' },
  'In-Progress': { header: 'bg-gold-100 text-gold-700',       card: 'border-l-4 border-gold-400'  },
  'Done':        { header: 'bg-sage-100 text-sage-700',       card: 'border-l-4 border-sage-400'  },
};

export default function TasksPage() {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('all');

  useEffect(() => {
    async function load() {
      const { data } = await api.get('/events');
      const evts = data.events || [];
      setEvents(evts);
      // Load tasks for all events concurrently
      const taskArrays = await Promise.all(
        evts.map(e => api.get(`/events/${e.id}/tasks`).then(r => r.data.tasks.map(t => ({ ...t, eventTitle: e.title, eventId: e.id }))))
      );
      setTasks(taskArrays.flat());
      setLoading(false);
    }
    load().catch(console.error);
  }, []);

  async function changeStatus(taskId, status) {
    const { data } = await api.put(`/tasks/${taskId}`, { status });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: data.task.status } : t));
  }

  const filtered = selectedEvent === 'all' ? tasks : tasks.filter(t => String(t.eventId) === selectedEvent);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display font-semibold text-sage-800 text-xl">Task Board</h2>
        <select
          className="input-field w-auto text-sm"
          value={selectedEvent}
          onChange={e => setSelectedEvent(e.target.value)}
        >
          <option value="all">All Events</option>
          {events.map(e => <option key={e.id} value={String(e.id)}>{e.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={32} className="animate-spin text-sage-400" />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colTasks = filtered.filter(t => t.status === col);
            const { header, card } = colStyle[col];
            return (
              <div key={col} className="glass-card rounded-2xl overflow-hidden">
                <div className={`px-4 py-3 flex items-center justify-between ${header}`}>
                  <span className="font-semibold text-sm">{col}</span>
                  <span className="text-xs font-bold bg-white/50 rounded-full px-2 py-0.5">{colTasks.length}</span>
                </div>
                <div className="p-3 space-y-2 min-h-[120px]">
                  {colTasks.length === 0 && (
                    <p className="text-sage-300 text-xs text-center py-6">No tasks here</p>
                  )}
                  {colTasks.map(task => (
                    <div key={task.id} className={`bg-white rounded-xl p-3 shadow-sm ${card} group`}>
                      <p className="text-sm text-sage-800 font-medium leading-snug">{task.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Link to={`/events/${task.eventId}`} className="flex items-center gap-1 text-xs text-sage-400 hover:text-sage-600 transition-colors">
                          <CalendarDays size={10} />{task.eventTitle}
                        </Link>
                        <select
                          value={task.status}
                          onChange={e => changeStatus(task.id, e.target.value)}
                          className="text-xs border border-sage-200 rounded-lg px-1.5 py-0.5 bg-white text-sage-700 focus:outline-none"
                        >
                          {COLUMNS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
