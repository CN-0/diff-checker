import { useState, useRef, useEffect, useCallback } from 'react';
import TextEditor from './components/TextEditor';
import DiffViewer from './components/DiffViewer';
import Toolbar from './components/Toolbar';

const STORAGE_KEY = 'text-compare-state';

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
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-20 border-b shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Text Compare
            </h1>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Compare two texts and instantly highlight differences — 100% client-side
            </p>
          </div>
          <div className={`hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-400'}`}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            No data leaves your browser
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 pb-12">
        {/* Toolbar */}
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
        <div className="flex gap-4 mb-4" style={{ minHeight: 320 }}>
          <TextEditor
            label="Original Text"
            value={original}
            onChange={setOriginal}
            onScroll={handleLeftScroll}
            textareaRef={leftRef}
            darkMode={darkMode}
          />
          <TextEditor
            label="Modified Text"
            value={modified}
            onChange={setModified}
            onScroll={handleRightScroll}
            textareaRef={rightRef}
            darkMode={darkMode}
          />
        </div>

        {/* Compare hint */}
        {!liveMode && !hasCompared && (original || modified) && (
          <div className={`text-center text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Press{' '}
            <kbd className={`px-1.5 py-0.5 rounded border font-mono text-xs ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-gray-300 bg-gray-100 text-gray-700'}`}>
              Compare
            </kbd>{' '}
            to see the diff
          </div>
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

      <footer className={`border-t py-4 text-center text-xs ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
        Powered by{' '}
        <a
          href="https://github.com/kpdecker/jsdiff"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          jsdiff
        </a>{' '}
        · All processing happens locally in your browser
      </footer>
    </div>
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
