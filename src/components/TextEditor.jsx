import { useRef } from 'react';

export default function TextEditor({ label, value, onChange, onScroll, textareaRef, darkMode }) {
  const fileInputRef = useRef(null);

  function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  }

  const charCount = value.length.toLocaleString();
  const lineCount = value ? value.split('\n').length : 0;

  return (
    <div className={`flex flex-col flex-1 min-w-0 rounded-xl border overflow-hidden ${
      darkMode
        ? 'bg-zinc-800 border-zinc-600'
        : 'bg-white border-slate-200'
    }`}>
      {/* Panel header */}
      <div className={`flex items-center justify-between px-3.5 py-2 border-b ${
        darkMode
          ? 'bg-zinc-700 border-zinc-600'
          : 'bg-stone-50 border-slate-100'
      }`}>
        <span className={`text-xs font-semibold tracking-wide uppercase ${
          darkMode ? 'text-zinc-400' : 'text-slate-400'
        }`}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] tabular-nums ${darkMode ? 'text-zinc-600' : 'text-slate-300'}`}>
            {charCount}c · {lineCount}L
          </span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`text-[11px] px-2 py-0.5 rounded transition-colors font-medium ${
              darkMode
                ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-600'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title="Import text file"
          >
            Import
          </button>
          {value && (
            <button
              onClick={() => onChange('')}
              className={`text-[11px] px-2 py-0.5 rounded transition-colors font-medium ${
                darkMode
                  ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-600'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={onScroll}
        spellCheck={false}
        placeholder={`Paste ${label.toLowerCase()} here…`}
        className={`flex-1 resize-none p-4 font-mono text-[13px] leading-[1.6] outline-none min-h-[280px] ${
          darkMode
            ? 'bg-zinc-800 text-zinc-100 placeholder-zinc-600'
            : 'bg-white text-slate-900 placeholder-slate-300'
        }`}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.json,.csv,.xml,.html,.js,.ts,.jsx,.tsx,.py,.java,.rb,.go,.rs,.c,.cpp,.h"
        className="hidden"
        onChange={handleFileImport}
      />
    </div>
  );
}
