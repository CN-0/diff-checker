/* ── Language definitions ──────────────────────────────────────
   line     : array of line-comment tokens (checked longest-first)
   block    : array of [start, end] block-comment token pairs
   strings  : characters that open/close string literals
   brace    : eligible for bracket-depth auto re-indent
   indentSensitive : whitespace is semantically significant (skip reindent)
   debug    : regex matched against a *trimmed* single line to drop it
------------------------------------------------------------------ */

export const LANGUAGES = {
  javascript: { name: 'JavaScript / TypeScript', ext: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'], line: ['//'], block: [['/*', '*/']], strings: ['"', "'", '`'], brace: true, debug: /^(console\.(log|debug|info|warn|error)\(.*\);?|debugger;?)$/ },
  java: { name: 'Java', ext: ['java'], line: ['//'], block: [['/*', '*/']], strings: ['"', "'"], brace: true, debug: /^System\.out\.println?\(.*\);?$/ },
  csharp: { name: 'C#', ext: ['cs'], line: ['//'], block: [['/*', '*/']], strings: ['"', "'"], brace: true, debug: /^Console\.Write(Line)?\(.*\);?$/ },
  c: { name: 'C', ext: ['c', 'h'], line: ['//'], block: [['/*', '*/']], strings: ['"', "'"], brace: true, debug: /^printf\(.*\);?$/ },
  cpp: { name: 'C++', ext: ['cpp', 'cc', 'hpp', 'cxx'], line: ['//'], block: [['/*', '*/']], strings: ['"', "'"], brace: true, debug: /^(printf|std::cout\s*<<)\(?.*\)?;?$/ },
  go: { name: 'Go', ext: ['go'], line: ['//'], block: [['/*', '*/']], strings: ['"', '`'], brace: true, debug: /^fmt\.Println?\(.*\)$/ },
  rust: { name: 'Rust', ext: ['rs'], line: ['//'], block: [['/*', '*/']], strings: ['"'], brace: true, debug: /^println!\(.*\);?$/ },
  php: { name: 'PHP', ext: ['php'], line: ['//', '#'], block: [['/*', '*/']], strings: ['"', "'"], brace: true, debug: /^(var_dump|print_r|echo)\(.*\);?$/ },
  swift: { name: 'Swift', ext: ['swift'], line: ['//'], block: [['/*', '*/']], strings: ['"'], brace: true, debug: /^print\(.*\)$/ },
  kotlin: { name: 'Kotlin', ext: ['kt', 'kts'], line: ['//'], block: [['/*', '*/']], strings: ['"'], brace: true, debug: /^println\(.*\)$/ },
  dart: { name: 'Dart', ext: ['dart'], line: ['//'], block: [['/*', '*/']], strings: ['"', "'"], brace: true, debug: /^print\(.*\);?$/ },
  css: { name: 'CSS / SCSS / LESS', ext: ['css', 'scss', 'less'], line: [], block: [['/*', '*/']], strings: ['"', "'"], brace: true },
  python: { name: 'Python', ext: ['py'], line: ['#'], block: [], strings: ['"', "'"], brace: false, indentSensitive: true, debug: /^print\(.*\)$/ },
  ruby: { name: 'Ruby', ext: ['rb'], line: ['#'], block: [['=begin', '=end']], strings: ['"', "'"], brace: false, indentSensitive: true, debug: /^puts\s+.*$/ },
  shell: { name: 'Shell / Bash', ext: ['sh', 'bash', 'zsh'], line: ['#'], block: [], strings: ['"', "'"], brace: false, indentSensitive: true, debug: /^echo\s+.*$/ },
  yaml: { name: 'YAML', ext: ['yaml', 'yml'], line: ['#'], block: [], strings: ['"', "'"], brace: false, indentSensitive: true },
  perl: { name: 'Perl', ext: ['pl', 'pm'], line: ['#'], block: [], strings: ['"', "'"], brace: true },
  powershell: { name: 'PowerShell', ext: ['ps1'], line: ['#'], block: [['<#', '#>']], strings: ['"', "'"], brace: true, debug: /^Write-(Host|Output)\s+.*$/ },
  r: { name: 'R', ext: ['r'], line: ['#'], block: [], strings: ['"', "'"], brace: true, debug: /^print\(.*\)$/ },
  sql: { name: 'SQL', ext: ['sql'], line: ['--'], block: [['/*', '*/']], strings: ["'"], brace: false },
  lua: { name: 'Lua', ext: ['lua'], line: ['--'], block: [['--[[', ']]']], strings: ['"', "'"], brace: false, debug: /^print\(.*\)$/ },
  html: { name: 'HTML / XML', ext: ['html', 'htm', 'xml'], line: [], block: [['<!--', '-->']], strings: [], brace: true },
  json: { name: 'JSON', ext: ['json'], line: [], block: [], strings: ['"'], brace: true },
  generic: { name: 'Generic (C-style)', ext: [], line: ['//'], block: [['/*', '*/']], strings: ['"', "'"], brace: true },
};

export const LANGUAGE_LIST = Object.entries(LANGUAGES).map(([id, cfg]) => ({ id, name: cfg.name }));

export function detectLanguage(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  for (const [id, cfg] of Object.entries(LANGUAGES)) {
    if (cfg.ext.includes(ext)) return id;
  }
  return 'generic';
}

/* ── Comment stripping (string-literal aware) ──────────────────
   Walks the source char-by-char tracking whether it's inside a
   string literal so comment tokens inside strings are left alone.
   Not a full parser — regex-literal edge cases in JS-like
   languages can still misfire, but this is far safer than a
   naive global regex replace.
------------------------------------------------------------------ */
export function stripComments(code, langId) {
  const cfg = LANGUAGES[langId] || LANGUAGES.generic;
  const lineTokens = [...(cfg.line || [])].sort((a, b) => b.length - a.length);
  const blockTokens = cfg.block || [];
  const strChars = cfg.strings || [];
  if (!lineTokens.length && !blockTokens.length) return { code, removed: 0 };

  let i = 0;
  const n = code.length;
  let out = '';
  let removed = 0;
  let inString = null;

  while (i < n) {
    if (inString) {
      const ch = code[i];
      if (ch === '\\' && i + 1 < n) { out += ch + code[i + 1]; i += 2; continue; }
      out += ch;
      if (ch === inString) inString = null;
      i++;
      continue;
    }

    if (strChars.includes(code[i])) {
      inString = code[i];
      out += code[i];
      i++;
      continue;
    }

    const block = blockTokens.find(([start]) => code.startsWith(start, i));
    if (block) {
      const [start, end] = block;
      const close = code.indexOf(end, i + start.length);
      i = close === -1 ? n : close + end.length;
      removed++;
      continue;
    }

    const line = lineTokens.find((tok) => code.startsWith(tok, i));
    if (line) {
      let end = code.indexOf('\n', i);
      if (end === -1) end = n;
      i = end;
      removed++;
      continue;
    }

    out += code[i];
    i++;
  }

  return { code: out, removed };
}

/* ── Bracket-depth re-indent (best-effort, brace languages only) ─ */
function reindentByBrackets(lines, unit) {
  let depth = 0;
  return lines.map((raw) => {
    const trimmed = raw.trim();
    if (trimmed === '') return '';

    let leadingClose = 0;
    while (leadingClose < trimmed.length && /[}\])]/.test(trimmed[leadingClose])) leadingClose++;
    const thisDepth = Math.max(depth - leadingClose, 0);

    let delta = 0;
    for (const ch of trimmed) {
      if (ch === '{' || ch === '[' || ch === '(') delta++;
      else if (ch === '}' || ch === ']' || ch === ')') delta--;
    }
    depth = Math.max(depth + delta, 0);

    return unit.repeat(thisDepth) + trimmed;
  });
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

// Detects how the source file encodes one indent level, so resizing
// (e.g. 2-wide -> 4-wide) is done by nesting level, not raw column count.
function detectSourceIndent(lines) {
  const spaceCounts = [];
  for (const line of lines) {
    const leading = line.match(/^[ \t]*/)[0];
    if (!leading) continue;
    if (leading.includes('\t')) return { usesTabs: true };
    spaceCounts.push(leading.length);
  }
  if (!spaceCounts.length) return { usesTabs: false, spaceUnit: null };
  let unit = spaceCounts[0];
  for (const c of spaceCounts) unit = gcd(unit, c);
  return { usesTabs: false, spaceUnit: unit || null };
}

function convertIndent(line, mode, targetSize, sourceIndent) {
  const leading = line.match(/^[ \t]*/)[0];
  if (!leading) return line;
  const rest = line.slice(leading.length);

  let levels;
  if (sourceIndent.usesTabs) {
    levels = leading.split('\t').length - 1;
  } else {
    const unit = sourceIndent.spaceUnit || targetSize;
    levels = Math.round(leading.length / unit);
  }

  const newIndent = mode === 'tabs' ? '\t'.repeat(levels) : ' '.repeat(levels * targetSize);
  return newIndent + rest;
}

/* ── Main pipeline ──────────────────────────────────────────── */
export function cleanCode(input, opts) {
  const {
    lang = 'generic',
    removeComments = true,
    blankLines = 'collapse',   // 'keep' | 'collapse' | 'remove'
    collapseMax = 1,
    trimTrailing = true,
    removeDebug = false,
    reindent = false,
    indentMode = 'keep',       // 'keep' | 'spaces' | 'tabs'
    indentSize = 2,
    lineEndings = 'lf',        // 'lf' | 'crlf' | 'keep'
  } = opts;

  const cfg = LANGUAGES[lang] || LANGUAGES.generic;
  const charsBefore = input.length;
  const linesBefore = input ? input.split(/\r\n|\r|\n/).length : 0;

  let code = input.replace(/\r\n|\r/g, '\n');
  let commentsRemoved = 0;

  if (removeComments) {
    const res = stripComments(code, lang);
    code = res.code;
    commentsRemoved = res.removed;
  }

  let lines = code.split('\n');

  if (trimTrailing) lines = lines.map((l) => l.replace(/[ \t]+$/, ''));

  if (indentMode !== 'keep') {
    const sourceIndent = detectSourceIndent(lines);
    lines = lines.map((l) => convertIndent(l, indentMode, indentSize, sourceIndent));
  }

  let debugRemoved = 0;
  if (removeDebug && cfg.debug) {
    lines = lines.filter((l) => {
      const isDebug = cfg.debug.test(l.trim());
      if (isDebug) debugRemoved++;
      return !isDebug;
    });
  }

  if (reindent && cfg.brace && !cfg.indentSensitive) {
    const unit = indentMode === 'tabs' ? '\t' : ' '.repeat(indentSize);
    lines = reindentByBrackets(lines, unit);
  }

  let blankLinesRemoved = 0;
  if (blankLines === 'remove') {
    const before = lines.length;
    lines = lines.filter((l) => l.trim() !== '');
    blankLinesRemoved = before - lines.length;
  } else if (blankLines === 'collapse') {
    const result = [];
    let run = 0;
    for (const l of lines) {
      if (l.trim() === '') {
        run++;
        if (run <= collapseMax) result.push(l);
        else blankLinesRemoved++;
      } else {
        run = 0;
        result.push(l);
      }
    }
    lines = result;
  }

  let output = lines.join('\n');
  if (output.length > 0 && !output.endsWith('\n')) output += '\n';

  if (lineEndings === 'crlf') output = output.replace(/\n/g, '\r\n');

  return {
    output,
    stats: {
      linesBefore,
      linesAfter: output ? output.split(/\r\n|\n/).length : 0,
      charsBefore,
      charsAfter: output.length,
      commentsRemoved,
      blankLinesRemoved,
      debugRemoved,
    },
  };
}
