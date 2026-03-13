import * as Diff from 'diff';

/**
 * Compute word-level diff between two strings.
 * Returns an array of { value, added, removed } parts.
 */
export function computeWordDiff(original, modified) {
  return Diff.diffWords(original, modified);
}

/**
 * Compute line-level diff between two strings.
 * Returns an array of { value, added, removed } parts.
 */
export function computeLineDiff(original, modified) {
  return Diff.diffLines(original, modified);
}

/**
 * Build side-by-side line pairs from a line diff.
 * Each pair: { left: { text, type }, right: { text, type } }
 * type: 'added' | 'removed' | 'unchanged'
 */
export function buildSideBySidePairs(diffResult) {
  const pairs = [];

  for (const part of diffResult) {
    const lines = part.value.split('\n');
    // Remove trailing empty string caused by trailing newline
    if (lines[lines.length - 1] === '') lines.pop();

    if (part.added) {
      lines.forEach((line) =>
        pairs.push({ left: null, right: { text: line, type: 'added' } })
      );
    } else if (part.removed) {
      lines.forEach((line) =>
        pairs.push({ left: { text: line, type: 'removed' }, right: null })
      );
    } else {
      lines.forEach((line) =>
        pairs.push({
          left: { text: line, type: 'unchanged' },
          right: { text: line, type: 'unchanged' },
        })
      );
    }
  }

  // Pair up consecutive removed/added orphans into side-by-side rows
  const paired = [];
  let i = 0;
  while (i < pairs.length) {
    const cur = pairs[i];
    if (cur.left && cur.left.type === 'removed' && cur.right === null) {
      // Look ahead for a matching added
      if (i + 1 < pairs.length && pairs[i + 1].left === null && pairs[i + 1].right) {
        paired.push({ left: cur.left, right: pairs[i + 1].right });
        i += 2;
        continue;
      }
    }
    paired.push(cur);
    i++;
  }

  return paired;
}

/**
 * Compute inline word-level diff for a single changed line pair.
 * Returns { leftParts, rightParts } each being arrays of { text, highlight }
 */
export function computeIntraLineDiff(leftText, rightText) {
  const parts = Diff.diffWords(leftText ?? '', rightText ?? '');
  const leftParts = [];
  const rightParts = [];

  for (const part of parts) {
    if (part.removed) {
      leftParts.push({ text: part.value, highlight: 'removed' });
    } else if (part.added) {
      rightParts.push({ text: part.value, highlight: 'added' });
    } else {
      leftParts.push({ text: part.value, highlight: null });
      rightParts.push({ text: part.value, highlight: null });
    }
  }

  return { leftParts, rightParts };
}

/**
 * Count statistics: added lines, removed lines, unchanged lines.
 */
export function computeStats(diffResult) {
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const part of diffResult) {
    const count = part.value.split('\n').filter((l) => l !== '' || part.value === '\n').length;
    if (part.added) added += count;
    else if (part.removed) removed += count;
    else unchanged += count;
  }

  return { added, removed, unchanged };
}
