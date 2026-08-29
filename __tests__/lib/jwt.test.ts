import { encrypt, decrypt } from '@/lib/jwt';
import { describe, it, expect } from 'vitest';

describe('JWT Session', () => {
  it('userIdをJWTにして、再度取り出せる', async () => {
    const testSub = 'cognito-sub-123';
    const token = await encrypt({
      userId: testSub,
    });

    const payload = await decrypt(token);

    expect(payload?.userId).toBe(testSub);
  });
  it('改ざんされたJWTは検証に失敗する。', async () => {
    const testSub = 'cognito-sub-123';
    const token = await encrypt({
      userId: testSub,
    });

    const tamperedToken = token + 'tampered';

    await expect(decrypt(tamperedToken)).rejects.toThrow('decrypt error');
  });
});
