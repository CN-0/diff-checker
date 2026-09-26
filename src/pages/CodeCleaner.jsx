import { useState, useMemo, useRef, useEffect } from 'react';
import AppNav from '../components/AppNav';
import AppFooter from '../components/AppFooter';
import { useTheme } from '../context/ThemeContext';
import { LANGUAGE_LIST, LANGUAGES, detectLanguage, cleanCode } from '../utils/codeCleanerUtils';

/* ── Persistence ───────────────────────────────────────────── */

const STORAGE_KEY = 'code-cleaner-state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const DEFAULT_OPTS = {
  lang: 'javascript',
  removeComments: true,
  blankLines: 'collapse',
  collapseMax: 1,
  trimTrailing: true,
  removeDebug: false,
  reindent: false,
  indentMode: 'keep',
  indentSize: 2,
  lineEndings: 'lf',
};

/* ── Sub-components ───────────────────────────────────────── */

function ToggleSwitch({ checked, onChange, label, disabled, darkMode }) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer select-none px-1 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-8 h-4 rounded-full transition-colors ${checked ? 'bg-violet-600' : darkMode ? 'bg-zinc-600' : 'bg-slate-300'}`} />
        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-slate-100 rounded-full shadow-sm transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </div>
      <span className={`text-xs ${darkMode ? 'text-zinc-300' : 'text-slate-500'}`}>{label}</span>
    </label>
  );
}

function CodeCleanerToolbar({ opts, setOpt, liveMode, onLiveModeChange, onClean, onClear, hasOutput, onCopy, copied, darkMode }) {
  const btn = (variant = 'default') => {
    const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus:outline-none';
    if (variant === 'danger') return `${base} ${darkMode ? 'text-rose-400 hover:bg-rose-900/40 hover:text-rose-300' : 'text-rose-500 hover:bg-rose-50 hover:text-rose-600'}`;
    return `${base} ${darkMode ? 'text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`;
  };
  const selectCls = `text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer ${darkMode ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`;
  const divider = <div className={`w-px h-5 mx-0.5 ${darkMode ? 'bg-zinc-600' : 'bg-slate-300'}`} />;
  const cfg = LANGUAGES[opts.lang];

  return (
    <div className="flex flex-col gap-2 py-2.5 px-0.5 mb-1">
      {/* Row 1: language + format controls */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Language</span>
        <select value={opts.lang} onChange={(e) => setOpt('lang', e.target.value)} className={selectCls}>
          {LANGUAGE_LIST.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        {divider}

        <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Blank lines</span>
        <select value={opts.blankLines} onChange={(e) => setOpt('blankLines', e.target.value)} className={selectCls}>
          <option value="keep">Keep</option>
          <option value="collapse">Collapse</option>
          <option value="remove">Remove all</option>
        </select>
        {opts.blankLines === 'collapse' && (
          <input
            type="number"
            min={0}
            max={10}
            value={opts.collapseMax}
            onChange={(e) => setOpt('collapseMax', Math.max(0, Number(e.target.value)))}
            className={`w-12 text-xs rounded-lg px-2 py-1.5 outline-none ${darkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-white text-slate-600 border border-slate-200'}`}
            title="Max consecutive blank lines"
          />
        )}

        {divider}

        <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Indent</span>
        <select value={opts.indentMode} onChange={(e) => setOpt('indentMode', e.target.value)} className={selectCls}>
          <option value="keep">Keep</option>
          <option value="spaces">Spaces</option>
          <option value="tabs">Tabs</option>
        </select>
        {opts.indentMode === 'spaces' && (
          <select value={opts.indentSize} onChange={(e) => setOpt('indentSize', Number(e.target.value))} className={selectCls} title="Spaces per indent level">
            {[2, 4, 8].map((v) => <option key={v} value={v}>{v} wide</option>)}
          </select>
        )}

        {divider}

        <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Line endings</span>
        <select value={opts.lineEndings} onChange={(e) => setOpt('lineEndings', e.target.value)} className={selectCls}>
          <option value="lf">LF (Unix)</option>
          <option value="crlf">CRLF (Windows)</option>
        </select>
      </div>

      {/* Row 2: toggles + actions */}
      <div className="flex flex-wrap items-center gap-1">
        <ToggleSwitch checked={opts.removeComments} onChange={(v) => setOpt('removeComments', v)} label="Remove comments" darkMode={darkMode} />
        <ToggleSwitch checked={opts.trimTrailing} onChange={(v) => setOpt('trimTrailing', v)} label="Trim trailing space" darkMode={darkMode} />
        <ToggleSwitch
          checked={opts.removeDebug}
          onChange={(v) => setOpt('removeDebug', v)}
          label="Remove debug logs"
          disabled={!cfg?.debug}
          darkMode={darkMode}
        />
        <ToggleSwitch
          checked={opts.reindent}
          onChange={(v) => setOpt('reindent', v)}
          label="Auto re-indent (beta)"
          disabled={!cfg?.brace || cfg?.indentSensitive}
          darkMode={darkMode}
        />

        {divider}

        <label className="flex items-center gap-2 cursor-pointer select-none px-1">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={liveMode} onChange={(e) => onLiveModeChange(e.target.checked)} />
            <div className={`w-8 h-4 rounded-full transition-colors ${liveMode ? 'bg-emerald-600' : darkMode ? 'bg-zinc-600' : 'bg-slate-300'}`} />
            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-slate-100 rounded-full shadow-sm transition-transform ${liveMode ? 'translate-x-4' : ''}`} />
          </div>
          <span className={`text-xs ${darkMode ? 'text-zinc-300' : 'text-slate-500'}`}>Live</span>
        </label>

        <div className="flex-1" />

        <button className={btn('danger')} onClick={onClear}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>

        {hasOutput && (
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
        )}

        <button
          onClick={onClean}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors focus:outline-none"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
          Clean Code
        </button>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */

export default function CodeCleaner() {
  const { darkMode } = useTheme();
  const saved = loadState();

  const [input, setInput] = useState(saved?.input ?? '');
  const [output, setOutput] = useState(saved?.output ?? '');
  const [opts, setOpts] = useState({ ...DEFAULT_OPTS, ...(saved?.opts ?? {}) });
  const [liveMode, setLiveMode] = useState(saved?.liveMode ?? false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const setOpt = (key, value) => setOpts((o) => ({ ...o, [key]: value }));

  const result = useMemo(() => cleanCode(input, opts), [input, opts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ input, output, opts, liveMode }));
    } catch {}
  }, [input, output, opts, liveMode]);

  useEffect(() => {
    if (!liveMode) return;
    setOutput(result.output);
  }, [liveMode, result]);

  function handleClean() {
    setOutput(result.output);
  }

  function handleClear() {
    setInput('');
    setOutput('');
    setLiveMode(false);
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    if (!output) return;
    const cfg = LANGUAGES[opts.lang];
    const ext = cfg?.ext?.[0] || 'txt';
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setOpt('lang', detectLanguage(file.name));
    const reader = new FileReader();
    reader.onload = (ev) => setInput(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  }

  const showOutput = liveMode ? result.output : output;
  const stats = result.stats;

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
        <CodeCleanerToolbar
          opts={opts}
          setOpt={setOpt}
          liveMode={liveMode}
          onLiveModeChange={setLiveMode}
          onClean={handleClean}
          onClear={handleClear}
          hasOutput={!!showOutput}
          onCopy={handleCopy}
          copied={copied}
          darkMode={darkMode}
        />

        {/* Panels */}
        <div className="flex gap-3" style={{ minHeight: 420 }}>
          {/* Input panel */}
          <div className={panelBase}>
            <div className={headerBase}>
              <span className="uppercase tracking-wide">Source</span>
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
              placeholder={'Paste any source code here…\n\nSelect a language above, tune the cleanup options,\nthen hit Clean Code.'}
              className={`flex-1 resize-none p-4 font-mono text-[13px] leading-[1.6] outline-none min-h-[380px] ${
                darkMode ? 'bg-zinc-800 text-zinc-100 placeholder-zinc-600' : 'bg-slate-100 text-slate-900 placeholder-slate-300'
              }`}
            />
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileImport} />
          </div>

          {/* Output panel */}
          <div className={panelBase}>
            <div className={headerBase}>
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-wide">Cleaned</span>
                {liveMode && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-emerald-950/50 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    Live
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {showOutput && (
                  <span className={`text-[10px] tabular-nums ${darkMode ? 'text-zinc-600' : 'text-slate-300'}`}>
                    {showOutput.length.toLocaleString()}c · {showOutput.split('\n').length}L
                  </span>
                )}
                {showOutput && (
                  <button
                    onClick={handleDownload}
                    className={`text-[11px] px-2 py-0.5 rounded transition-colors font-medium ${darkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
                  >
                    Download
                  </button>
                )}
              </div>
            </div>

            <div className={`flex-1 overflow-auto min-h-[380px] ${darkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
              {showOutput ? (
                <pre className={`p-4 font-mono text-[13px] leading-[1.6] whitespace-pre-wrap break-all ${darkMode ? 'text-zinc-100' : 'text-slate-800'}`}>
                  {showOutput}
                </pre>
              ) : (
                <div className={`flex flex-col items-center justify-center h-full min-h-[300px] gap-3 ${darkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                  <p className="text-xs">Click Clean Code to process</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {input && (
          <div className={`mt-3 rounded-xl border px-4 py-3 ${darkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-slate-100 border-slate-200'}`}>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <span className={`text-[11px] font-semibold uppercase tracking-wide ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                Result
              </span>
              {[
                { label: 'lines before', value: stats.linesBefore },
                { label: 'lines after', value: stats.linesAfter },
                { label: 'comments removed', value: stats.commentsRemoved },
                { label: 'blank lines removed', value: stats.blankLinesRemoved },
                { label: 'debug lines removed', value: stats.debugRemoved },
              ].map(({ label, value }) => (
                <span key={label} className={`text-[11px] ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                  <span className={`font-semibold ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{value}</span>{' '}{label}
                </span>
              ))}
              {stats.charsBefore > 0 && (
                <span className={`inline-flex items-center gap-1 text-[11px] ${darkMode ? 'bg-violet-950/50 text-violet-400' : 'bg-violet-50 text-violet-600'} px-2 py-0.5 rounded-full`}>
                  {Math.round((1 - stats.charsAfter / stats.charsBefore) * 100)}% smaller
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
