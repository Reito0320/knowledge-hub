import { SessionUser } from '../../auth/session/fetch';

export const fetchPatchUserProfile = async (
  profileName: string,
  profileJobTitle: string,
  profileBio: string,
  selectedDepartmentId: string,
) => {
  const res = await fetch('/api/users/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: profileName,
      jobTitle: profileJobTitle,
      bio: profileBio,
      departmentId: selectedDepartmentId || null,
    }),
  });
  if (!res.ok) throw new Error('プロフィールを更新できませんでした。');

  const data = (await res.json()) as { user: SessionUser };
  return data;
};
