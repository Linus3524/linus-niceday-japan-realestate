import { completeAuth } from "../src/lib/moushikomi/drive.js";

/**
 * Google Drive 授權完成後，Google 會帶 code 與 state 導回這裡（OAuth redirect URI）。
 * 驗證碼（state）由後台按「連結 Google Drive」時產生，10 分鐘內有效、只能用一次。
 */
export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex");
  const code = typeof req.query?.code === "string" ? req.query.code : "";
  const state = typeof req.query?.state === "string" ? req.query.state : "";
  const back = (result: string) => {
    res.statusCode = 302;
    res.setHeader("Location", `/#admin/apply?drive=${result}`);
    res.end();
  };
  if (req.query?.error || !code || !state) return back("cancelled");
  try {
    await completeAuth(code, state);
    return back("ok");
  } catch (error) {
    console.error("drive auth failed:", (error as Error)?.message);
    return back("failed");
  }
}
