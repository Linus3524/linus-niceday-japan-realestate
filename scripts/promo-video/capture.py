# 從正式站截取電腦版（1920×1080）與手機版（390×844 @2x）畫面，存到 shots/，供 storyboard.html 使用
import asyncio, os
from playwright.async_api import async_playwright

URL = "https://linus-niceday-japan-realestate.vercel.app/"
OUT = os.path.join(os.path.dirname(__file__), "shots")

async def shot(page, name, wait=1200):
    await page.wait_for_timeout(wait)
    await page.screenshot(path=os.path.join(OUT, f"{name}.png"))
    print("saved", name)

async def menu(page, text):
    await page.locator(".stage-menu-item", has_text=text).first.click()

async def desktop(p):
    browser = await p.chromium.launch()
    ctx = await browser.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=1, locale="zh-TW")
    page = await ctx.new_page()
    await page.goto(URL, wait_until="networkidle")
    await page.wait_for_timeout(2500)
    await page.locator('[aria-label="暫停場景輪播"]').click()
    for i, key in enumerate(["orange", "lemon", "apple", "grape"]):
        if i:
            await page.locator('[aria-label="下一個場景"]').click()
        await shot(page, f"d_home_{key}", 2200)
    # 回到第一個場景
    await page.locator('[aria-label="下一個場景"]').click()
    await page.wait_for_timeout(1800)
    # 首頁往下捲的關於 Linus
    await page.evaluate("document.querySelector('.desktop-stage').scrollTo(0, document.getElementById('about-linus').offsetTop + document.querySelector('.stage-hero').offsetHeight)")
    await shot(page, "d_about", 1500)
    await page.evaluate("const s=document.querySelector('.desktop-stage'); s.scrollTo(0, s.scrollTop + 900)")
    await shot(page, "d_about2", 1200)
    await page.evaluate("document.querySelector('.desktop-stage').scrollTo(0, 0)")
    await page.wait_for_timeout(800)
    # 租屋
    await menu(page, "租屋指南"); await shot(page, "d_rent_preface", 1500)
    await page.locator(".chapter-rail-item", has_text="申請與交屋").click()
    await page.locator(".section-tab", has_text="申請方式").click()
    await shot(page, "d_rent_routes", 1200)
    await page.locator(".chapter-rail-item", has_text="初期費用").click()
    await shot(page, "d_rent_fees", 1200)
    # 買房
    await menu(page, "買房置產"); await shot(page, "d_buy_preface", 1500)
    await page.locator(".chapter-rail-item", has_text="稅務與流程").click()
    await shot(page, "d_buy_process", 1200)
    # 費用試算與圖紙分析
    await menu(page, "費用試算"); await shot(page, "d_calc_rent", 1800)
    await page.get_by_role("button", name="物件圖紙分析").first.click()
    await shot(page, "d_calc_listing", 1500)
    # AI 顧問
    await menu(page, "AI 顧問"); await shot(page, "d_chat", 1500)
    # Threads
    await page.locator(".stage-tags button", has_text="Threads").click()
    await shot(page, "d_threads", 6000)
    # 居住人格診斷
    await menu(page, "居住人格診斷"); await shot(page, "d_quiz", 6000)
    # 聯絡
    await menu(page, "聯絡諮詢"); await shot(page, "d_contact", 1500)
    await browser.close()

async def mobile(p):
    browser = await p.chromium.launch()
    ctx = await browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, locale="zh-TW",
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
    page = await ctx.new_page()
    await page.goto(URL, wait_until="networkidle")
    await shot(page, "m_home", 2500)
    for name, text in [("m_rent", "租屋指南"), ("m_buy", "買房置產"), ("m_calc", "費用試算"), ("m_chat", "AI 顧問")]:
        try:
            await page.locator(".mobile-dock").get_by_text(text, exact=True).first.click()
            await shot(page, name, 1800)
            await page.evaluate("window.scrollBy(0, 600)")
            await shot(page, name + "_2", 900)
            await page.evaluate("window.scrollTo(0, 0)")
        except Exception as e:
            print("skip", name, e)
    await browser.close()

async def main():
    async with async_playwright() as p:
        await desktop(p)
        await mobile(p)

asyncio.run(main())
