import { describe, expect, it } from 'vitest';
import { continueMarkdownList } from '@/lib/markdown/continue-list';

describe('continueMarkdownList', () => {
  it('箇条書きの次の行へ同じ記号を補完する', () => {
    expect(continueMarkdownList('- 最初', 4, 4)).toEqual({
      content: '- 最初\n- ',
      cursor: 7,
    });
  });

  it('番号付きリストの番号を1つ進める', () => {
    expect(continueMarkdownList('3. 項目', 5, 5)).toEqual({
      content: '3. 項目\n4. ',
      cursor: 9,
    });
  });

  it('空の項目ではリストを終了する', () => {
    expect(continueMarkdownList('- ', 2, 2)).toEqual({
      content: '',
      cursor: 0,
    });
  });
});
