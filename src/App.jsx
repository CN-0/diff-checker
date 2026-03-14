import { useState, useRef, useEffect, useCallback } from 'react';
import TextEditor from './components/TextEditor';
import DiffViewer from './components/DiffViewer';
import Toolbar from './components/Toolbar';

const STORAGE_KEY = 'text-compare-state';

// ← Update this to your actual GitHub repo URL
const GITHUB_URL = 'https://github.com/CN-0/diff-checker';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const saved = loadState();

  const [original, setOriginal] = useState(saved?.original ?? '');
  const [modified, setModified] = useState(saved?.modified ?? '');
  const [diffOriginal, setDiffOriginal] = useState(saved?.diffOriginal ?? '');
  const [diffModified, setDiffModified] = useState(saved?.diffModified ?? '');
  const [viewMode, setViewMode] = useState(saved?.viewMode ?? 'split');
  const [liveMode, setLiveMode] = useState(saved?.liveMode ?? false);
  const [darkMode, setDarkMode] = useState(saved?.darkMode ?? false);
  const [copied, setCopied] = useState(false);
  const [hasCompared, setHasCompared] = useState(!!(saved?.diffOriginal));

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const syncingRef = useRef(false);

  /* Persist state */
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ original, modified, diffOriginal, diffModified, viewMode, liveMode, darkMode })
      );
    } catch {}
  }, [original, modified, diffOriginal, diffModified, viewMode, liveMode, darkMode]);

  /* Dark mode on <html> */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  /* Live comparison */
  useEffect(() => {
    if (!liveMode) return;
    setDiffOriginal(original);
    setDiffModified(modified);
    setHasCompared(true);
  }, [original, modified, liveMode]);

  /* Scroll sync */
  const handleLeftScroll = useCallback(() => {
    if (syncingRef.current || !rightRef.current || !leftRef.current) return;
    syncingRef.current = true;
    const ratio = leftRef.current.scrollTop / (leftRef.current.scrollHeight - leftRef.current.clientHeight || 1);
    rightRef.current.scrollTop = ratio * (rightRef.current.scrollHeight - rightRef.current.clientHeight);
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);

  const handleRightScroll = useCallback(() => {
    if (syncingRef.current || !leftRef.current || !rightRef.current) return;
    syncingRef.current = true;
    const ratio = rightRef.current.scrollTop / (rightRef.current.scrollHeight - rightRef.current.clientHeight || 1);
    leftRef.current.scrollTop = ratio * (leftRef.current.scrollHeight - leftRef.current.clientHeight);
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);

  function handleCompare() {
    setDiffOriginal(original);
    setDiffModified(modified);
    setHasCompared(true);
  }

  function handleClear() {
    setOriginal('');
    setModified('');
    setDiffOriginal('');
    setDiffModified('');
    setHasCompared(false);
  }

  function handleSwap() {
    setOriginal(modified);
    setModified(original);
    if (liveMode) {
      setDiffOriginal(modified);
      setDiffModified(original);
    }
  }

  function handleCopyResult() {
    if (!diffOriginal && !diffModified) return;
    const text = buildPlainDiff(diffOriginal, diffModified);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleExport() {
    const text = buildPlainDiff(diffOriginal, diffModified);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diff.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-150 ${darkMode ? 'bg-zinc-800' : 'bg-slate-200'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-20 border-b ${darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-stone-50 border-slate-200'}`}>
        <div className="max-w-screen-xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="Text Compare" className="w-8 h-8 rounded-lg shrink-0" />
            <div>
              <span className={`text-sm font-semibold tracking-tight leading-none ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                Text Compare
              </span>
              <p className={`text-[10px] leading-tight mt-0.5 ${darkMode ? 'text-zinc-400' : 'text-slate-400'}`}>
                Diff checker · 100% client-side
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            <span className={`hidden sm:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full ${darkMode ? 'bg-zinc-600 text-zinc-300' : 'bg-slate-200 text-slate-500'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              No data sent anywhere
            </span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full transition-colors ${
                darkMode
                  ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-600'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              {darkMode ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 pb-12">
        <Toolbar
          onCompare={handleCompare}
          onClear={handleClear}
          onSwap={handleSwap}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          liveMode={liveMode}
          onLiveModeChange={setLiveMode}
          darkMode={darkMode}
          onDarkModeChange={setDarkMode}
          hasDiff={hasCompared}
          onExport={handleExport}
          onCopyResult={handleCopyResult}
          copied={copied}
        />

        {/* Editors */}
        <div className="flex gap-3 mb-3" style={{ minHeight: 320 }}>
          <TextEditor
            label="Original"
            value={original}
            onChange={setOriginal}
            onScroll={handleLeftScroll}
            textareaRef={leftRef}
            darkMode={darkMode}
          />
          <TextEditor
            label="Modified"
            value={modified}
            onChange={setModified}
            onScroll={handleRightScroll}
            textareaRef={rightRef}
            darkMode={darkMode}
          />
        </div>

        {/* Compare hint */}
        {!liveMode && !hasCompared && (original || modified) && (
          <p className={`text-center text-xs mb-5 ${darkMode ? 'text-zinc-400' : 'text-slate-400'}`}>
            Hit{' '}
            <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
              darkMode ? 'border-zinc-600 bg-zinc-700 text-zinc-200' : 'border-slate-200 bg-slate-200 text-slate-600'
            }`}>
              Compare
            </kbd>{' '}
            to see the diff
          </p>
        )}

        {/* Diff result */}
        {hasCompared && (diffOriginal || diffModified) && (
          <DiffViewer
            original={diffOriginal}
            modified={diffModified}
            viewMode={viewMode}
            darkMode={darkMode}
          />
        )}
      </main>

      <footer className={`border-t py-3.5 ${darkMode ? 'border-zinc-600' : 'border-slate-200'}`}>
        <div className="max-w-screen-xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <p className={`text-[11px] ${darkMode ? 'text-zinc-400' : 'text-slate-400'}`}>
            Powered by{' '}
            <a
              href="https://github.com/kpdecker/jsdiff"
              target="_blank"
              rel="noreferrer"
              className={`underline underline-offset-2 ${darkMode ? 'text-zinc-300 hover:text-zinc-100' : 'text-slate-500 hover:text-slate-700'}`}
            >
              jsdiff
            </a>
            {' '}· All processing happens in your browser
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${
              darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <GitHubIcon size={13} />
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

function GitHubIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/* Build a plain-text unified-style diff for copy/export */
function buildPlainDiff(original, modified) {
  const lines = [];
  lines.push('--- Original');
  lines.push('+++ Modified');
  lines.push('');

  const oLines = original.split('\n');
  const mLines = modified.split('\n');
  const max = Math.max(oLines.length, mLines.length);

  for (let i = 0; i < max; i++) {
    const o = oLines[i];
    const m = mLines[i];
    if (o === m) {
      lines.push(`  ${o ?? ''}`);
    } else {
      if (o !== undefined) lines.push(`- ${o}`);
      if (m !== undefined) lines.push(`+ ${m}`);
    }
  }

  return lines.join('\n');
}
