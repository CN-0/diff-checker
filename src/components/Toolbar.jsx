export default function Toolbar({
  onCompare,
  onClear,
  onSwap,
  viewMode,
  onViewModeChange,
  liveMode,
  onLiveModeChange,
  darkMode,
  onDarkModeChange,
  hasDiff,
  onExport,
  onCopyResult,
  copied,
}) {
  const btn = (label, onClick, variant = 'default', extra = '') =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors focus:outline-none ${extra} ${
      variant === 'primary'
        ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
        : variant === 'danger'
        ? darkMode
          ? 'bg-transparent border-red-500 text-red-400 hover:bg-red-900/30'
          : 'bg-transparent border-red-300 text-red-600 hover:bg-red-50'
        : darkMode
        ? 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700'
        : 'bg-transparent border-gray-300 text-gray-600 hover:bg-gray-100'
    }`;

  const toggleClass = (active) =>
    `px-3 py-1 text-xs font-medium rounded-md transition-colors ${
      active
        ? darkMode
          ? 'bg-blue-600 text-white'
          : 'bg-blue-600 text-white'
        : darkMode
        ? 'text-gray-400 hover:text-gray-200'
        : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className={`flex flex-wrap items-center gap-3 py-3 px-1`}>
      {/* Left: action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button className={btn('Compare', onCompare, 'primary')} onClick={onCompare}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Compare
        </button>

        <button className={btn('Swap', onSwap)} onClick={onSwap}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Swap
        </button>

        <button className={btn('Clear', onClear, 'danger')} onClick={onClear}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>
      </div>

      {/* Divider */}
      <div className={`w-px h-6 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />

      {/* Live mode toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={liveMode}
            onChange={(e) => onLiveModeChange(e.target.checked)}
          />
          <div className={`w-9 h-5 rounded-full transition-colors ${liveMode ? 'bg-blue-600' : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${liveMode ? 'translate-x-4' : ''}`} />
        </div>
        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Live</span>
      </label>

      {/* Divider */}
      <div className={`w-px h-6 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />

      {/* View mode toggle */}
      <div className={`flex items-center rounded-lg p-0.5 gap-0.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <button className={toggleClass(viewMode === 'inline')} onClick={() => onViewModeChange('inline')}>
          Inline
        </button>
        <button className={toggleClass(viewMode === 'split')} onClick={() => onViewModeChange('split')}>
          Split
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: utility buttons */}
      <div className="flex items-center gap-2">
        {hasDiff && (
          <>
            <button className={btn('Copy', onCopyResult)} onClick={onCopyResult}>
              {copied ? (
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button className={btn('Export', onExport)} onClick={onExport}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={() => onDarkModeChange(!darkMode)}
          className={btn('Dark mode', null)}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
