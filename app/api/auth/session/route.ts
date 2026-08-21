import { NextRequest, NextResponse } from 'next/server';

export const POST = async (req: NextRequest) => {
  try {
    /* カスタムfetch経由で送られてきた通信かを確認 */
    const authorization = req.headers.get('authorization');
    /* カスタムfetchの通信の中にtokenが確認できなかった場合の分岐 */
    if (!authorization?.startsWith('Bearer '))
      return NextResponse.json(
        { message: '認証トークンがありませんでした。' },
        { status: 401 },
      );

    /* headerの中からtokenを切り出す */
    const accessToken = authorization.slice('Bearer '.length);
    // const payload = await vari
  } catch (error) {}
};
