import { useMemo } from 'react';
import {
  computeWordDiff,
  computeLineDiff,
  buildSideBySidePairs,
  computeIntraLineDiff,
  computeStats,
} from '../utils/diffUtils';

/* ── Inline word span ─────────────────────────────────────── */

function InlineSpan({ text, type }) {
  const cls =
    type === 'added'
      ? 'bg-emerald-200 dark:bg-emerald-800/50 text-emerald-900 dark:text-emerald-200 rounded-sm'
      : type === 'removed'
      ? 'bg-rose-200 dark:bg-rose-800/50 text-rose-900 dark:text-rose-200 line-through rounded-sm'
      : '';
  return <span className={cls}>{text}</span>;
}

/* ── Inline diff view ─────────────────────────────────────── */

function InlineDiff({ parts, darkMode }) {
  const lines = useMemo(() => {
    const tokens = [];
    for (const part of parts) {
      const type = part.added ? 'added' : part.removed ? 'removed' : null;
      const segments = part.value.split('\n');
      segments.forEach((seg, i) => {
        if (i > 0) tokens.push({ newline: true });
        if (seg) tokens.push({ text: seg, type });
      });
    }
    const result = [[]];
    for (const tok of tokens) {
      if (tok.newline) result.push([]);
      else result[result.length - 1].push(tok);
    }
    return result;
  }, [parts]);

  if (parts.length === 0) return null;

  return (
    <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-zinc-600' : 'border-slate-200'}`}>
      <div className={`px-4 py-2 text-[11px] font-semibold tracking-wide uppercase border-b ${
        darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-400' : 'bg-stone-50 border-slate-100 text-slate-400'
      }`}>
        Inline Diff
      </div>
      <div className={`overflow-auto max-h-[560px] ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
        {lines.map((line, li) => {
          const hasAdded = line.some((t) => t.type === 'added');
          const hasRemoved = line.some((t) => t.type === 'removed');
          let rowBg = '';
          if (hasAdded && !hasRemoved) rowBg = darkMode ? 'bg-emerald-950/40' : 'bg-emerald-50';
          else if (hasRemoved && !hasAdded) rowBg = darkMode ? 'bg-rose-950/40' : 'bg-rose-50';
          else if (hasAdded && hasRemoved) rowBg = darkMode ? 'bg-amber-950/40' : 'bg-amber-50';

          return (
            <div key={li} className={`font-mono text-[13px] leading-[1.6] px-4 py-px flex whitespace-pre-wrap break-all ${rowBg}`}>
              <span className={`select-none w-8 shrink-0 text-right mr-4 text-[11px] pt-px ${darkMode ? 'text-zinc-500' : 'text-slate-300'}`}>
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

function SideParts({ parts, side }) {
  return (
    <>
      {parts.map((p, i) =>
        p.highlight ? (
          <mark
            key={i}
            className={
              p.highlight === 'added'
                ? 'bg-emerald-300 dark:bg-emerald-700/60 text-emerald-900 dark:text-emerald-100 rounded-sm'
                : 'bg-rose-300 dark:bg-rose-700/60 text-rose-900 dark:text-rose-100 rounded-sm'
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

  return (
    <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-zinc-600' : 'border-slate-200'}`}>
      {/* Column headers */}
      <div className={`grid grid-cols-2 text-[11px] font-semibold tracking-wide uppercase border-b ${
        darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-stone-50 border-slate-100'
      }`}>
        <div className={`px-10 py-2 border-r ${darkMode ? 'border-zinc-800 text-zinc-500' : 'border-slate-100 text-slate-400'}`}>
          Original
        </div>
        <div className={`px-10 py-2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
          Modified
        </div>
      </div>

      <div className={`overflow-auto max-h-[560px] ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
        {pairs.map((pair, i) => {
          const isMixed = pair.left?.type === 'removed' && pair.right?.type === 'added';
          let leftParts = null;
          let rightParts = null;
          if (isMixed) {
            const intra = computeIntraLineDiff(pair.left.text, pair.right.text);
            leftParts = intra.leftParts;
            rightParts = intra.rightParts;
          }

          const leftBg = !pair.left
            ? darkMode ? 'bg-zinc-900/50' : 'bg-slate-50/80'
            : pair.left.type === 'removed'
            ? darkMode ? 'bg-rose-950/40' : 'bg-rose-50'
            : '';

          const rightBg = !pair.right
            ? darkMode ? 'bg-zinc-900/50' : 'bg-slate-50/80'
            : pair.right.type === 'added'
            ? darkMode ? 'bg-emerald-950/40' : 'bg-emerald-50'
            : '';

          const lineNumCls = `select-none w-8 shrink-0 text-right mr-3 text-[11px] pt-px ${
            darkMode ? 'text-zinc-500' : 'text-slate-300'
          }`;

          const cellBase = 'font-mono text-[13px] leading-[1.6] px-3 py-px whitespace-pre-wrap break-all min-w-0 flex-1 flex';

          return (
            <div key={i} className={`grid grid-cols-2 divide-x ${darkMode ? 'divide-zinc-600' : 'divide-slate-100'}`}>
              <div className={`${cellBase} ${leftBg}`}>
                <span className={lineNumCls}>{pair.left ? i + 1 : ''}</span>
                <span className={`flex-1 ${
                  !pair.left
                    ? darkMode ? 'text-zinc-800' : 'text-slate-200'
                    : pair.left.type === 'removed' && !isMixed
                    ? darkMode ? 'text-rose-300' : 'text-rose-700'
                    : darkMode ? 'text-zinc-100' : 'text-slate-700'
                }`}>
                  {!pair.left
                    ? '\u00a0'
                    : isMixed && leftParts
                    ? <SideParts parts={leftParts} side="left" />
                    : pair.left.text || '\u00a0'}
                </span>
              </div>

              <div className={`${cellBase} ${rightBg}`}>
                <span className={lineNumCls}>{pair.right ? i + 1 : ''}</span>
                <span className={`flex-1 ${
                  !pair.right
                    ? darkMode ? 'text-zinc-800' : 'text-slate-200'
                    : pair.right.type === 'added' && !isMixed
                    ? darkMode ? 'text-emerald-300' : 'text-emerald-700'
                    : darkMode ? 'text-zinc-100' : 'text-slate-700'
                }`}>
                  {!pair.right
                    ? '\u00a0'
                    : isMixed && rightParts
                    ? <SideParts parts={rightParts} side="right" />
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

  const pill = (label, count, colorClass) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${colorClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {count} {label}
    </span>
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {pill('added', stats.added, darkMode ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}
      {pill('removed', stats.removed, darkMode ? 'bg-rose-950/60 text-rose-400' : 'bg-rose-50 text-rose-600')}
      {pill('unchanged', stats.unchanged, darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500')}
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
        <div className="flex items-center gap-2">
          <h2 className={`text-sm font-semibold ${darkMode ? 'text-zinc-100' : 'text-slate-700'}`}>
            Diff Result
          </h2>
          {!hasChanges && (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              darkMode ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              Identical
            </span>
          )}
        </div>
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
