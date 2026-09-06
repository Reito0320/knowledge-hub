import { describe, expect, it } from 'vitest';
import { getSignupErrorMessage } from '@/app/(main)/signup/signup';

describe('getSignupErrorMessage', () => {
  it('登録済みメールアドレスをログインへ案内する', () => {
    const error = new Error();
    error.name = 'UsernameExistsException';
    expect(getSignupErrorMessage(error)).toContain('登録済み');
  });

  it('パスワード条件エラーを説明する', () => {
    const error = new Error();
    error.name = 'InvalidPasswordException';
    expect(getSignupErrorMessage(error)).toContain('パスワード');
  });
});
