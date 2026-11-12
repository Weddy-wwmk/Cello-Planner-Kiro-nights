import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckSquare,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sage-500 text-sm font-medium">{label}</p>
        {loading ? (
          <div className="h-7 w-12 bg-sage-100 rounded-lg animate-pulse mt-0.5" />
        ) : (
          <p className="text-sage-900 text-2xl font-bold font-display">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/events')
      .then(({ data }) => setEvents(data.events || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalTasks = events.reduce((s, e) => s + (e.task_count || 0), 0);
  const totalAttendees = events.reduce((s, e) => s + (e.attendee_count || 0), 0);

  // Upcoming events (today or future), sorted ascending
  const today = new Date().toISOString().split('T')[0];
  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-sage-gradient p-6 md:p-8 shadow-glass-lg">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gold-400/20 blur-xl" />
        </div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sage-300 text-sm font-medium mb-1">Good morning 👋</p>
            <h2 className="font-display font-bold text-white text-2xl md:text-3xl">
              {user?.name ?? 'Planner'}
            </h2>
            <p className="text-sage-200 mt-1.5 text-sm max-w-sm">
              You have{' '}
              <span className="text-gold-300 font-semibold">{upcoming.length} upcoming</span>{' '}
              event{upcoming.length !== 1 ? 's' : ''} on your calendar.
            </p>
          </div>
          <Link
            to="/events"
            className="btn-gold flex items-center gap-2 self-start"
          >
            <Plus size={16} />
            New Event
          </Link>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarDays} label="Total Events"    value={events.length}   color="bg-sage-500"     loading={loading} />
        <StatCard icon={CheckSquare}  label="Total Tasks"     value={totalTasks}       color="bg-gold-500"     loading={loading} />
        <StatCard icon={Users}        label="Total Attendees" value={totalAttendees}   color="bg-sage-400"     loading={loading} />
        <StatCard icon={TrendingUp}   label="Upcoming"        value={upcoming.length}  color="bg-sage-600"     loading={loading} />
      </div>

      {/* ── Upcoming Events List ── */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-sage-800 text-lg flex items-center gap-2">
            <CalendarDays size={20} className="text-sage-500" />
            Upcoming Events
          </h3>
          <Link to="/events" className="btn-ghost text-sm flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-sage-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-10">
            <Sparkles size={36} className="text-sage-200 mx-auto mb-3" />
            <p className="text-sage-500 font-medium">No upcoming events yet.</p>
            <Link to="/events" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
              <Plus size={15} /> Create your first event
            </Link>
          </div>
        ) : (
          <ul className="space-y-3" role="list">
            {upcoming.map((evt) => (
              <li key={evt.id}>
                <Link
                  to={`/events/${evt.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-cream-100/60 hover:bg-cream-200/60 border border-cream-300/40 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sage-gradient flex items-center justify-center shadow-sm flex-shrink-0">
                      <CalendarDays size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sage-800 group-hover:text-sage-900 text-sm">
                        {evt.title}
                      </p>
                      <p className="text-sage-500 text-xs flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        {new Date(evt.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-sage-500">
                    <span className="hidden sm:flex items-center gap-1">
                      <CheckSquare size={12} /> {evt.task_count ?? 0}
                    </span>
                    <span className="hidden sm:flex items-center gap-1">
                      <Users size={12} /> {evt.attendee_count ?? 0}
                    </span>
                    <ArrowRight size={14} className="text-sage-400 group-hover:text-sage-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
