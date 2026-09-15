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

it('highlights syntax while preserving code and leaving inline code alone', () => {
  const { container } = render(<MarkdownRenderer content={'`const`\n\n```ts\nclass User { name: string = "Alice"; age = 42; }\n```'} />);
  expect(container.querySelector('pre .hljs-keyword')?.textContent).toBe('class');
  expect(container.querySelector('pre .hljs-title.class_')?.textContent).toBe('User');
  expect(container.querySelector('pre .hljs-string')?.textContent).toBe('"Alice"');
  expect(container.querySelector('pre .hljs-number')?.textContent).toBe('42');
  expect(container.querySelector('p code .hljs-keyword')).toBeNull();
});

it('renders single newlines and Markdown inside safe collapsible content', () => {
  const { container } = render(<MarkdownRenderer content={'先頭\n次の行\n\n<details>\n<summary>補足</summary>\n\n**内容**\n続き\n\n</details>\n\n<script>alert(1)</script>'} />);
  expect(container.querySelector('p br')).not.toBeNull();
  expect(container.querySelector('details summary')?.textContent).toBe('補足');
  expect(container.querySelector('details strong')?.textContent).toBe('内容');
  expect(container.querySelector('details br')).not.toBeNull();
  expect(container.querySelector('script')).toBeNull();
});

it('renders unknown code languages without crashing', () => {
  const { container } = render(<MarkdownRenderer content={'```unknown-language\nhello\n```'} />);
  expect(container.querySelector('pre')?.textContent).toBe('hello\n');
});
