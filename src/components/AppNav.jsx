import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const TOOL_NAMES = {
  '/text-compare': 'Text Compare',
  '/json-validator': 'JSON Validator',
};

export default function AppNav() {
  const { darkMode, setDarkMode } = useTheme();
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const toolName = TOOL_NAMES[pathname];

  return (
    <header className={`sticky top-0 z-20 border-b shadow-sm ${darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'}`}>
      <div className="max-w-screen-xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: brand + breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/icon.svg" alt="OpenUtils" className="w-10 h-10 rounded-lg" />
            <div className={isHome ? 'block' : 'hidden sm:block'}>
              <span className={`text-sm font-semibold tracking-tight leading-none block my-1 ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                OpenUtils
              </span>
              {isHome && (<div className="flex items-center gap-1">
                <span className={`text-[10px] leading-tight ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Free online tools
                </span>
                <span className={`text-[11px] ${darkMode ? 'text-zinc-600' : 'text-slate-300'}`}>·</span>
                <span className={`text-[10px] leading-tight ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                  100% client-side
                </span></div>
              )}
            </div>
          </Link>

          {toolName && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`text-sm ${darkMode ? 'text-zinc-600' : 'text-slate-300'}`}>/</span>
              <span className={`text-sm font-medium truncate ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>
                {toolName}
              </span>
            </div>
          )}
        </div>

        {/* Right: privacy pill + theme toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`hidden sm:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full ${darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            No data sent anywhere
          </span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`p-2 rounded-full transition-colors ${darkMode ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
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
    </header>
  );
}
