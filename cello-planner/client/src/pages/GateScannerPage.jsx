import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Users, CheckCircle, AlertCircle, CalendarDays, Download, Loader2 } from 'lucide-react';
import api from '../lib/api';

// QR payload format: "cello:attendee:<id>"
const QR_PREFIX = 'cello:attendee:';

function QRGenerator({ events }) {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [selectedAttendee, setSelectedAttendee] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadAttendees(eventId) {
    if (!eventId) { setAttendees([]); setSelectedAttendee(''); return; }
    setLoading(true);
    const { data } = await api.get(`/events/${eventId}/attendees`);
    setAttendees(data.attendees || []);
    if (data.attendees?.length > 0) setSelectedAttendee(String(data.attendees[0].id));
    setLoading(false);
  }

  function downloadQR() {
    const svg = document.getElementById('attendee-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'attendee-qr.svg'; a.click();
    URL.revokeObjectURL(url);
  }

  const attendee = attendees.find(a => String(a.id) === selectedAttendee);
  const qrValue = attendee ? `${QR_PREFIX}${attendee.id}` : '';

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <h3 className="font-display font-semibold text-sage-800 flex items-center gap-2">
        <QrCode size={18} className="text-sage-500" /> Generate Attendee QR
      </h3>

      <div>
        <label className="block text-sm font-semibold text-sage-700 mb-1.5">Event</label>
        <select
          className="input-field"
          value={selectedEvent}
          onChange={e => { setSelectedEvent(e.target.value); loadAttendees(e.target.value); }}
        >
          <option value="">— Select event —</option>
          {events.map(e => <option key={e.id} value={String(e.id)}>{e.title}</option>)}
        </select>
      </div>

      {loading && <div className="flex justify-center"><Loader2 size={24} className="animate-spin text-sage-400" /></div>}

      {!loading && attendees.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-sage-700 mb-1.5">Attendee</label>
          <select className="input-field" value={selectedAttendee} onChange={e => setSelectedAttendee(e.target.value)}>
            {attendees.map(a => <option key={a.id} value={String(a.id)}>{a.name}{a.email ? ` (${a.email})` : ''}</option>)}
          </select>
        </div>
      )}

      {qrValue && (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-inner border border-sage-100">
            <QRCode id="attendee-qr" value={qrValue} size={180} bgColor="#ffffff" fgColor="#2f4f38" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sage-800">{attendee?.name}</p>
            <p className="text-xs text-sage-400 font-mono mt-0.5">{qrValue}</p>
          </div>
          <button onClick={downloadQR} className="btn-outline flex items-center gap-2 text-sm">
            <Download size={14} /> Download QR
          </button>
        </div>
      )}

      {!loading && selectedEvent && attendees.length === 0 && (
        <p className="text-center text-sage-400 text-sm py-4">No attendees in this event.</p>
      )}
    </div>
  );
}

function QRScanner({ onCheckIn }) {
  const scannerRef = useRef(null);
  const divId = 'qr-reader';
  const [scanResult, setScanResult] = useState(null); // { type: 'success'|'error', message }
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(divId, { fps: 10, qrbox: 250 }, false);

    scanner.render(
      async (decodedText) => {
        if (checking) return;
        if (!decodedText.startsWith(QR_PREFIX)) {
          setScanResult({ type: 'error', message: 'Not a valid Cello Planner QR code.' });
          return;
        }
        const id = decodedText.replace(QR_PREFIX, '');
        setChecking(true);
        try {
          const { data } = await api.patch(`/attendees/${id}/check-in`);
          setScanResult({ type: 'success', message: `✅ ${data.attendee.name} checked in!` });
          onCheckIn(data.attendee);
        } catch {
          setScanResult({ type: 'error', message: 'Check-in failed. Attendee not found or already scanned.' });
        } finally {
          setChecking(false);
        }
      },
      () => {} // error handler — ignore
    );

    scannerRef.current = scanner;
    return () => { scanner.clear().catch(() => {}); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <h3 className="font-display font-semibold text-sage-800 flex items-center gap-2">
        <QrCode size={18} className="text-sage-500" /> Live Gate Scanner
      </h3>

      {scanResult && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
          scanResult.type === 'success'
            ? 'bg-sage-50 border border-sage-200 text-sage-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {scanResult.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {scanResult.message}
        </div>
      )}

      <div id={divId} className="overflow-hidden rounded-xl" />

      <p className="text-xs text-sage-400 text-center">
        Point camera at an attendee's QR code to check them in instantly.
      </p>
    </div>
  );
}

export default function GateScannerPage() {
  const [events, setEvents] = useState([]);
  const [recentCheckIns, setRecentCheckIns] = useState([]);

  useEffect(() => {
    api.get('/events').then(({ data }) => setEvents(data.events || []));
  }, []);

  function handleCheckIn(attendee) {
    setRecentCheckIns(prev => [{ ...attendee, checkedAt: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <QRGenerator events={events} />
        <QRScanner onCheckIn={handleCheckIn} />
      </div>

      {recentCheckIns.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-sage-800 mb-4 flex items-center gap-2">
            <Users size={18} className="text-sage-500" /> Recent Check-ins
          </h3>
          <ul className="space-y-2">
            {recentCheckIns.map((a, i) => (
              <li key={i} className="flex items-center gap-3 py-2 border-b border-sage-50 last:border-0">
                <CheckCircle size={16} className="text-sage-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sage-800 text-sm">{a.name}</span>
                  {a.email && <span className="text-sage-400 text-xs ml-2">{a.email}</span>}
                </div>
                <span className="text-xs text-sage-400">{a.checkedAt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
