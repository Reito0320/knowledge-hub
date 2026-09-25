import type { PostData } from '@/lib/api/post/fetch';

export type EditorState = {
  draft: PostData;
  revision: number;
  savedRevision: number;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  isSaving: boolean;
  notice: string;
};

export function createEditorState(initialData?: PostData): EditorState {
  return {
    draft: initialData ?? {
      title: '', excerpt: '', content: '', category: 'TECH',
      visibility: 'ORGANIZATION', tags: [],
    },
    revision: 0, savedRevision: 0, saveStatus: 'idle', isSaving: false, notice: '',
  };
}

type EditorAction =
  | { type: 'change'; update: (draft: PostData) => PostData }
  | { type: 'saving'; manual: boolean }
  | { type: 'saved'; revision: number; message: string }
  | { type: 'failed'; message: string };

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'change': {
      const draft = action.update(state.draft);
      if (Object.keys(draft).every((key) => draft[key as keyof PostData] === state.draft[key as keyof PostData])) return state;
      return { ...state, draft, revision: state.revision + 1,
        saveStatus: state.saveStatus === 'saving' ? 'saving' : 'idle', notice: '' };
    }
    case 'saving':
      return { ...state, saveStatus: 'saving', isSaving: action.manual, notice: '' };
    case 'saved':
      return { ...state, saveStatus: 'saved', isSaving: false, savedRevision: action.revision, notice: action.message };
    case 'failed':
      return { ...state, saveStatus: 'error', isSaving: false, notice: action.message };
  }
}
