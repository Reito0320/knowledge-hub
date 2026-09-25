// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PostEditorProvider, usePostEditor } from '@/lib/post/editor/post-editor-context';

const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), router: { push: vi.fn(), refresh: vi.fn() } }));
vi.mock('@/lib/api/post/fetch', () => ({ fetchPostCreate: mocks.create }));
vi.mock('@/lib/api/post/[postId]/fetch', () => ({ fetchUpdatePost: mocks.update }));
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function Fields() {
  const { draft, setTitle, setContent } = usePostEditor();
  return <><input aria-label="title" value={draft.title} onChange={(event) => setTitle(event.target.value)} />
    <textarea aria-label="content" value={draft.content} onChange={(event) => setContent(event.target.value)} /></>;
}
function SaveButtons() {
  const { savePost, saveStatus, notice } = usePostEditor();
  return <><button onClick={() => void savePost(false)}>draft</button>
    <button onClick={() => void savePost(true)}>publish</button>
    <output>{saveStatus}</output><p>{notice}</p></>;
}
function setup(postId?: string) {
  return render(<PostEditorProvider postId={postId}><Fields /><SaveButtons /></PostEditorProvider>);
}
const advance = () => act(async () => { await vi.advanceTimersByTimeAsync(1500); });

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  mocks.create.mockResolvedValue({ postId: 'created-1', message: '保存しました' });
  mocks.update.mockResolvedValue({ postId: 'created-1', message: '保存しました' });
  window.history.replaceState(null, '', '/post/new');
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

it('shares the latest draft with sibling save buttons without localStorage or DOM events', async () => {
  setup();
  const storage = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  fireEvent.change(screen.getByLabelText('title'), { target: { value: '最新タイトル' } });
  await act(async () => { fireEvent.click(screen.getByText('draft')); });
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ title: '最新タイトル' }), { publish: false });
  expect(mocks.router.push).toHaveBeenCalledWith('/post/created-1');
  expect(storage).not.toHaveBeenCalled();
  storage.mockRestore();
});

it('does not save initial rendering, then debounces edits and changes from POST to PATCH', async () => {
  setup();
  await advance();
  expect(mocks.create).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('title'), { target: { value: 'a' } });
  fireEvent.change(screen.getByLabelText('title'), { target: { value: 'ab' } });
  await advance();
  expect(mocks.create).toHaveBeenCalledTimes(1);
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'ab' }), { publish: false });
  expect(window.location.pathname).toBe('/post/created-1/edit');
  fireEvent.change(screen.getByLabelText('content'), { target: { value: '続き' } });
  await advance();
  expect(mocks.update).toHaveBeenCalledWith('created-1', expect.objectContaining({ title: 'ab', content: '続き' }), { publish: false });
});

it('queues edits made during the first save and never creates a second post', async () => {
  let finish!: (result: { postId: string; message: string }) => void;
  mocks.create.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  setup();
  fireEvent.change(screen.getByLabelText('title'), { target: { value: '最初' } });
  await advance();
  fireEvent.change(screen.getByLabelText('title'), { target: { value: '保存中の変更' } });
  await advance();
  expect(mocks.create).toHaveBeenCalledTimes(1);
  await act(async () => { finish({ postId: 'created-1', message: '保存しました' }); });
  await advance();
  expect(mocks.update).toHaveBeenCalledWith('created-1', expect.objectContaining({ title: '保存中の変更' }), { publish: false });
});

it('blocks publishing incomplete content and allows a manual retry after a save failure', async () => {
  setup();
  fireEvent.click(screen.getByText('publish'));
  expect(mocks.create).not.toHaveBeenCalled();
  expect(screen.getByText('error')).toBeTruthy();
  mocks.create.mockRejectedValueOnce(new Error('保存失敗'));
  fireEvent.change(screen.getByLabelText('title'), { target: { value: '下書き' } });
  await act(async () => { fireEvent.click(screen.getByText('draft')); });
  expect(screen.getByText('保存失敗')).toBeTruthy();
  await advance();
  expect(mocks.create).toHaveBeenCalledTimes(1);
  await act(async () => { fireEvent.click(screen.getByText('draft')); });
  expect(screen.getByText('saved')).toBeTruthy();
});

it('cancels pending autosave when the editor unmounts', async () => {
  const { unmount } = setup();
  fireEvent.change(screen.getByLabelText('title'), { target: { value: '未保存' } });
  unmount();
  await advance();
  expect(mocks.create).not.toHaveBeenCalled();
});
