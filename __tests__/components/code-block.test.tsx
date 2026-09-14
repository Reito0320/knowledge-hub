// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import MarkdownRenderer from '@/comp/MarkdownRender';
afterEach(cleanup);
it('copies only the code of the chosen block, preserving whitespace', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  render(<MarkdownRenderer content={'`inline`\n\n```js\n  const a = 1;\n\n  run(a);\n```\n\n```\nsecond\n```'} />);
  expect(screen.getAllByLabelText('コードをコピー')).toHaveLength(2);
  fireEvent.click(screen.getAllByLabelText('コードをコピー')[0]);
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('  const a = 1;\n\n  run(a);\n'));
  expect(await screen.findByText('コピーしました')).toBeTruthy();
});
it('reports clipboard failure without claiming success', async () => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
  render(<MarkdownRenderer content={'```\ncode\n```'} />);
  fireEvent.click(screen.getByLabelText('コードをコピー'));
  expect(await screen.findByText('コピーできませんでした。コードを選択してコピーしてください。')).toBeTruthy();
});
