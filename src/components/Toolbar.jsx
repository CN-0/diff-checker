export default function Toolbar({
  onCompare,
  onClear,
  onSwap,
  viewMode,
  onViewModeChange,
  liveMode,
  onLiveModeChange,
  darkMode,
  hasDiff,
  onExport,
  onCopyResult,
  copied,
}) {
  const btn = (variant = 'default', extra = '') => {
    const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus:outline-none';
    if (variant === 'danger') {
      return `${base} ${
        darkMode
          ? 'text-rose-400 hover:bg-rose-900/40 hover:text-rose-300'
          : 'text-rose-500 hover:bg-rose-50 hover:text-rose-600'
      } ${extra}`;
    }
    return `${base} ${
      darkMode
        ? 'text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100'
        : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'
    } ${extra}`;
  };

  const divider = <div className={`w-px h-5 mx-0.5 ${darkMode ? 'bg-zinc-600' : 'bg-slate-300'}`} />;

  return (
    <div className="flex flex-wrap items-center gap-1 py-2.5 px-0.5 mb-1">
      {/* Left: secondary actions */}
      <button className={btn()} onClick={onSwap}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        Swap
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
          <div className={`w-8 h-4 rounded-full transition-colors ${liveMode ? 'bg-indigo-600' : darkMode ? 'bg-zinc-600' : 'bg-slate-300'}`} />
          <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-slate-100 rounded-full shadow-sm transition-transform ${liveMode ? 'translate-x-4' : ''}`} />
        </div>
        <span className={`text-xs ${darkMode ? 'text-zinc-300' : 'text-slate-500'}`}>Live</span>
      </label>

      {divider}

      {/* View mode */}
      <div className={`flex items-center rounded-lg p-0.5 gap-px ${darkMode ? 'bg-zinc-600' : 'bg-slate-300'}`}>
        {['inline', 'split'].map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
              viewMode === mode
                ? darkMode
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'bg-slate-100 text-slate-800 shadow-sm'
                : darkMode
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: copy/export + Compare (primary, big) */}
      <div className="flex items-center gap-1.5">
        {hasDiff && (
          <>
            <button className={btn()} onClick={onCopyResult}>
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
            <button className={btn()} onClick={onExport}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            {divider}
          </>
        )}

        {/* Compare — primary, larger */}
        <button
          onClick={onCompare}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors focus:outline-none"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          Compare
        </button>
      </div>
    </div>
  );
}
