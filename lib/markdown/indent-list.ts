/** Tab/Shift+Tabで選択中のリスト行を一段階ずつ字下げする。 */
export const indentMarkdownList = (content: string, start: number, end: number, outdent = false) => {
  const lineStart = start === 0 ? 0 : content.lastIndexOf('\n', start - 1) + 1;
  const lastPosition = end > start && content[end - 1] === '\n' ? end - 1 : end;
  const newline = content.indexOf('\n', lastPosition);
  const lineEnd = newline < 0 ? content.length : newline;
  const lines = content.slice(lineStart, lineEnd).split('\n');
  if (!lines.every((line) => /^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/.test(line))) return null;
  const changes = lines.map((line) => outdent ? -Math.min(line.match(/^(?: {1,4}|\t)/)?.[0].length ?? 0, 4) : 4);
  if (outdent && changes.every((change) => change === 0)) return null;
  const replacement = lines.map((line, i) => outdent ? line.slice(-changes[i]) : '    ' + line).join('\n');
  return {
    content: content.slice(0, lineStart) + replacement + content.slice(lineEnd),
    cursor: Math.max(lineStart, start + changes[0]),
    end: Math.max(lineStart, end + changes.reduce((sum, change) => sum + change, 0)),
  };
};
