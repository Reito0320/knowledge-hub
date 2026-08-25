/* middlewareとしてこれ以降のapi通信をtoken認証済みでないとできなくさせる。 */
import { RequestHandler } from 'express';
import { verifySessionToken } from '../lib/session.ts';

export const requireSession: RequestHandler = async (req, res, next) => {
  try {
    /* cookieから自前Tokenを取得 */
    const sessionToken = req.cookies.session as string | undefined;
    if (!sessionToken)
      return res.status(401).json({
        message: 'session cookieがありません。',
      });
    /* tokenを検証し、照合したらuserIdを返却 */
    const userId = await verifySessionToken(sessionToken);
    /* 次に実行されるRouterへ検証済みuserIdを渡す。 */
    res.locals.userId = userId;

    /* Middlewareを通過して次の処理へ進む */
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      message: 'sessionが無効かまたは期限切れです',
    });
  }
};
