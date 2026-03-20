import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import AppNav from '../components/AppNav';
import AppFooter from '../components/AppFooter';
import { useTheme } from '../context/ThemeContext';

/* ── Constants ──────────────────────────────────────────────── */

const STORAGE_KEY = 'time-converter-state';
const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const POPULAR_ZONES = [
  { id: 'UTC',                    city: 'UTC',               region: 'Universal' },
  { id: 'America/New_York',       city: 'New York',          region: 'US Eastern' },
  { id: 'America/Chicago',        city: 'Chicago',           region: 'US Central' },
  { id: 'America/Denver',         city: 'Denver',            region: 'US Mountain' },
  { id: 'America/Los_Angeles',    city: 'Los Angeles',       region: 'US Pacific' },
  { id: 'America/Anchorage',      city: 'Anchorage',         region: 'US Alaska' },
  { id: 'Pacific/Honolulu',       city: 'Honolulu',          region: 'Hawaii' },
  { id: 'America/Toronto',        city: 'Toronto',           region: 'Canada Eastern' },
  { id: 'America/Vancouver',      city: 'Vancouver',         region: 'Canada Pacific' },
  { id: 'America/Sao_Paulo',      city: 'São Paulo',         region: 'Brazil' },
  { id: 'America/Buenos_Aires',   city: 'Buenos Aires',      region: 'Argentina' },
  { id: 'America/Mexico_City',    city: 'Mexico City',       region: 'Mexico' },
  { id: 'Europe/London',          city: 'London',            region: 'UK' },
  { id: 'Europe/Dublin',          city: 'Dublin',            region: 'Ireland' },
  { id: 'Europe/Lisbon',          city: 'Lisbon',            region: 'Portugal' },
  { id: 'Europe/Paris',           city: 'Paris',             region: 'France' },
  { id: 'Europe/Berlin',          city: 'Berlin',            region: 'Germany' },
  { id: 'Europe/Madrid',          city: 'Madrid',            region: 'Spain' },
  { id: 'Europe/Rome',            city: 'Rome',              region: 'Italy' },
  { id: 'Europe/Amsterdam',       city: 'Amsterdam',         region: 'Netherlands' },
  { id: 'Europe/Stockholm',       city: 'Stockholm',         region: 'Sweden' },
  { id: 'Europe/Warsaw',          city: 'Warsaw',            region: 'Poland' },
  { id: 'Europe/Athens',          city: 'Athens',            region: 'Greece' },
  { id: 'Europe/Istanbul',        city: 'Istanbul',          region: 'Turkey' },
  { id: 'Europe/Moscow',          city: 'Moscow',            region: 'Russia' },
  { id: 'Africa/Cairo',           city: 'Cairo',             region: 'Egypt' },
  { id: 'Africa/Lagos',           city: 'Lagos',             region: 'Nigeria' },
  { id: 'Africa/Nairobi',         city: 'Nairobi',           region: 'Kenya' },
  { id: 'Africa/Johannesburg',    city: 'Johannesburg',      region: 'South Africa' },
  { id: 'Asia/Dubai',             city: 'Dubai',             region: 'UAE' },
  { id: 'Asia/Riyadh',            city: 'Riyadh',            region: 'Saudi Arabia' },
  { id: 'Asia/Karachi',           city: 'Karachi',           region: 'Pakistan' },
  { id: 'Asia/Kolkata',           city: 'Mumbai / Kolkata',  region: 'India' },
  { id: 'Asia/Dhaka',             city: 'Dhaka',             region: 'Bangladesh' },
  { id: 'Asia/Bangkok',           city: 'Bangkok',           region: 'Thailand' },
  { id: 'Asia/Singapore',         city: 'Singapore',         region: 'Singapore' },
  { id: 'Asia/Kuala_Lumpur',      city: 'Kuala Lumpur',      region: 'Malaysia' },
  { id: 'Asia/Jakarta',           city: 'Jakarta',           region: 'Indonesia' },
  { id: 'Asia/Hong_Kong',         city: 'Hong Kong',         region: 'Hong Kong' },
  { id: 'Asia/Shanghai',          city: 'Shanghai / Beijing', region: 'China' },
  { id: 'Asia/Seoul',             city: 'Seoul',             region: 'South Korea' },
  { id: 'Asia/Tokyo',             city: 'Tokyo',             region: 'Japan' },
  { id: 'Australia/Perth',        city: 'Perth',             region: 'Australia West' },
  { id: 'Australia/Adelaide',     city: 'Adelaide',          region: 'Australia Central' },
  { id: 'Australia/Sydney',       city: 'Sydney',            region: 'Australia East' },
  { id: 'Pacific/Auckland',       city: 'Auckland',          region: 'New Zealand' },
  { id: 'Pacific/Fiji',           city: 'Fiji',              region: 'Pacific' },
];

const ALL_ZONE_IDS = (() => {
  try { return Intl.supportedValuesOf('timeZone'); } catch { return POPULAR_ZONES.map(z => z.id); }
})();

const DEFAULT_TARGETS = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo']
  .filter(z => z !== LOCAL_TZ);

/* ── Persistence ────────────────────────────────────────────── */

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); } catch { return null; }
}

/* ── Time utilities ─────────────────────────────────────────── */

function getZoneInfo(tzId) {
  const p = POPULAR_ZONES.find(z => z.id === tzId);
  if (p) return p;
  const parts = tzId.split('/');
  const city = (parts[parts.length - 1] || tzId).replace(/_/g, ' ');
  return { id: tzId, city, region: parts[0] ?? '' };
}

// Format date parts in a timezone using en-CA (gives YYYY-MM-DD for date)
function tzParts(date, tz) {
  if (!date || isNaN(date.getTime())) return {};
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  return Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]));
}

// Convert wall-clock time in a timezone to a UTC Date
function zonedToUTC(dateStr, timeStr, tz) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));

  function displayAsUTC(d) {
    const p = tzParts(d, tz);
    const h = parseInt(p.hour);
    return new Date(Date.UTC(parseInt(p.year), parseInt(p.month) - 1, parseInt(p.day), h === 24 ? 0 : h, parseInt(p.minute)));
  }

  // Two-pass correction handles DST edge cases
  const diff1 = guess.getTime() - displayAsUTC(guess).getTime();
  const pass1 = new Date(guess.getTime() + diff1);
  const diff2 = guess.getTime() - displayAsUTC(pass1).getTime();
  return new Date(pass1.getTime() + diff2);
}

// Get current date/time strings in a timezone
function getNowStrings(tz) {
  const now = new Date();
  const p = tzParts(now, tz);
  const h = p.hour === '24' ? '00' : p.hour;
  return { dateStr: `${p.year}-${p.month}-${p.day}`, timeStr: `${h}:${p.minute}` };
}

// Get UTC offset string like "UTC+5:30"
function getOffsetStr(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(date);
  return parts.find(p => p.type === 'timeZoneName')?.value ?? tz;
}

// Get long timezone name like "India Standard Time"
function getLongName(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'long' }).formatToParts(date);
  return parts.find(p => p.type === 'timeZoneName')?.value ?? '';
}

// Format time display
function fmtTime(date, tz, hour12) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12 }).format(date);
}

// Format date display
function fmtDate(date, tz) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}

// Day difference between target zone and source zone
function dayDiff(utcDate, targetTz, sourceTz) {
  const fmt = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const src = new Intl.DateTimeFormat('en-CA', { ...fmt, timeZone: sourceTz }).format(utcDate);
  const tgt = new Intl.DateTimeFormat('en-CA', { ...fmt, timeZone: targetTz }).format(utcDate);
  const diff = Math.round((new Date(tgt) - new Date(src)) / 86400000);
  return diff !== 0 ? (diff > 0 ? `+${diff}d` : `${diff}d`) : null;
}

/* ── Zone Search Dropdown ───────────────────────────────────── */

function ZoneDropdown({ value, onChange, darkMode, label }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const info = getZoneInfo(value);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return POPULAR_ZONES;
    const popular = POPULAR_ZONES.filter(z =>
      z.city.toLowerCase().includes(q) || z.region.toLowerCase().includes(q) || z.id.toLowerCase().includes(q)
    );
    const extra = ALL_ZONE_IDS
      .filter(id => !POPULAR_ZONES.find(p => p.id === id) && id.toLowerCase().replace(/_/g, ' ').includes(q))
      .slice(0, 15)
      .map(id => getZoneInfo(id));
    return [...popular, ...extra];
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function openDropdown() {
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  return (
    <div ref={containerRef} className="relative">
      {label && <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{label}</div>}
      <button
        onClick={openDropdown}
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl border text-left transition-colors ${
          darkMode ? 'bg-zinc-700 border-zinc-600 hover:bg-zinc-600' : 'bg-white border-slate-300 hover:bg-slate-50'
        }`}
      >
        <svg className={`w-4 h-4 shrink-0 ${darkMode ? 'text-zinc-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 3a15 15 0 010 18M3 12h18M3.6 8h16.8M3.6 16h16.8" />
        </svg>
        <span className={`flex-1 min-w-0 text-sm font-medium truncate ${darkMode ? 'text-zinc-100' : 'text-slate-800'}`}>{info.city}</span>
        {info.region && <span className={`text-xs shrink-0 hidden sm:block ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{info.region}</span>}
        <svg className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className={`absolute top-full left-0 mt-1.5 w-72 rounded-xl border shadow-xl z-40 overflow-hidden ${
          darkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-slate-200'
        }`}>
          <div className={`p-2 border-b ${darkMode ? 'border-zinc-700' : 'border-slate-100'}`}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search city or timezone…"
              className={`w-full px-3 py-1.5 rounded-lg text-xs outline-none ${
                darkMode ? 'bg-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-slate-100 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>
          {!query && <div className={`px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>Popular</div>}
          <div className="overflow-y-auto max-h-60">
            {results.map(zone => (
              <button
                key={zone.id}
                onClick={() => { onChange(zone.id); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                  value === zone.id
                    ? darkMode ? 'bg-sky-900/40 text-sky-300' : 'bg-sky-50 text-sky-700'
                    : darkMode ? 'text-zinc-200 hover:bg-zinc-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{zone.city}</div>
                  <div className={`text-[10px] truncate ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{zone.id}</div>
                </div>
                {zone.region && (
                  <span className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-zinc-700 text-zinc-500' : 'bg-slate-100 text-slate-400'}`}>
                    {zone.region}
                  </span>
                )}
              </button>
            ))}
            {results.length === 0 && (
              <div className={`px-3 py-4 text-xs text-center ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>No timezones found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Target Zone Card ───────────────────────────────────────── */

function ZoneCard({ tzId, utcDate, sourceZone, hour12, onRemove, onSetSource, darkMode }) {
  const info = getZoneInfo(tzId);
  const time = fmtTime(utcDate, tzId, hour12);
  const date = fmtDate(utcDate, tzId);
  const offset = getOffsetStr(utcDate, tzId);
  const longName = getLongName(utcDate, tzId);
  const diff = dayDiff(utcDate, tzId, sourceZone);

  return (
    <div className={`group relative flex flex-col rounded-xl border p-4 transition-all ${
      darkMode ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-500' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
    }`}>
      {/* Header: city + remove */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className={`text-xs font-semibold truncate ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{info.city}</div>
          <div className={`text-[10px] truncate mt-0.5 ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>{longName || info.id}</div>
        </div>
        <button
          onClick={onRemove}
          className={`opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-lg transition-all ${
            darkMode ? 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Time — big */}
      <div
        className={`text-[2rem] font-bold leading-none tracking-tight cursor-pointer select-none transition-colors ${
          darkMode ? 'text-zinc-100 hover:text-sky-400' : 'text-slate-900 hover:text-sky-600'
        }`}
        title="Click to use as source"
        onClick={onSetSource}
      >
        {time}
      </div>

      {/* Date + day diff */}
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{date}</span>
        {diff && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            diff.startsWith('+')
              ? darkMode ? 'bg-amber-950/50 text-amber-400' : 'bg-amber-50 text-amber-600'
              : darkMode ? 'bg-violet-950/50 text-violet-400' : 'bg-violet-50 text-violet-600'
          }`}>{diff}</span>
        )}
      </div>

      {/* Offset badge */}
      <div className="mt-3">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          darkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-100 text-slate-500'
        }`}>{offset}</span>
      </div>
    </div>
  );
}

/* ── Add Zone Button ────────────────────────────────────────── */

function AddZonePanel({ existingZones, onAdd, darkMode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const base = q
      ? POPULAR_ZONES.filter(z =>
          z.city.toLowerCase().includes(q) || z.region.toLowerCase().includes(q) || z.id.toLowerCase().includes(q)
        )
      : POPULAR_ZONES;
    const extra = q
      ? ALL_ZONE_IDS.filter(id => !POPULAR_ZONES.find(p => p.id === id) && id.toLowerCase().replace(/_/g, ' ').includes(q)).slice(0, 15).map(id => getZoneInfo(id))
      : [];
    return [...base, ...extra].filter(z => !existingZones.includes(z.id));
  }, [query, existingZones]);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function openPanel() {
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={openPanel}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors w-full justify-center ${
          darkMode
            ? 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
            : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add timezone
      </button>

      {open && (
        <div className={`absolute bottom-full left-0 mb-1.5 w-72 rounded-xl border shadow-xl z-40 overflow-hidden ${
          darkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-slate-200'
        }`}>
          <div className={`p-2 border-b ${darkMode ? 'border-zinc-700' : 'border-slate-100'}`}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search city or timezone…"
              className={`w-full px-3 py-1.5 rounded-lg text-xs outline-none ${
                darkMode ? 'bg-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-slate-100 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>
          {!query && <div className={`px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>Popular</div>}
          <div className="overflow-y-auto max-h-64">
            {results.map(zone => (
              <button
                key={zone.id}
                onClick={() => { onAdd(zone.id); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                  darkMode ? 'text-zinc-200 hover:bg-zinc-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{zone.city}</div>
                  <div className={`text-[10px] truncate ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{zone.id}</div>
                </div>
                {zone.region && (
                  <span className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-zinc-700 text-zinc-500' : 'bg-slate-100 text-slate-400'}`}>
                    {zone.region}
                  </span>
                )}
              </button>
            ))}
            {results.length === 0 && (
              <div className={`px-3 py-4 text-xs text-center ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
                {query ? 'No timezones found' : 'All timezones already added'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */

export default function TimeConverter() {
  const { darkMode } = useTheme();
  const saved = loadState();

  const [sourceZone, setSourceZone] = useState(saved?.sourceZone ?? LOCAL_TZ);
  const [dateStr, setDateStr] = useState(() => getNowStrings(saved?.sourceZone ?? LOCAL_TZ).dateStr);
  const [timeStr, setTimeStr] = useState(() => getNowStrings(saved?.sourceZone ?? LOCAL_TZ).timeStr);
  const [targetZones, setTargetZones] = useState(() => {
    if (saved?.targetZones?.length) return saved.targetZones;
    return DEFAULT_TARGETS.length ? DEFAULT_TARGETS : ['UTC', 'America/New_York', 'Europe/London'];
  });
  const [hour12, setHour12] = useState(saved?.hour12 ?? true);

  const utcDate = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !/^\d{2}:\d{2}$/.test(timeStr)) return new Date();
    try {
      const d = zonedToUTC(dateStr, timeStr, sourceZone);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch { return new Date(); }
  }, [dateStr, timeStr, sourceZone]);

  /* Persist state */
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ sourceZone, targetZones, hour12 })); } catch {}
  }, [sourceZone, targetZones, hour12]);

  function setNow() {
    const { dateStr: d, timeStr: t } = getNowStrings(sourceZone);
    setDateStr(d);
    setTimeStr(t);
  }

  function handleRemoveZone(id) {
    setTargetZones(prev => prev.filter(z => z !== id));
  }

  function handleAddZone(id) {
    setTargetZones(prev => prev.includes(id) ? prev : [...prev, id]);
  }

  // "Use as source" — clicking a card's time promotes it to source
  function handleSetSource(tzId) {
    // The displayed time in that zone becomes the new source
    setSourceZone(tzId);
    // dateStr/timeStr stay the same since utcDate doesn't change, but
    // we need to update them to reflect the wall-clock in the new source zone
    const p = tzParts(utcDate, tzId);
    const h = p.hour === '24' ? '00' : p.hour;
    setDateStr(`${p.year}-${p.month}-${p.day}`);
    setTimeStr(`${h}:${p.minute}`);
    // Also remove the new source zone from targets and add old source to targets
    setTargetZones(prev => {
      const without = prev.filter(z => z !== tzId);
      return without.includes(sourceZone) ? without : [sourceZone, ...without];
    });
  }

  const sourceOffset = getOffsetStr(utcDate, sourceZone);
  const sourceLongName = getLongName(utcDate, sourceZone);
  const sourceTime = fmtTime(utcDate, sourceZone, hour12);
  const sourceDate = fmtDate(utcDate, sourceZone);

  const inputCls = `px-3 py-2 rounded-xl border text-sm outline-none transition-colors ${
    darkMode
      ? 'bg-zinc-700 border-zinc-600 text-zinc-100 focus:border-sky-500'
      : 'bg-white border-slate-300 text-slate-800 focus:border-sky-500'
  }`;

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-zinc-800' : 'bg-slate-200'}`}>
      <AppNav />

      <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 pb-12">

        {/* ── Source / FROM section ───────────────────────────── */}
        <div className={`mt-6 rounded-2xl border p-5 ${darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>

          {/* Row 1: label + controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /><circle cx="12" cy="12" r="9" />
              </svg>
              From
            </div>
            {/* 12h/24h toggle */}
            <div className={`flex items-center rounded-lg p-0.5 gap-px ${darkMode ? 'bg-zinc-700' : 'bg-slate-200'}`}>
              {[true, false].map(is12 => (
                <button
                  key={String(is12)}
                  onClick={() => setHour12(is12)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    hour12 === is12
                      ? darkMode ? 'bg-zinc-900 text-zinc-100 shadow-sm' : 'bg-white text-slate-800 shadow-sm'
                      : darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {is12 ? '12h' : '24h'}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: timezone selector + date/time inputs */}
          <div className="flex flex-wrap gap-3 items-end">
            {/* Timezone selector */}
            <div className="flex-1 min-w-[200px] max-w-xs">
              <ZoneDropdown value={sourceZone} onChange={setSourceZone} darkMode={darkMode} label="Timezone" />
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1">
              <label className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Date</label>
              <input
                type="date"
                value={dateStr}
                onChange={e => setDateStr(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Time */}
            <div className="flex flex-col gap-1">
              <label className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Time</label>
              <input
                type="time"
                value={timeStr}
                onChange={e => setTimeStr(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Now button */}
            <button
              onClick={setNow}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                darkMode ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100 border border-zinc-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Now
            </button>
          </div>

          {/* Row 3: source time preview */}
          <div className={`mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-3 ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
            <div className="flex items-baseline gap-3">
              <span className={`text-3xl font-bold tabular-nums ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>{sourceTime}</span>
              <span className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{sourceDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${darkMode ? 'bg-sky-900/40 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>{sourceOffset}</span>
              {sourceLongName && <span className={`text-xs hidden sm:block ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{sourceLongName}</span>}
            </div>
          </div>
        </div>

        {/* ── Arrow divider ───────────────────────────────────── */}
        <div className="flex items-center gap-3 my-4 px-1">
          <div className={`flex-1 h-px ${darkMode ? 'bg-zinc-700' : 'bg-slate-300'}`} />
          <div className={`flex items-center gap-1 text-xs font-medium ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Converting to
          </div>
          <div className={`flex-1 h-px ${darkMode ? 'bg-zinc-700' : 'bg-slate-300'}`} />
        </div>

        {/* ── Target zone cards grid ──────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {targetZones.map(tzId => (
            <ZoneCard
              key={tzId}
              tzId={tzId}
              utcDate={utcDate}
              sourceZone={sourceZone}
              hour12={hour12}
              onRemove={() => handleRemoveZone(tzId)}
              onSetSource={() => handleSetSource(tzId)}
              darkMode={darkMode}
            />
          ))}
          <AddZonePanel
            existingZones={[...targetZones, sourceZone]}
            onAdd={handleAddZone}
            darkMode={darkMode}
          />
        </div>

        {/* Hint */}
        {targetZones.length > 0 && (
          <p className={`mt-4 text-[11px] text-center ${darkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
            Click any time to use that timezone as the source
          </p>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
