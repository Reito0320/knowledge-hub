import { describe, expect, it } from 'vitest';
import { indentMarkdownList } from '@/lib/markdown/indent-list';
import { continueMarkdownList } from '@/lib/markdown/continue-list';

describe('list nesting', () => {
  it('indents a child and continues at that depth', () => {
    const text = '- parent\n- child';
    const result = indentMarkdownList(text, text.length, text.length)!;
    expect(result.content).toBe('- parent\n    - child');
    expect(continueMarkdownList(result.content, result.cursor, result.end)?.content).toBe('- parent\n    - child\n    - ');
    expect(indentMarkdownList(result.content, result.cursor, result.end, true)?.content).toBe(text);
  });
  it('indents multiple selected lines without changing the following line', () => {
    expect(indentMarkdownList('- a\n- b\ntext', 0, 8)).toEqual({ content: '    - a\n    - b\ntext', cursor: 4, end: 16 });
  });
  it('keeps normal Tab navigation outside lists and on unindented Shift+Tab', () => {
    expect(indentMarkdownList('text', 4, 4)).toBeNull();
    expect(indentMarkdownList('- a', 3, 3, true)).toBeNull();
  });
});
