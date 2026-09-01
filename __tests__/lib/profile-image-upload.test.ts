import { describe, expect, it } from 'vitest';
import {
  getProfileImageExtension,
  isProfileImageContentType,
  MAX_PROFILE_IMAGE_SIZE,
} from '@/lib/AWS/profile-image-upload';

describe('profile image upload validation', () => {
  it('許可した画像形式だけを受け付ける', () => {
    expect(isProfileImageContentType('image/png')).toBe(true);
    expect(isProfileImageContentType('image/svg+xml')).toBe(false);
  });

  it('Content-Typeから安全な拡張子を決める', () => {
    expect(getProfileImageExtension('image/jpeg')).toBe('jpg');
    expect(getProfileImageExtension('image/webp')).toBe('webp');
  });

  it('最大サイズは5MBである', () => {
    expect(MAX_PROFILE_IMAGE_SIZE).toBe(5 * 1024 * 1024);
  });
});
