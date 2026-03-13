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

  return (
    <div className={`flex flex-col flex-1 min-w-0 rounded-xl border shadow-sm overflow-hidden ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Panel header */}
      <div className={`flex items-center justify-between px-4 py-2 border-b text-sm font-semibold ${
        darkMode
          ? 'bg-gray-700 border-gray-600 text-gray-200'
          : 'bg-gray-50 border-gray-200 text-gray-700'
      }`}>
        <span>{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
            {value.length.toLocaleString()} chars · {value ? value.split('\n').length : 0} lines
          </span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`text-xs px-2 py-0.5 rounded border transition-colors ${
              darkMode
                ? 'border-gray-500 text-gray-300 hover:bg-gray-600'
                : 'border-gray-300 text-gray-500 hover:bg-gray-100'
            }`}
            title="Import text file"
          >
            Import
          </button>
          {value && (
            <button
              onClick={() => onChange('')}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                darkMode
                  ? 'border-gray-500 text-gray-300 hover:bg-gray-600'
                  : 'border-gray-300 text-gray-500 hover:bg-gray-100'
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
        className={`flex-1 resize-none p-4 font-mono text-sm leading-6 outline-none min-h-[280px] ${
          darkMode
            ? 'bg-gray-800 text-gray-100 placeholder-gray-500'
            : 'bg-white text-gray-900 placeholder-gray-400'
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
