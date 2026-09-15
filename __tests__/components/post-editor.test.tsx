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

it('toggles preview with Command+Enter and Ctrl+Enter without changing text', async () => {
  const editor = setup();
  fireEvent.keyDown(editor, { key: 'Enter', metaKey: true });
  expect(screen.queryByLabelText('記事本文')).toBeNull();
  expect(screen.getByText('⌘ / Ctrl + Enter：編集・プレビュー切替')).toBeTruthy();
  fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });
  expect((screen.getByLabelText('記事本文') as HTMLTextAreaElement).value).toBe('選択した文字');
});

it('preserves editor scrolling after formatting a selection', async () => {
  const editor = setup();
  editor.scrollTop = 480;
  editor.scrollLeft = 20;
  const focus = vi.spyOn(editor, 'focus');
  fireEvent.click(screen.getByLabelText('太字のMarkdownを挿入'));
  await waitFor(() => expect(focus).toHaveBeenCalledWith({ preventScroll: true }));
  expect(editor.value).toBe('**選択した文字**');
  expect(editor.scrollTop).toBe(480);
  expect(editor.scrollLeft).toBe(20);
});

it('uses selected text as the toggle title and keeps following content outside', async () => {
  const editor = setup();
  fireEvent.click(screen.getByLabelText('折りたたみのMarkdownを挿入'));
  expect(editor.value).toContain('<summary>選択した文字</summary>\n\n折りたたむ内容');
  await waitFor(() => expect(editor.value.slice(editor.selectionStart, editor.selectionEnd)).toBe('折りたたむ内容'));
  fireEvent.change(editor, { target: { value: editor.value + '後続の本文' } });
  fireEvent.click(screen.getByText('プレビュー'));
  expect(screen.getByText('選択した文字').tagName).toBe('SUMMARY');
  expect(screen.getByText('折りたたむ内容').closest('details')).not.toBeNull();
  expect(screen.getByText('後続の本文').closest('details')).toBeNull();
});

it('copies the current title, excerpt, and raw Markdown together', async () => {
  setup();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  fireEvent.change(screen.getByLabelText(/タイトル/), { target: { value: 'テスト記事' } });
  fireEvent.change(screen.getByLabelText(/記事の概要/), { target: { value: '概要です' } });
  fireEvent.click(screen.getByText('記事を一括コピー'));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('# テスト記事\n\n概要です\n\n選択した文字'));
  expect(await screen.findByText('記事をコピーしました')).toBeTruthy();
});

 it('preserves existing surrounding paragraphs when inserting a toggle', () => {
  const editor = setup();
  fireEvent.change(editor, { target: { value: '前の本文\n選択タイトル\n後の本文\nさらに後の本文' } });
  editor.setSelectionRange(5, 12);
  fireEvent.click(screen.getByLabelText('折りたたみのMarkdownを挿入'));
  fireEvent.click(screen.getByText('プレビュー'));
  expect(screen.getByText('前の本文').closest('details')).toBeNull();
  expect(screen.getByText(/さらに後の本文/).closest('details')).toBeNull();
});
