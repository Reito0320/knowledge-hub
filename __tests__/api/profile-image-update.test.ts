import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findUniqueUser: vi.fn(),
  updateUser: vi.fn(),
  createViewUrl: vi.fn(),
  deleteImageObject: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock('@/lib/AWS/profile-image-upload', () => ({
  getProfileImageExtension: vi.fn(),
  isProfileImageContentType: vi.fn(),
  checkFileSize: vi.fn(),
}));

vi.mock('@/lib/AWS/s3-presigned-url', () => ({
  createProfileImageUploadUrl: vi.fn(),
  createProfileImageViewUrl: mocks.createViewUrl,
  deleteProfileImageObject: mocks.deleteImageObject,
  PROFILE_IMAGE_UPLOAD_URL_EXPIRES_IN: 60,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.findUniqueUser,
      update: mocks.updateUser,
    },
  },
}));

import { PATCH } from '@/app/api/users/profile/image-upload/route';

const userId = 'user-123';
const previousObjectKey = `profile-images/${userId}/previous.png`;
const nextObjectKey = `profile-images/${userId}/next.png`;

const createRequest = (objectKey: string) =>
  new NextRequest('http://localhost/api/users/profile/image-upload', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectKey }),
  });

describe('PATCH /api/users/profile/image-upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue(userId);
    mocks.findUniqueUser.mockResolvedValue({
      photoObjectKey: previousObjectKey,
    });
    mocks.updateUser.mockResolvedValue({ id: userId });
    mocks.createViewUrl.mockResolvedValue('https://example.com/profile.png');
    mocks.deleteImageObject.mockResolvedValue(true);
  });

  it('DBを新しいobjectKeyへ更新してから以前の画像を削除する', async () => {
    const response = await PATCH(createRequest(nextObjectKey));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.photoUrl).toBe('https://example.com/profile.png');
    expect(mocks.updateUser).toHaveBeenCalledWith({
      where: { id: userId },
      data: { photoObjectKey: nextObjectKey },
    });
    expect(mocks.deleteImageObject).toHaveBeenCalledWith(previousObjectKey);
  });

  it('同じobjectKeyが再送された場合はDB更新とS3削除を行わない', async () => {
    mocks.findUniqueUser.mockResolvedValue({ photoObjectKey: nextObjectKey });

    const response = await PATCH(createRequest(nextObjectKey));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.photoUrl).toBe('https://example.com/profile.png');
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(mocks.deleteImageObject).not.toHaveBeenCalled();
  });

  it('以前の画像を削除できなくても画像更新は成功として返す', async () => {
    mocks.deleteImageObject.mockResolvedValue(false);

    const response = await PATCH(createRequest(nextObjectKey));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.photoUrl).toBe('https://example.com/profile.png');
    expect(mocks.updateUser).toHaveBeenCalledOnce();
  });
});
