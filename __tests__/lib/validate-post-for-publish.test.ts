import { describe, expect, it } from 'vitest';
import { validatePostForPublish } from '@/lib/post/validate-post-for-publish';

describe('validatePostForPublish', () => {
  it('タイトルと本文が空なら両方をエラーにする', () => {
    const result = validatePostForPublish({ title: ' ', content: '' });
    expect(result.filter((item) => !item.valid).map((item) => item.field)).toEqual([
      'title',
      'content',
    ]);
  });

  it('タイトルと本文があれば公開条件を満たす', () => {
    expect(
      validatePostForPublish({ title: 'タイトル', content: '本文' }).every(
        (item) => item.valid,
      ),
    ).toBe(true);
  });
});
