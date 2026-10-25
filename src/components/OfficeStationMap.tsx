// 聯絡頁（電腦版）的公司地圖：跟圖紙分析的周邊地圖同一套 UI——上方切換列（Google Maps 實景／車站地圖）、
// 綠色圓形定位釘固定標出公司、車站用同款深色膠囊標籤；滑過右側車站清單會高亮該站並打開說明。預設先顯示 Google Maps。
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Compass, ExternalLink } from "lucide-react";
import { buildLocationPinHtml, LOCATION_PIN_TIP_OFFSET } from "../lib/mapPins";

// 座標來源：專案自己的 /api/listing-location（以「東京都千代田区東神田2-6-2」查得）；岩本町為都營新宿線站位。
export const OFFICE_COORD: [number, number] = [35.695713, 139.780121];
const STATION_COORDS: Record<string, [number, number]> = {
  秋葉原: [35.6984622, 139.775504],
  神田: [35.6937148, 139.7708898],
  馬喰町: [35.6933714, 139.7824352],
  浅草橋: [35.6974062, 139.7846842],
  岩本町: [35.695534, 139.775892],
  東日本橋: [35.6921239, 139.7848848],
  小伝馬町: [35.6907525, 139.7784526],
};

export interface OfficeStation {
  key: string;
  line: string;
  name: string;
  walk: string;
  coord: [number, number];
}

/** 「JR山手線／秋葉原駅 徒歩11分」→ 路線、站名、步行時間；查不到座標的站略過不畫。 */
export function parseOfficeStations(lines: string[]): OfficeStation[] {
  return lines.flatMap(text => {
    const match = text.match(/^(.+?)／(.+?)駅\s*(.*)$/);
    if (!match) return [];
    const [, line, name, walk] = match;
    const coord = STATION_COORDS[name];
    return coord ? [{ key: text, line, name, walk, coord }] : [];
  });
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!));

// 公司定位釘：跟圖紙分析「本物件」共用綠色圓形釘，下方再固定一個公司名稱標籤，不必點開也看得到。
const officeIcon = L.divIcon({
  className: "custom-pin-container",
  // 公司名稱膠囊放在尖端下方（膠囊自帶 translate(-50%,-50%)，中心距座標 17px，跟尖端留一點空隙）
  html: `${buildLocationPinHtml("🏢")}<div class="custom-capsule-badge" style="position: absolute; top: 17px; left: 0; background: #00a174; color: #fff; border-color: #fff;">株式会社世嘉 Seika</div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  popupAnchor: [0, -(42 + LOCATION_PIN_TIP_OFFSET)],
});

export function OfficeStationMap({ stations, activeKey }: { stations: OfficeStation[]; activeKey: string | null }) {
  const [mapMode, setMapMode] = useState<"google" | "interactive">("google");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const fitAll = (map: L.Map) => map.fitBounds(L.latLngBounds([OFFICE_COORD, ...stations.map(s => s.coord)]), { padding: [35, 35], maxZoom: 16 });

  useEffect(() => {
    if (mapMode !== "interactive" || !containerRef.current) return;
    const map = L.map(containerRef.current, { center: OFFICE_COORD, zoom: 16, scrollWheelZoom: false });
    mapRef.current = map;
    // 地圖框跟著版面變高變矮時，Leaflet 要重算尺寸，否則多出來的區域不會補圖磚
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(containerRef.current);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker(OFFICE_COORD, { icon: officeIcon, zIndexOffset: 2000 }).addTo(map)
      .bindPopup(`<div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; padding: 4px 2px;"><strong style="color: #00a174; font-size: 13px;">📍 株式会社世嘉 Seika</strong><br/><span style="color: #333; font-weight: 500;">東京都千代田区東神田 2-6-2 タカラビル 9 階</span></div>`);

    markersRef.current.clear();
    for (const station of stations) {
      const label = `${escapeHtml(station.name)}駅`;
      const icon = L.divIcon({
        className: "custom-pin-container",
        html: `<div class="custom-capsule-badge station-capsule"><span class="pin-icon">🚉</span><span class="pin-text">${label}</span></div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -16],
      });
      const marker = L.marker(station.coord, { icon }).addTo(map)
        .bindPopup(`<div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; padding: 4px 2px;"><strong style="font-size: 13px; color: #1A2A22;">🚉 ${label}</strong><br/><span style="color: #66736C;">${escapeHtml(station.line)}</span><div style="margin-top: 4px; padding: 3px 6px; background: #e6f6f1; color: #00a174; font-weight: bold;">到公司${escapeHtml(station.walk.replace("徒歩", "步行 "))}</div></div>`);
      markersRef.current.set(station.key, marker);
    }

    // 切換到車站地圖時容器才剛掛上，Leaflet 量到的尺寸可能是 0，fitBounds 會失效；等一個影格再重新量、再全覽
    const frame = requestAnimationFrame(() => { map.invalidateSize(); fitAll(map); });
    return () => { cancelAnimationFrame(frame); resizeObserver.disconnect(); map.remove(); mapRef.current = null; markersRef.current.clear(); };
  }, [stations, mapMode]);

  // 右側清單滑過：跟圖紙分析一樣用 is-active-marker 高亮並打開說明，不平移地圖
  useEffect(() => {
    markersRef.current.forEach((marker, key) => {
      const active = key === activeKey;
      marker.getElement()?.classList.toggle("is-active-marker", active);
      marker.setZIndexOffset(active ? 1500 : 0);
      if (active) marker.openPopup();
    });
    if (!activeKey) mapRef.current?.closePopup();
  }, [activeKey, mapMode]);

  const modeButton = (mode: "google" | "interactive", label: string) => (
    <button
      type="button"
      onClick={() => setMapMode(mode)}
      className={`px-3 py-1.5 text-xs font-bold transition-all ${mapMode === mode ? "bg-[#F0FAF6] text-[#00A174] shadow-[inset_0_-2px_0_#00A174]" : "bg-white text-[#66736C] hover:bg-[#F5F8F6]"}`}
    >
      {label}
    </button>
  );

  return (
    // 外框可以被父層拉高（聯絡頁桌機：跟右邊車站清單同高），沒有被拉高時地圖維持 288px
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2 border border-[#DDE3DF] bg-[#FAFCFB] p-2">
        <div className="flex items-center gap-2">
          {modeButton("google", "Google Maps 實景")}
          {modeButton("interactive", "周邊車站地圖")}
        </div>
        <a href="https://maps.app.goo.gl/g8nHrYEdikTvvCLWA" target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#00a174] underline underline-offset-2">
          <span>開啟 Google 地圖</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="relative z-0 min-h-72 w-full flex-1 overflow-hidden border border-[#DDE3DF] bg-[#EEF2F0]">
        {mapMode === "interactive" ? (
          <>
            <div ref={containerRef} className="h-full w-full" />
            <button
              type="button"
              onClick={() => mapRef.current && fitAll(mapRef.current)}
              className="absolute right-2 top-2 z-[500] flex items-center gap-1 border border-[#DDE3DF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3F5147] shadow-sm hover:bg-[#F5F8F6]"
            >
              <Compass className="h-3 w-3 text-[#00a174]" />
              <span>全覽居中</span>
            </button>
          </>
        ) : (
          <iframe
            title="Seika Office Google Map"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E5%8D%83%E4%BB%A3%E7%94%B0%E5%8C%BA%E6%9D%B1%E7%A5%9E%E7%94%B02-6-2&hl=zh-TW&z=16&output=embed"
          />
        )}
      </div>
    </div>
  );
}
