import { useState, useRef, useEffect, useCallback } from 'react';
import TextEditor from '../components/TextEditor';
import DiffViewer from '../components/DiffViewer';
import Toolbar from '../components/Toolbar';
import AppNav from '../components/AppNav';
import AppFooter from '../components/AppFooter';
import { useTheme } from '../context/ThemeContext';

const STORAGE_KEY = 'text-compare-state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function TextCompare() {
  const { darkMode } = useTheme();
  const saved = loadState();

  const [original, setOriginal] = useState(saved?.original ?? '');
  const [modified, setModified] = useState(saved?.modified ?? '');
  const [diffOriginal, setDiffOriginal] = useState(saved?.diffOriginal ?? '');
  const [diffModified, setDiffModified] = useState(saved?.diffModified ?? '');
  const [viewMode, setViewMode] = useState(saved?.viewMode ?? 'split');
  const [liveMode, setLiveMode] = useState(saved?.liveMode ?? false);
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
        JSON.stringify({ original, modified, diffOriginal, diffModified, viewMode, liveMode })
      );
    } catch {}
  }, [original, modified, diffOriginal, diffModified, viewMode, liveMode]);

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
      <AppNav />

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
          hasDiff={hasCompared}
          onExport={handleExport}
          onCopyResult={handleCopyResult}
          copied={copied}
        />

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

        {hasCompared && (diffOriginal || diffModified) && (
          <DiffViewer
            original={diffOriginal}
            modified={diffModified}
            viewMode={viewMode}
            darkMode={darkMode}
          />
        )}
      </main>

      <AppFooter />
    </div>
  );
}

function buildPlainDiff(original, modified) {
  const lines = ['--- Original', '+++ Modified', ''];
  const oLines = original.split('\n');
  const mLines = modified.split('\n');
  const max = Math.max(oLines.length, mLines.length);
  for (let i = 0; i < max; i++) {
    const o = oLines[i];
    const m = mLines[i];
    if (o === m) { lines.push(`  ${o ?? ''}`); }
    else {
      if (o !== undefined) lines.push(`- ${o}`);
      if (m !== undefined) lines.push(`+ ${m}`);
    }
  }
  return lines.join('\n');
}
