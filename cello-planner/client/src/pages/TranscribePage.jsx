import React, { useEffect, useRef, useState } from 'react';
import { Mic, Upload, Loader2, CheckCircle, AlertCircle, CalendarDays, Sparkles, ListTodo } from 'lucide-react';
import api from '../lib/api';

export default function TranscribePage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { transcription, extractedTasks }
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    api.get('/events').then(({ data }) => {
      const evts = data.events || [];
      setEvents(evts);
      if (evts.length > 0) setSelectedEvent(String(evts[0].id));
    });
  }, []);

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || !selectedEvent) { setError('Select an event and audio file.'); return; }
    setLoading(true); setError(''); setResult(null);

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const { data } = await api.post(`/events/${selectedEvent}/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Transcription failed.');
    } finally { setLoading(false); }
  }

  async function addTaskToEvent(taskTitle) {
    if (!selectedEvent) return;
    await api.post(`/events/${selectedEvent}/tasks`, { title: taskTitle });
    alert(`Task "${taskTitle}" added to event!`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-sage-gradient flex items-center justify-center">
            <Mic size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-sage-800 text-xl">AI Audio Transcribe</h2>
            <p className="text-sage-500 text-sm">Upload a meeting recording — Whisper transcribes it, GPT-4o-mini extracts action items.</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
            <AlertCircle size={14} />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Event selector */}
          <div>
            <label className="block text-sm font-semibold text-sage-700 mb-1.5">Link to Event</label>
            <div className="relative">
              <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400 pointer-events-none" />
              <select
                className="input-field pl-10 appearance-none"
                value={selectedEvent}
                onChange={e => setSelectedEvent(e.target.value)}
                disabled={loading}
              >
                {events.length === 0 && <option value="">No events — create one first</option>}
                {events.map(e => <option key={e.id} value={String(e.id)}>{e.title}</option>)}
              </select>
            </div>
          </div>

          {/* Drop zone */}
          <div>
            <label className="block text-sm font-semibold text-sage-700 mb-1.5">Audio File</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                dragOver ? 'border-sage-400 bg-sage-50' : 'border-sage-200 hover:border-sage-300 hover:bg-sage-50/50'
              }`}
            >
              <Upload size={28} className={`mx-auto mb-2 ${dragOver ? 'text-sage-500' : 'text-sage-300'}`} />
              {file ? (
                <p className="text-sage-700 font-medium text-sm">{file.name}</p>
              ) : (
                <>
                  <p className="text-sage-500 text-sm font-medium">Drop audio file here or click to browse</p>
                  <p className="text-sage-400 text-xs mt-1">MP3, WAV, MP4, WebM · Max 25 MB</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={e => setFile(e.target.files[0])} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !file || !selectedEvent}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" />Transcribing…</>
            ) : (
              <><Sparkles size={18} />Transcribe & Extract Tasks</>
            )}
          </button>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className="glass-card rounded-2xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-2 text-sage-700 font-semibold">
            <CheckCircle size={18} className="text-sage-500" /> Transcription Complete
          </div>

          {result.transcription && (
            <div>
              <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-2">Transcript</p>
              <div className="bg-cream-100 border border-cream-300 rounded-xl p-4 text-sm text-sage-700 leading-relaxed max-h-40 overflow-y-auto">
                {result.transcription}
              </div>
            </div>
          )}

          {result.extractedTasks && result.extractedTasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <ListTodo size={12} /> Extracted Action Items
              </p>
              <ul className="space-y-2">
                {result.extractedTasks.map((task, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 bg-white/70 rounded-xl px-4 py-2.5 border border-sage-100">
                    <span className="text-sm text-sage-800">{task}</span>
                    <button
                      onClick={() => addTaskToEvent(task)}
                      className="btn-ghost text-xs py-1 px-2 flex-shrink-0 text-sage-600"
                    >
                      + Add Task
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.message && !result.transcription && (
            <p className="text-sm text-sage-500 bg-cream-100 rounded-xl p-3">{result.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
