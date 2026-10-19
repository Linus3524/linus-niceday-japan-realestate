# 逐格錄製動畫頁：每格呼叫 render(t) 後截圖。
# 用法：python render.py preview 1.6,7.2,13   → 只輸出指定秒數的預覽圖到 preview/
#       python render.py full 48              → 輸出整支影片的所有影格到 frames/
import asyncio, http.server, os, sys, threading
from functools import partial
from playwright.async_api import async_playwright

V = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(V, "..", ".."))
FPS = 30
PORT = 8765

def serve_repo_root():
    # 從專案根目錄提供檔案，storyboard.html 才讀得到 public/ 裡的 logo 與角色圖（遮罩圖不能用 file:// 載入）
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd

async def main(times, outdir, quality=90):
    os.makedirs(outdir, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        await page.goto(f"http://127.0.0.1:{PORT}/scripts/promo-video/storyboard.html", wait_until="networkidle")
        await page.evaluate("document.fonts.ready")
        await page.wait_for_timeout(1500)
        for i, t in enumerate(times):
            await page.evaluate(f"render({t})")
            await page.screenshot(path=os.path.join(outdir, f"f{i:05d}.jpg"), type="jpeg", quality=quality)
            if i % 150 == 0:
                print("frame", i, "t=", round(t, 2), flush=True)
        await b.close()

if __name__ == "__main__":
    serve_repo_root()
    if sys.argv[1] == "preview":
        ts = [float(x) for x in sys.argv[2].split(",")]
        asyncio.run(main(ts, os.path.join(V, "preview")))
    else:
        total = float(sys.argv[2])
        n = int(total * FPS)
        asyncio.run(main([i / FPS for i in range(n)], os.path.join(V, "frames")))
