import { useState, useMemo, useRef, useEffect } from 'react';
import * as yaml from 'js-yaml';
import AppNav from '../components/AppNav';
import AppFooter from '../components/AppFooter';
import { useTheme } from '../context/ThemeContext';

/* ── Persistence ───────────────────────────────────────────── */

const STORAGE_KEY = 'yaml-validator-state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/* ── YAML utilities ────────────────────────────────────────── */

function parseYAML(input) {
  if (!input.trim()) return { status: 'empty' };
  try {
    const parsed = yaml.load(input, { json: false });
    return { status: 'valid', parsed };
  } catch (e) {
    const mark = e.mark;
    return {
      status: 'error',
      message: e.reason || e.message,
      line: mark ? mark.line + 1 : null,
      col: mark ? mark.column + 1 : null,
    };
  }
}

function getStats(obj) {
  let keys = 0, strings = 0, numbers = 0, booleans = 0, nulls = 0, arrays = 0, objects = 0, maxDepth = 0;
  function walk(v, depth) {
    maxDepth = Math.max(maxDepth, depth);
    if (Array.isArray(v)) { arrays++; v.forEach(i => walk(i, depth + 1)); }
    else if (v === null || v === undefined) { nulls++; }
    else if (typeof v === 'object') { objects++; Object.values(v).forEach(i => walk(i, depth + 1)); keys += Object.keys(v).length; }
    else if (typeof v === 'string') strings++;
    else if (typeof v === 'number') numbers++;
    else if (typeof v === 'boolean') booleans++;
  }
  walk(obj, 0);
  return { keys, strings, numbers, booleans, nulls, arrays, objects, maxDepth };
}

/* ── Export serializers ─────────────────────────────────────── */

function xmlEscape(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeXmlTag(name) {
  const clean = String(name).replace(/[^a-zA-Z0-9_.-]/g, '_');
  return /^[^a-zA-Z_]/.test(clean) ? `_${clean}` : clean;
}

function jsonToXmlNode(value, tag, depth) {
  const pad = '  '.repeat(depth);
  const t = safeXmlTag(tag);
  if (value === null || value === undefined) return `${pad}<${t} nil="true"/>`;
  if (typeof value !== 'object') return `${pad}<${t}>${xmlEscape(value)}</${t}>`;
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}<${t}/>`;
    const children = value.map(item => jsonToXmlNode(item, 'item', depth + 1)).join('\n');
    return `${pad}<${t}>\n${children}\n${pad}</${t}>`;
  }
  const keys = Object.keys(value);
  if (keys.length === 0) return `${pad}<${t}/>`;
  const children = keys.map(k => jsonToXmlNode(value[k], k, depth + 1)).join('\n');
  return `${pad}<${t}>\n${children}\n${pad}</${t}>`;
}

function toXml(value) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${jsonToXmlNode(value, 'root', 0)}`;
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
  const str = String(value);
  return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCsv(value) {
  const rows = Array.isArray(value) ? value : [value];
  const allKeys = [];
  const seen = new Set();
  rows.forEach(row => {
    if (row !== null && typeof row === 'object' && !Array.isArray(row)) {
      Object.keys(row).forEach(k => { if (!seen.has(k)) { seen.add(k); allKeys.push(k); } });
    }
  });
  if (allKeys.length === 0) return rows.map(csvCell).join('\n');
  const header = allKeys.map(csvCell).join(',');
  const body = rows.map(row => {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) return allKeys.map(() => '').join(',');
    return allKeys.map(k => csvCell(row[k])).join(',');
  });
  return [header, ...body].join('\n');
}

/* ── Sub-components ────────────────────────────────────────── */

function YamlToolbar({ onFormat, onMinify, onSortKeys, onClear, indent, onIndentChange, liveMode, onLiveModeChange, hasOutput, onCopy, onExport, exportFormat, onExportFormatChange, copied, darkMode }) {
  const btn = (variant = 'default') => {
    const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus:outline-none';
    if (variant === 'danger') return `${base} ${darkMode ? 'text-rose-400 hover:bg-rose-900/40 hover:text-rose-300' : 'text-rose-500 hover:bg-rose-50 hover:text-rose-600'}`;
    return `${base} ${darkMode ? 'text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`;
  };

  const divider = <div className={`w-px h-5 mx-0.5 ${darkMode ? 'bg-zinc-600' : 'bg-slate-300'}`} />;

  return (
    <div className="flex flex-wrap items-center gap-1 py-2.5 px-0.5 mb-1">
      {/* Left: secondary actions */}
      <button className={btn()} onClick={onMinify}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
        Minify
      </button>
      <button className={btn()} onClick={onSortKeys}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        Sort Keys
      </button>
      <button className={btn('danger')} onClick={onClear}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Clear
      </button>

      {divider}

      {/* Live toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none px-1">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={liveMode}
            onChange={(e) => onLiveModeChange(e.target.checked)}
          />
          <div className={`w-8 h-4 rounded-full transition-colors ${liveMode ? 'bg-emerald-600' : darkMode ? 'bg-zinc-600' : 'bg-slate-300'}`} />
          <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-slate-100 rounded-full shadow-sm transition-transform ${liveMode ? 'translate-x-4' : ''}`} />
        </div>
        <span className={`text-xs ${darkMode ? 'text-zinc-300' : 'text-slate-500'}`}>Live</span>
      </label>

      {divider}

      {/* Indent selector */}
      <div className="flex items-center gap-1.5">
        <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Indent</span>
        <div className={`flex items-center rounded-lg p-0.5 gap-px ${darkMode ? 'bg-zinc-600' : 'bg-slate-300'}`}>
          {[2, 4].map((v) => (
            <button
              key={v}
              onClick={() => onIndentChange(v)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                indent === v
                  ? darkMode ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'bg-slate-100 text-slate-800 shadow-sm'
                  : darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Right: copy + export + Format (primary, big) */}
      <div className="flex items-center gap-1.5">
        {hasOutput && (
          <>
            <button className={btn()} onClick={onCopy}>
              {copied ? (
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <div className="flex items-center rounded-lg overflow-hidden border text-xs font-medium" style={{ borderColor: darkMode ? '#52525b' : '#cbd5e1' }}>
              <button
                onClick={onExport}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 transition-colors ${darkMode ? 'text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              <div className={`w-px self-stretch ${darkMode ? 'bg-zinc-600' : 'bg-slate-300'}`} />
              <select
                value={exportFormat}
                onChange={e => onExportFormatChange(e.target.value)}
                className={`pr-1.5 pl-1 py-1.5 appearance-none cursor-pointer outline-none transition-colors ${darkMode ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
              >
                <option value="yaml">YAML</option>
                <option value="json">JSON</option>
                <option value="xml">XML</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            {divider}
          </>
        )}

        {/* Format — primary, larger */}
        <button
          onClick={onFormat}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors focus:outline-none"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
          Format
        </button>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */

export default function YamlValidator() {
  const { darkMode } = useTheme();
  const saved = loadState();

  const [input, setInput] = useState(saved?.input ?? '');
  const [output, setOutput] = useState(saved?.output ?? '');
  const [outputLabel, setOutputLabel] = useState(saved?.outputLabel ?? '');
  const [indent, setIndent] = useState(saved?.indent ?? 2);
  const [liveMode, setLiveMode] = useState(saved?.liveMode ?? false);
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState('yaml');
  const fileInputRef = useRef(null);

  const validation = useMemo(() => parseYAML(input), [input]);

  /* Persist state */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ input, output, outputLabel, indent, liveMode }));
    } catch {}
  }, [input, output, outputLabel, indent, liveMode]);

  /* Live format */
  useEffect(() => {
    if (!liveMode) return;
    if (validation.status === 'valid') {
      const formatted = yaml.dump(validation.parsed, { indent, lineWidth: -1, noRefs: true });
      setOutput(formatted);
      setOutputLabel('Live');
    } else {
      setOutput('');
      setOutputLabel('');
    }
  }, [input, liveMode, indent]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFormat() {
    if (validation.status !== 'valid') return;
    setOutput(yaml.dump(validation.parsed, { indent, lineWidth: -1, noRefs: true }));
    setOutputLabel('Formatted');
  }

  function handleMinify() {
    if (validation.status !== 'valid') return;
    setOutput(yaml.dump(validation.parsed, { flowLevel: 0, lineWidth: -1, noRefs: true }));
    setOutputLabel('Minified');
  }

  function handleSortKeys() {
    if (validation.status !== 'valid') return;
    setOutput(yaml.dump(validation.parsed, { sortKeys: true, indent, lineWidth: -1, noRefs: true }));
    setOutputLabel('Sorted');
  }

  function handleClear() {
    setInput('');
    setOutput('');
    setOutputLabel('');
    setLiveMode(false);
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleExport() {
    if (!output || validation.status !== 'valid') return;
    let content, mime, ext;
    if (exportFormat === 'json') {
      content = JSON.stringify(validation.parsed, null, 2);
      mime = 'application/json';
      ext = 'json';
    } else if (exportFormat === 'xml') {
      content = toXml(validation.parsed);
      mime = 'application/xml';
      ext = 'xml';
    } else if (exportFormat === 'csv') {
      content = toCsv(validation.parsed);
      mime = 'text/csv';
      ext = 'csv';
    } else {
      content = output;
      mime = 'text/yaml';
      ext = 'yaml';
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setInput(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  }

  const stats = validation.status === 'valid' ? getStats(validation.parsed) : null;

  const panelBase = `flex flex-col flex-1 min-w-0 rounded-xl border overflow-hidden ${
    darkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-slate-100 border-slate-200'
  }`;
  const headerBase = `flex items-center justify-between px-3.5 py-2 border-b text-xs font-semibold ${
    darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-400' : 'bg-stone-50 border-slate-100 text-slate-400'
  }`;

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-zinc-800' : 'bg-slate-200'}`}>
      <AppNav />

      <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 pb-12">
        <YamlToolbar
          onFormat={handleFormat}
          onMinify={handleMinify}
          onSortKeys={handleSortKeys}
          onClear={handleClear}
          indent={indent}
          onIndentChange={setIndent}
          liveMode={liveMode}
          onLiveModeChange={setLiveMode}
          hasOutput={!!output}
          onCopy={handleCopy}
          onExport={handleExport}
          exportFormat={exportFormat}
          onExportFormatChange={setExportFormat}
          copied={copied}
          darkMode={darkMode}
        />

        {/* Panels */}
        <div className="flex gap-3" style={{ minHeight: 420 }}>
          {/* Input panel */}
          <div className={panelBase}>
            <div className={headerBase}>
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-wide">YAML Input</span>
                {validation.status === 'valid' && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Valid
                  </span>
                )}
                {validation.status === 'error' && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-rose-950/60 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Invalid
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] tabular-nums ${darkMode ? 'text-zinc-600' : 'text-slate-300'}`}>
                  {input.length.toLocaleString()}c · {input ? input.split('\n').length : 0}L
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`text-[11px] px-2 py-0.5 rounded transition-colors font-medium ${darkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
                >
                  Import
                </button>
                {input && (
                  <button
                    onClick={() => setInput('')}
                    className={`text-[11px] px-2 py-0.5 rounded transition-colors font-medium ${darkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              placeholder={'Paste YAML here…\n\nexample:\n  key: value\n  list:\n    - item1\n    - item2'}
              className={`flex-1 resize-none p-4 font-mono text-[13px] leading-[1.6] outline-none min-h-[380px] ${
                darkMode ? 'bg-zinc-800 text-zinc-100 placeholder-zinc-600' : 'bg-slate-100 text-slate-900 placeholder-slate-300'
              }`}
            />
            <input ref={fileInputRef} type="file" accept=".yaml,.yml,.txt" className="hidden" onChange={handleFileImport} />
          </div>

          {/* Output panel */}
          <div className={panelBase}>
            <div className={headerBase}>
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-wide">Output</span>
                {outputLabel && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-emerald-950/50 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    {outputLabel}
                  </span>
                )}
              </div>
              {output && (
                <span className={`text-[10px] tabular-nums ${darkMode ? 'text-zinc-600' : 'text-slate-300'}`}>
                  {output.length.toLocaleString()}c · {output.split('\n').length}L
                </span>
              )}
            </div>

            <div className={`flex-1 overflow-auto min-h-[380px] ${darkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
              {/* Error state */}
              {validation.status === 'error' && (
                <div className="p-4">
                  <div className={`rounded-lg border p-4 ${darkMode ? 'bg-rose-950/30 border-rose-800/50' : 'bg-rose-50 border-rose-200'}`}>
                    <div className="flex items-start gap-2.5">
                      <svg className={`w-4 h-4 mt-0.5 shrink-0 ${darkMode ? 'text-rose-400' : 'text-rose-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <div>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                          YAML Parse Error
                          {validation.line && (
                            <span className={`ml-2 font-normal ${darkMode ? 'text-rose-400' : 'text-rose-500'}`}>
                              Line {validation.line}{validation.col ? `, Col ${validation.col}` : ''}
                            </span>
                          )}
                        </p>
                        <p className={`text-xs font-mono leading-relaxed ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                          {validation.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Output content */}
              {output && validation.status === 'valid' && (
                <pre className={`p-4 font-mono text-[13px] leading-[1.6] whitespace-pre-wrap break-all ${darkMode ? 'text-zinc-100' : 'text-slate-800'}`}>
                  {output}
                </pre>
              )}

              {/* Empty state */}
              {!output && validation.status !== 'error' && (
                <div className={`flex flex-col items-center justify-center h-full min-h-[300px] gap-3 ${darkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-xs">Click Format, Minify, or Sort Keys to process</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats / Lint bar */}
        {stats && (
          <div className={`mt-3 rounded-xl border px-4 py-3 ${darkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-slate-100 border-slate-200'}`}>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <span className={`text-[11px] font-semibold uppercase tracking-wide ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                Lint
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Valid YAML
              </span>
              {[
                { label: 'keys', value: stats.keys },
                { label: 'strings', value: stats.strings },
                { label: 'numbers', value: stats.numbers },
                { label: 'arrays', value: stats.arrays },
                { label: 'objects', value: stats.objects },
                { label: 'max depth', value: stats.maxDepth },
              ].map(({ label, value }) => (
                <span key={label} className={`text-[11px] ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                  <span className={`font-semibold ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{value}</span>{' '}{label}
                </span>
              ))}
              {stats.maxDepth > 8 && (
                <span className={`inline-flex items-center gap-1 text-[11px] ${darkMode ? 'bg-amber-950/50 text-amber-400' : 'bg-amber-50 text-amber-600'} px-2 py-0.5 rounded-full`}>
                  ⚠ Deep nesting ({stats.maxDepth} levels)
                </span>
              )}
            </div>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
