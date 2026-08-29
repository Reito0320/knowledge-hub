type ListContinuation = { content: string; cursor: number } | null;

/** Enterを押した行がMarkdownリストなら、次の行の記号・連番を補完する。 */
export const continueMarkdownList = (
  content: string,
  selectionStart: number,
  selectionEnd: number,
): ListContinuation => {
  if (selectionStart !== selectionEnd) return null;

  const lineStart = content.lastIndexOf('\n', selectionStart - 1) + 1;
  const currentLine = content.slice(lineStart, selectionStart);
  const unordered = currentLine.match(/^(\s*)([-*+])\s+(.*)$/);
  const ordered = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
  const match = unordered ?? ordered;
  if (!match) return null;

  const [wholeLine, indent, marker, body] = match;

  // 空のリスト項目でEnterを押した場合は、記号を消してリストを終了する。
  if (!body.trim()) {
    const nextContent =
      content.slice(0, lineStart) + content.slice(lineStart + wholeLine.length);
    return { content: nextContent, cursor: lineStart };
  }

  const nextMarker = ordered ? `${Number(marker) + 1}.` : marker;
  const insertion = `\n${indent}${nextMarker} `;
  return {
    content:
      content.slice(0, selectionStart) +
      insertion +
      content.slice(selectionStart),
    cursor: selectionStart + insertion.length,
  };
};
