// Leaflet 綠色圓形定位釘（圖紙分析「本物件」、聯絡頁「公司」共用）。
// 白框跟車站膠囊同為 1.5px；尖角是「白色三角在後、同斜率內縮 1.5px 的綠色三角在前」疊出等寬白邊，
// 綠色三角上緣伸進圓圈裡，圓圈底部的白框才不會在圓與尖角之間露出一條白縫；
// 整顆往上多移一個尖角高度，讓尖端剛好落在座標點上。
const PIN_SIZE = 40;
const TIP_HEIGHT = 7.5; // 尖角露出圓圈下緣的高度（白邊三角）

export const LOCATION_PIN_TIP_OFFSET = TIP_HEIGHT;

export function buildLocationPinHtml(symbol: string) {
  return `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${PIN_SIZE}px; height: ${PIN_SIZE}px; background: #00a174; color: white; border-radius: 50%; border: 1.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.35); font-size: 19px; cursor: pointer; pointer-events: auto; transform: translate(-50%, calc(-100% - ${TIP_HEIGHT}px));">
      ${symbol}
      <div style="position: absolute; bottom: -${TIP_HEIGHT + 1.5}px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 7.5px solid transparent; border-right: 7.5px solid transparent; border-top: ${TIP_HEIGHT + 1.5}px solid #ffffff;"></div>
      <div style="position: absolute; bottom: -6.7px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 7.66px solid transparent; border-right: 7.66px solid transparent; border-top: 9.2px solid #00a174;"></div>
    </div>
  `;
}
