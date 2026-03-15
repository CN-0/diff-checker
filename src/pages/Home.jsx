import { Link } from 'react-router-dom';
import AppNav from '../components/AppNav';
import AppFooter from '../components/AppFooter';
import { useTheme } from '../context/ThemeContext';

const TOOLS = [
  {
    id: 'text-compare',
    href: '/text-compare',
    name: 'Text Compare',
    description: 'Paste two texts and instantly see what changed — word-level diff with inline and split views.',
    tags: ['diff', 'comparison', 'text'],
    accent: 'indigo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" className="w-6 h-6">
        <rect x="3" y="3" width="7" height="18" rx="1" />
        <rect x="14" y="3" width="7" height="18" rx="1" />
        <path d="M7 8H6M7 12H5M7 16H6" />
        <path d="M17 8h1M17 12h2M17 16h1" />
      </svg>
    ),
  },
  {
    id: 'json-validator',
    href: '/json-validator',
    name: 'JSON Validator',
    description: 'Format, minify, validate and sort JSON with detailed error reporting and lint checks.',
    tags: ['json', 'formatter', 'validator', 'linter'],
    accent: 'amber',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" className="w-6 h-6">
        <path d="M8 3H7a2 2 0 00-2 2v4a2 2 0 01-2 2 2 2 0 012 2v4a2 2 0 002 2h1" />
        <path d="M16 3h1a2 2 0 012 2v4a2 2 0 002 2 2 2 0 00-2 2v4a2 2 0 01-2 2h-1" />
        <path d="M12 8v8M9 11l3-3 3 3" />
      </svg>
    ),
  },
];

const ACCENT = {
  indigo: {
    bg: 'bg-indigo-600',
    light: 'bg-indigo-50',
    text: 'text-indigo-600',
    tag: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
    btn: 'bg-indigo-600 hover:bg-indigo-700',
  },
  amber: {
    bg: 'bg-amber-500',
    light: 'bg-amber-50',
    text: 'text-amber-600',
    tag: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    btn: 'bg-amber-500 hover:bg-amber-600',
  },
};

export default function Home() {
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
      <AppNav />

      <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className={`text-2xl font-bold tracking-tight mb-2 ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
            Free online developer tools
          </h1>
          <p className={`text-sm max-w-lg ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
            Fast, focused tools that run entirely in your browser. No login, no server, no data collection.
          </p>
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => {
            const a = ACCENT[tool.accent];
            return (
              <Link
                key={tool.id}
                to={tool.href}
                className={`group flex flex-col rounded-xl border p-5 transition-shadow hover:shadow-md ${
                  darkMode
                    ? 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg ${a.bg} flex items-center justify-center text-white mb-4 shrink-0`}>
                  {tool.icon}
                </div>

                {/* Name + description */}
                <h2 className={`text-sm font-semibold mb-1.5 ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                  {tool.name}
                </h2>
                <p className={`text-xs leading-relaxed mb-4 flex-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {tool.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tool.tags.map((tag) => (
                    <span key={tag} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${a.tag}`}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold text-white px-3.5 py-1.5 rounded-lg self-start ${a.btn} transition-colors`}>
                  Open tool
                  <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            );
          })}

          {/* Coming soon placeholder */}
          <div className={`flex flex-col rounded-xl border border-dashed p-5 ${
            darkMode ? 'border-zinc-700 bg-zinc-900/40' : 'border-slate-200 bg-white/60'
          }`}>
            <div className={`w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center mb-4 ${
              darkMode ? 'border-zinc-700' : 'border-slate-200'
            }`}>
              <svg className={`w-5 h-5 ${darkMode ? 'text-zinc-700' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className={`text-sm font-semibold mb-1.5 ${darkMode ? 'text-zinc-600' : 'text-slate-300'}`}>
              More tools coming
            </h2>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
              Base64 encoder, URL encoder, regex tester and more on the way.
            </p>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
