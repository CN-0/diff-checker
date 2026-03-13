import { useMemo } from 'react';
import {
  computeWordDiff,
  computeLineDiff,
  buildSideBySidePairs,
  computeIntraLineDiff,
  computeStats,
} from '../utils/diffUtils';

/* ── helpers ─────────────────────────────────────────────── */

function highlight(type) {
  if (type === 'added') return 'bg-green-100 text-green-900 dark-added';
  if (type === 'removed') return 'bg-red-100 text-red-900 dark-removed';
  return '';
}

function InlineSpan({ text, type }) {
  const cls =
    type === 'added'
      ? 'bg-green-200 text-green-900'
      : type === 'removed'
      ? 'bg-red-200 text-red-900 line-through'
      : '';
  return <span className={cls}>{text}</span>;
}

/* ── Inline diff view ─────────────────────────────────────── */

function InlineDiff({ parts, darkMode }) {
  const lines = useMemo(() => {
    // Collect rendered tokens and split into lines
    const tokens = [];
    for (const part of parts) {
      const type = part.added ? 'added' : part.removed ? 'removed' : null;
      const segments = part.value.split('\n');
      segments.forEach((seg, i) => {
        if (i > 0) tokens.push({ newline: true });
        if (seg) tokens.push({ text: seg, type });
      });
    }

    // Group into lines
    const result = [[]];
    for (const tok of tokens) {
      if (tok.newline) result.push([]);
      else result[result.length - 1].push(tok);
    }
    return result;
  }, [parts]);

  if (parts.length === 0) return null;

  const rowBase = `font-mono text-sm leading-6 px-4 py-0.5 flex whitespace-pre-wrap break-all`;

  return (
    <div className={`rounded-xl border overflow-hidden text-sm ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className={`px-4 py-2 text-xs font-semibold border-b ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
        Inline Diff
      </div>
      <div className={`overflow-auto max-h-[520px] ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        {lines.map((line, li) => {
          const hasAdded = line.some((t) => t.type === 'added');
          const hasRemoved = line.some((t) => t.type === 'removed');
          let rowBg = '';
          if (hasAdded && !hasRemoved) rowBg = darkMode ? 'bg-green-950/60' : 'bg-green-50';
          else if (hasRemoved && !hasAdded) rowBg = darkMode ? 'bg-red-950/60' : 'bg-red-50';
          else if (hasAdded && hasRemoved) rowBg = darkMode ? 'bg-yellow-950/60' : 'bg-yellow-50';

          return (
            <div key={li} className={`${rowBase} ${rowBg}`}>
              <span className={`select-none w-8 shrink-0 text-right mr-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                {li + 1}
              </span>
              <span className="flex-1">
                {line.length === 0 ? '\u00a0' : line.map((tok, ti) => (
                  <InlineSpan key={ti} text={tok.text} type={tok.type} />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Side-by-side diff view ───────────────────────────────── */

function SideParts({ parts }) {
  return (
    <>
      {parts.map((p, i) =>
        p.highlight ? (
          <mark
            key={i}
            className={
              p.highlight === 'added'
                ? 'bg-green-300 text-green-900'
                : 'bg-red-300 text-red-900'
            }
            style={{ background: undefined }}
          >
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

function SideBySideDiff({ original, modified, darkMode }) {
  const pairs = useMemo(() => {
    const lineDiff = computeLineDiff(original, modified);
    return buildSideBySidePairs(lineDiff);
  }, [original, modified]);

  if (pairs.length === 0) return null;

  const cellBase = `font-mono text-sm leading-6 px-3 py-0.5 whitespace-pre-wrap break-all min-w-0 flex-1`;

  return (
    <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Column headers */}
      <div className={`grid grid-cols-2 text-xs font-semibold border-b ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`px-10 py-2 border-r ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Original</div>
        <div className={`px-10 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Modified</div>
      </div>

      <div className={`overflow-auto max-h-[520px] ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        {pairs.map((pair, i) => {
          const isChanged = pair.left?.type !== 'unchanged' || pair.right?.type !== 'unchanged';
          const isMixed = pair.left?.type === 'removed' && pair.right?.type === 'added';

          let leftParts = null;
          let rightParts = null;
          if (isMixed) {
            const intra = computeIntraLineDiff(pair.left.text, pair.right.text);
            leftParts = intra.leftParts;
            rightParts = intra.rightParts;
          }

          const leftBg = !pair.left
            ? darkMode ? 'bg-gray-800/40' : 'bg-gray-50'
            : pair.left.type === 'removed'
            ? darkMode ? 'bg-red-950/60' : 'bg-red-50'
            : '';

          const rightBg = !pair.right
            ? darkMode ? 'bg-gray-800/40' : 'bg-gray-50'
            : pair.right.type === 'added'
            ? darkMode ? 'bg-green-950/60' : 'bg-green-50'
            : '';

          const lineNumCls = `select-none w-8 shrink-0 text-right mr-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`;

          return (
            <div key={i} className={`grid grid-cols-2 divide-x ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {/* Left cell */}
              <div className={`flex ${cellBase} ${leftBg}`}>
                <span className={lineNumCls}>{pair.left ? i + 1 : ''}</span>
                <span className={`flex-1 ${!pair.left ? (darkMode ? 'text-gray-700' : 'text-gray-200') : pair.left.type === 'removed' && !isMixed ? 'text-red-700' : darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {!pair.left
                    ? '\u00a0'
                    : isMixed && leftParts
                    ? <SideParts parts={leftParts} />
                    : pair.left.text || '\u00a0'}
                </span>
              </div>

              {/* Right cell */}
              <div className={`flex ${cellBase} ${rightBg}`}>
                <span className={lineNumCls}>{pair.right ? i + 1 : ''}</span>
                <span className={`flex-1 ${!pair.right ? (darkMode ? 'text-gray-700' : 'text-gray-200') : pair.right.type === 'added' && !isMixed ? 'text-green-700' : darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {!pair.right
                    ? '\u00a0'
                    : isMixed && rightParts
                    ? <SideParts parts={rightParts} />
                    : pair.right.text || '\u00a0'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Stats bar ────────────────────────────────────────────── */

function StatsBar({ original, modified, darkMode }) {
  const stats = useMemo(() => {
    const lineDiff = computeLineDiff(original, modified);
    return computeStats(lineDiff);
  }, [original, modified]);

  const pill = (label, count, color) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-60" />
      {count} {label}
    </span>
  );

  return (
    <div className={`flex flex-wrap items-center gap-2 px-1 py-1`}>
      {pill('added', stats.added, darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700')}
      {pill('removed', stats.removed, darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')}
      {pill('unchanged', stats.unchanged, darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}
    </div>
  );
}

/* ── Main export ──────────────────────────────────────────── */

export default function DiffViewer({ original, modified, viewMode, darkMode }) {
  const wordParts = useMemo(() => computeWordDiff(original, modified), [original, modified]);
  const hasChanges = wordParts.some((p) => p.added || p.removed);

  if (!original && !modified) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Diff Result
          {!hasChanges && (
            <span className={`ml-3 text-sm font-normal px-2 py-0.5 rounded-full ${darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'}`}>
              Identical
            </span>
          )}
        </h2>
        <StatsBar original={original} modified={modified} darkMode={darkMode} />
      </div>

      {viewMode === 'inline' ? (
        <InlineDiff parts={wordParts} darkMode={darkMode} />
      ) : (
        <SideBySideDiff original={original} modified={modified} darkMode={darkMode} />
      )}
    </section>
  );
}
