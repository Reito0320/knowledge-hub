// @vitest-environment jsdom
import { fireEvent, render, screen, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SecondSection from '@/app/(main)/post/SecondSection';
vi.mock('@/app/api/post/images/fetch', () => ({ uploadPostImage: vi.fn() }));
afterEach(cleanup);
const setup = () => {
  render(<SecondSection storageKey="test-draft" />);
  const editor = screen.getByLabelText('記事本文') as HTMLTextAreaElement;
  fireEvent.change(editor, { target: { value: '選択した文字' } });
  editor.focus();
  editor.setSelectionRange(0, editor.value.length);
  return editor;
};
describe('editor toolbar', () => {
  it('prefills link label, focuses destination, and inserts a link', async () => {
    const editor = setup();
    fireEvent.click(screen.getByLabelText('リンクのMarkdownを挿入'));
    expect((screen.getByLabelText('リンク名') as HTMLInputElement).value).toBe('選択した文字');
    expect(document.activeElement).toBe(screen.getByLabelText('リンク先'));
    fireEvent.change(screen.getByLabelText('リンク先'), { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByText('適用'));
    expect(editor.value).toBe('[選択した文字](https://example.com)');
    await waitFor(() => expect(document.activeElement).toBe(editor));
  });
  it('uses plain text when destination is empty', () => {
    const editor = setup();
    fireEvent.click(screen.getByLabelText('リンクのMarkdownを挿入'));
    fireEvent.click(screen.getByText('適用'));
    expect(editor.value).toBe('選択した文字');
  });
  it('inserts a fenced block for a single line', () => {
    const editor = setup();
    fireEvent.click(screen.getByLabelText('コードブロックのMarkdownを挿入'));
    expect(editor.value).toBe('```\n選択した文字\n```\n\n');
  });
});
