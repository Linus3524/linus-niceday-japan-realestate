import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Building2,
  ExternalLink,
  GraduationCap,
  HeartPulse,
  Layers,
  MapPin,
  Maximize2,
  Pill,
  ShoppingBag,
  Store,
  TrainFront,
  Trees,
} from "lucide-react";
import type { ListingLocationContext, ListingAmenity, ListingStationWalk } from "../lib/listingLocation";

interface ListingLocationMapProps {
  context: ListingLocationContext;
}

const CATEGORY_CONFIG: Record<
  ListingAmenity["category"],
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  convenience: { label: "超商", icon: "🏪", bg: "#e6f6f1", text: "#007d5a", border: "#9ee2cf" },
  supermarket: { label: "超市", icon: "🛒", bg: "#FFF4E5", text: "#B76E00", border: "#FFD599" },
  pharmacy: { label: "藥妝", icon: "💊", bg: "#EBF5FF", text: "#1E65B8", border: "#B9DCFF" },
  medical: { label: "醫療", icon: "🏥", bg: "#FDE8E8", text: "#C81E1E", border: "#F8B4B4" },
  school: { label: "學校", icon: "🏫", bg: "#F3E8FF", text: "#7E22CE", border: "#D8B4FE" },
  park: { label: "公園", icon: "🌳", bg: "#EAF5EA", text: "#2B8A3E", border: "#B2E2B2" },
};

export function ListingLocationMap({ context }: ListingLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [mapMode, setMapMode] = useState<"interactive" | "google">("interactive");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedAmenityName, setSelectedAmenityName] = useState<string | null>(null);

  const { coordinate, matchedAddress, stationWalks, amenities } = context;

  useEffect(() => {
    if (mapMode !== "interactive" || !mapContainerRef.current) return;

    // 清除舊實例（若存在）
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [coordinate.lat, coordinate.lon],
      zoom: 16,
      scrollWheelZoom: false,
    });
    mapInstanceRef.current = map;

    // OpenStreetMap 圖資
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersRef.current = layerGroup;

    // 1. 本物件 Marker（中央醒目綠色房屋圖標）
    const propertyIcon = L.divIcon({
      className: "custom-property-pin",
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          background: #007d5a;
          color: white;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          font-size: 18px;
        ">
          🏠
          <div style="
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid #007d5a;
          "></div>
        </div>
      `,
      iconSize: [38, 44],
      iconAnchor: [19, 44],
      popupAnchor: [0, -44],
    });

    const propertyMarker = L.marker([coordinate.lat, coordinate.lon], { icon: propertyIcon })
      .addTo(layerGroup)
      .bindPopup(
        `<div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #007d5a; font-size: 13px;">📍 本物件所在地</strong><br/>
          <span style="color: #333;">${matchedAddress}</span>
        </div>`
      );

    // 2. 車站 Marker
    stationWalks.forEach(walk => {
      if (!walk.lat || !walk.lon) return;
      const stationIcon = L.divIcon({
        className: "custom-station-pin",
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: #1A2A22;
            color: white;
            padding: 3px 8px;
            border-radius: 14px;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
          ">
            <span>🚆</span>
            <span>${walk.station}駅 (${walk.normalMinutes}分)</span>
          </div>
        `,
        iconSize: [120, 26],
        iconAnchor: [60, 26],
        popupAnchor: [0, -26],
      });

      L.marker([walk.lat, walk.lon], { icon: stationIcon })
        .addTo(layerGroup)
        .bindPopup(
          `<div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
            <strong style="font-size: 13px;">🚆 ${walk.station}駅</strong><br/>
            <span>真實路徑：約 ${walk.distanceMeters.toLocaleString("zh-TW")}m</span><br/>
            <span>快步：${walk.fastMinutes} 分｜常態：${walk.normalMinutes} 分｜慢步：${walk.slowMinutes} 分</span>
          </div>`
        );
    });

    // 3. 周邊生活機能 Marker
    amenities.forEach(amenity => {
      if (!amenity.lat || !amenity.lon) return;
      if (activeCategory !== "all" && amenity.category !== activeCategory) return;

      const conf = CATEGORY_CONFIG[amenity.category] || {
        label: "設施",
        icon: "📍",
        bg: "#F5F8F6",
        text: "#1A2A22",
        border: "#DDE3DF",
      };

      const amenityIcon = L.divIcon({
        className: "custom-amenity-pin",
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 3px;
            background: ${conf.bg};
            color: ${conf.text};
            border: 1.5px solid ${conf.border};
            padding: 2px 6px;
            border-radius: 10px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
          ">
            <span>${conf.icon}</span>
            <span>${amenity.name.slice(0, 8)}</span>
          </div>
        `,
        iconSize: [80, 22],
        iconAnchor: [40, 22],
        popupAnchor: [0, -22],
      });

      L.marker([amenity.lat, amenity.lon], { icon: amenityIcon })
        .addTo(layerGroup)
        .bindPopup(
          `<div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
            <span style="display: inline-block; padding: 1px 5px; font-size: 10px; font-weight: bold; background: ${conf.bg}; color: ${conf.text}; border-radius: 3px;">
              ${conf.label}
            </span><br/>
            <strong style="font-size: 13px; color: #1A2A22;">${amenity.name}</strong><br/>
            <span style="color: #666;">距離物件約 ${amenity.distanceMeters} 公尺（步行約 ${Math.ceil(amenity.distanceMeters / 75)} 分）</span><br/>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(amenity.name + " " + matchedAddress)}" target="_blank" rel="noreferrer" style="color: #007d5a; font-weight: bold; text-decoration: underline; font-size: 11px; display: inline-block; margin-top: 4px;">在 Google Maps 查看</a>
          </div>`
        );
    });

    // 聚焦並調整視野
    const points: L.LatLngExpression[] = [[coordinate.lat, coordinate.lon]];
    stationWalks.forEach(w => {
      if (w.lat && w.lon) points.push([w.lat, w.lon]);
    });
    amenities.forEach(a => {
      if (a.lat && a.lon && (activeCategory === "all" || a.category === activeCategory)) {
        points.push([a.lat, a.lon]);
      }
    });

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [35, 35], maxZoom: 16 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinate.lat, coordinate.lon, matchedAddress, stationWalks, amenities, mapMode, activeCategory]);

  const categories = [
    { id: "all", label: "全部設施", count: amenities.length },
    { id: "convenience", label: "超商", count: amenities.filter(a => a.category === "convenience").length },
    { id: "supermarket", label: "超市", count: amenities.filter(a => a.category === "supermarket").length },
    { id: "pharmacy", label: "藥妝", count: amenities.filter(a => a.category === "pharmacy").length },
    { id: "medical", label: "醫療", count: amenities.filter(a => a.category === "medical").length },
    { id: "school", label: "學校", count: amenities.filter(a => a.category === "school").length },
    { id: "park", label: "公園", count: amenities.filter(a => a.category === "park").length },
  ].filter(c => c.id === "all" || c.count > 0);

  const filteredAmenities = activeCategory === "all"
    ? amenities
    : amenities.filter(a => a.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* 頂部地圖工具列 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border border-[#DDE3DF] bg-[#FAFCFB] p-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMapMode("interactive")}
            className={`px-3 py-1.5 text-xs font-bold transition-all ${
              mapMode === "interactive"
                ? "bg-[#1A2A22] text-white shadow-sm"
                : "bg-white text-[#66736C] hover:bg-[#F2F5F3]"
            }`}
          >
            📍 設施標籤地圖
          </button>
          <button
            type="button"
            onClick={() => setMapMode("google")}
            className={`px-3 py-1.5 text-xs font-bold transition-all ${
              mapMode === "google"
                ? "bg-[#1A2A22] text-white shadow-sm"
                : "bg-white text-[#66736C] hover:bg-[#F2F5F3]"
            }`}
          >
            🗺️ Google Maps 實景
          </button>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${coordinate.lat},${coordinate.lon}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs font-bold text-[#007d5a] underline underline-offset-2 hover:text-[#005a41]"
        >
          <span>在 Google 地圖全螢幕開啟</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* 地圖主體容器 */}
      <div className="relative h-72 w-full overflow-hidden border border-[#1A2A22] bg-[#E8ECE9] md:h-96">
        {mapMode === "interactive" ? (
          <div ref={mapContainerRef} className="h-full w-full" style={{ zIndex: 1 }} />
        ) : (
          <iframe
            title="Google Maps"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${coordinate.lat},${coordinate.lon}&hl=zh-TW&z=16&output=embed`}
          />
        )}
      </div>

      {/* 地圖下方設施分類標籤列（可切換篩選） */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-bold text-[#66736C]">地圖標記篩選：</span>
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold transition-all ${
              activeCategory === cat.id
                ? "bg-[#007d5a] text-white"
                : "border border-[#DDE3DF] bg-white text-[#3F5147] hover:bg-[#F5F8F6]"
            }`}
          >
            <span>{cat.label}</span>
            <span className={`text-[10px] ${activeCategory === cat.id ? "text-white/80" : "text-[#66736C]"}`}>
              ({cat.count})
            </span>
          </button>
        ))}
      </div>

      {/* 設施快速清單（緊湊橫列卡片，不再是死板的6大空格） */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAmenities.map(amenity => {
          const conf = CATEGORY_CONFIG[amenity.category] || {
            label: "設施",
            icon: "📍",
            bg: "#F5F8F6",
            text: "#1A2A22",
            border: "#DDE3DF",
          };
          const walkMin = Math.ceil(amenity.distanceMeters / 75);

          return (
            <div
              key={`${amenity.source}-${amenity.category}-${amenity.name}`}
              className="flex items-center justify-between gap-2 border border-[#DDE3DF] bg-white p-2.5 transition-colors hover:border-[#00a174] hover:bg-[#FDFEFE]"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs"
                  style={{ backgroundColor: conf.bg, color: conf.text }}
                >
                  {conf.icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#1A2A22]" title={amenity.name}>
                    {amenity.name}
                  </p>
                  <p className="text-[10px] text-[#66736C]">{conf.label}</p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="block text-xs font-black text-[#007d5a]">約 {amenity.distanceMeters}m</span>
                <span className="block text-[10px] text-[#66736C]">步行 {walkMin} 分</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
