'use client';

import { useEffect, useReducer, useRef, type ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import type { SessionUser } from '@/lib/api/auth/session/fetch';
import { fetchPatchUserProfile } from '@/lib/api/users/profile/fetch';
import { requestProfileImageUpload, saveProfileImageObjectKey, uploadProfileImageToS3 } from '@/lib/api/users/profile/image-upload/fetch';

type Form = { profileName: string; profileJobTitle: string; profileBio: string; selectedDepartmentId: string };
type State = Form & {
  ownerId: string | null;
  isProfileModalOpen: boolean;
  isSavingProfile: boolean;
  profileImageFile: File | null;
  profilePreviewUrl: string | null;
  profileNotice: string;
  failedImageUrl: string | null;
  departments: { id: string; name: string }[];
};
const initialState: State = {
  ownerId: null, isProfileModalOpen: false, isSavingProfile: false,
  profileName: '', profileJobTitle: '', profileBio: '', selectedDepartmentId: '',
  profileImageFile: null, profilePreviewUrl: null, profileNotice: '', failedImageUrl: null, departments: [],
};
type Action =
  | { type: 'open'; user: SessionUser }
  | { type: 'close' }
  | { type: 'field'; field: keyof Form; value: string }
  | { type: 'image'; file: File; url: string }
  | { type: 'notice'; message: string }
  | { type: 'departments'; departments: State['departments'] }
  | { type: 'imageError'; url: string | null }
  | { type: 'saving' }
  | { type: 'finished' };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'open': return { ...state, ownerId: action.user.id, isProfileModalOpen: true,
      profileName: action.user.name, profileJobTitle: action.user.jobTitle ?? '', profileBio: action.user.bio ?? '',
      selectedDepartmentId: action.user.department?.id ?? '', profileImageFile: null, profilePreviewUrl: null, profileNotice: '' };
    case 'close': return { ...state, isProfileModalOpen: false, profileImageFile: null, profilePreviewUrl: null };
    case 'field': return { ...state, [action.field]: action.value };
    case 'image': return { ...state, profileImageFile: action.file, profilePreviewUrl: action.url, profileNotice: 'プレビューを確認して保存してください。' };
    case 'notice': return { ...state, profileNotice: action.message };
    case 'departments': return { ...state, departments: action.departments };
    case 'imageError': return { ...state, failedImageUrl: action.url };
    case 'saving': return { ...state, isSavingProfile: true, profileNotice: '' };
    case 'finished': return { ...state, isSavingProfile: false };
  }
}

export function useProfileEditor(user: SessionUser | null, setUser: (user: SessionUser) => void) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saving = useRef(false);
  const activeUser = useRef(user?.id);
  useEffect(() => {
    activeUser.current = user?.id;
    return () => { activeUser.current = undefined; };
  }, [user?.id]);

  useEffect(() => {
    if (!state.isProfileModalOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving.current) dispatch({ type: 'close' });
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [state.isProfileModalOpen]);

  useEffect(() => {
    if (!state.isProfileModalOpen || state.departments.length) return;
    const abort = new AbortController();
    void fetch('/api/departments', { signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('部署一覧を取得できませんでした。');
        return response.json() as Promise<{ departments: State['departments'] }>;
      })
      .then(({ departments }) => { if (!abort.signal.aborted) dispatch({ type: 'departments', departments }); })
      .catch(() => { if (!abort.signal.aborted) dispatch({ type: 'notice', message: '部署一覧を取得できませんでした。' }); });
    return () => abort.abort();
  }, [state.isProfileModalOpen, state.departments.length]);

  useEffect(() => {
    const url = state.profilePreviewUrl;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [state.profilePreviewUrl]);

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      dispatch({ type: 'notice', message: '画像ファイルを選択してください。' });
    } else if (file.size > 5 * 1024 * 1024) {
      dispatch({ type: 'notice', message: '画像は5MB以下にしてください。' });
    } else {
      dispatch({ type: 'image', file, url: URL.createObjectURL(file) });
    }
  };

  const handleSaveProfileImage = async () => {
    if (saving.current || !user) return;
    saving.current = true;
    dispatch({ type: 'saving' });
    try {
      const { user: updated } = await fetchPatchUserProfile(state.profileName, state.profileJobTitle, state.profileBio, state.selectedDepartmentId);
      if (activeUser.current !== user.id) return;
      setUser(updated);
      if (state.profileImageFile) {
        const upload = await requestProfileImageUpload(state.profileImageFile);
        if (!upload) throw new Error('S3から署名付きURLを取得できませんでした。');
        if (activeUser.current !== user.id) return;
        await uploadProfileImageToS3(upload.uploadUrl, state.profileImageFile);
        if (activeUser.current !== user.id) return;
        const photoUrl = await saveProfileImageObjectKey(upload.objectKey);
        if (activeUser.current !== user.id) return;
        setUser({ ...updated, photoUrl });
      }
      dispatch({ type: 'imageError', url: null });
      dispatch({ type: 'close' });
      toast.success('プロフィールを更新しました。');
    } catch (error) {
      if (activeUser.current === user.id) dispatch({ type: 'notice', message: error instanceof Error ? error.message : 'プロフィールを更新できませんでした。' });
    } finally {
      saving.current = false;
      dispatch({ type: 'finished' });
    }
  };

  return {
    ...state,
    isProfileModalOpen: state.isProfileModalOpen && state.ownerId === user?.id,
    hasImageError: Boolean(user?.photoUrl && state.failedImageUrl === user.photoUrl),
    setHasImageError: () => dispatch({ type: 'imageError', url: user?.photoUrl ?? null }),
    setIsProfileModalOpen: (open: boolean) => {
      if (saving.current) return;
      if (open && user) dispatch({ type: 'open', user });
      else dispatch({ type: 'close' });
    },
    setProfileName: (value: string) => dispatch({ type: 'field', field: 'profileName', value }),
    setProfileJobTitle: (value: string) => dispatch({ type: 'field', field: 'profileJobTitle', value }),
    setProfileBio: (value: string) => dispatch({ type: 'field', field: 'profileBio', value }),
    setSelectedDepartmentId: (value: string) => dispatch({ type: 'field', field: 'selectedDepartmentId', value }),
    handleProfileImageChange, handleSaveProfileImage,
  };
}
