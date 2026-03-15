import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const GITHUB_URL = 'https://github.com/CN-0/diff-checker';

export default function AppFooter() {
  const { darkMode } = useTheme();

  return (
    <footer className={`border-t py-4 ${darkMode ? 'border-zinc-700' : 'border-slate-200'}`}>
      <div className="max-w-screen-xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to="/" className={`flex items-center gap-1.5 text-[11px] transition-colors ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-600'}`}>
            <img src="/icon.svg" alt="" className="w-4 h-4 rounded" />
            OpenUtils
          </Link>
          <span className={`text-[11px] ${darkMode ? 'text-zinc-600' : 'text-slate-300'}`}>·</span>
          <p className={`text-[11px] ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
            All processing happens in your browser
          </p>
        </div>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className={`flex items-center gap-1.5 text-[11px] transition-colors ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <GitHubIcon size={13} />
          View on GitHub
        </a>
      </div>
    </footer>
  );
}

function GitHubIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
