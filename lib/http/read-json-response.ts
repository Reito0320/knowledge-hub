/**
 * APIレスポンスをJSONとして読み込む。
 * Next.jsやホスティング基盤がプレーンテキストの500エラーを返した場合も、
 * JSON.parseのSyntaxErrorではなく、確認可能なHTTPエラーへ変換する。
 */
export const readJsonResponse = async <ResponseBody>(response: Response) => {
  const responseText = await response.text();

  try {
    return JSON.parse(responseText) as ResponseBody;
  } catch {
    const responseSummary = responseText || 'レスポンス本文がありません。';

    throw new Error(
      `APIがJSON以外を返しました。HTTP ${response.status}: ${responseSummary}`,
    );
  }
};
