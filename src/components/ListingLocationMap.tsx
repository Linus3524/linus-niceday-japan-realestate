import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Building2,
  Compass,
  ExternalLink,
  GraduationCap,
  HeartPulse,
  Info,
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
  { label: string; icon: string; bg: string; text: string; border: string; badgeBg: string }
> = {
  convenience: { label: "超商", icon: "🏪", bg: "#e6f6f1", text: "#007d5a", border: "#9ee2cf", badgeBg: "#007d5a" },
  supermarket: { label: "超市", icon: "🛒", bg: "#FFF4E5", text: "#B76E00", border: "#FFD599", badgeBg: "#B76E00" },
  pharmacy: { label: "藥妝", icon: "💊", bg: "#EBF5FF", text: "#1E65B8", border: "#B9DCFF", badgeBg: "#1E65B8" },
  medical: { label: "醫療", icon: "🏥", bg: "#FDE8E8", text: "#C81E1E", border: "#F8B4B4", badgeBg: "#C81E1E" },
  school: { label: "學校", icon: "🏫", bg: "#F3E8FF", text: "#7E22CE", border: "#D8B4FE", badgeBg: "#7E22CE" },
  park: { label: "公園", icon: "🌳", bg: "#EAF5EA", text: "#2B8A3E", border: "#B2E2B2", badgeBg: "#2B8A3E" },
};

function getAmenityPoint(
  amenity: ListingAmenity,
  center: { lat: number; lon: number },
  index: number
): [number, number] {
  if (
    typeof amenity.lat === "number" &&
    typeof amenity.lon === "number" &&
    Number.isFinite(amenity.lat) &&
    Number.isFinite(amenity.lon) &&
    amenity.lat !== 0 &&
    amenity.lon !== 0
  ) {
    return [amenity.lat, amenity.lon];
  }
  // 萬一經緯度缺漏時的確定性周邊半徑發散演算，確保所有標記必定呈現在地圖上
  const distM = Math.max(80, amenity.distanceMeters || 300);
  const angle = ((index * 61.8 + 25) % 360) * (Math.PI / 180);
  const dLat = (distM / 111320) * Math.cos(angle);
  const dLon = (distM / (111320 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(angle);
  return [center.lat + dLat, center.lon + dLon];
}

function getStationPoint(
  walk: ListingStationWalk,
  center: { lat: number; lon: number },
  index: number
): [number, number] {
  if (
    typeof walk.lat === "number" &&
    typeof walk.lon === "number" &&
    Number.isFinite(walk.lat) &&
    Number.isFinite(walk.lon) &&
    walk.lat !== 0 &&
    walk.lon !== 0
  ) {
    return [walk.lat, walk.lon];
  }
  const distM = Math.max(250, walk.distanceMeters || 600);
  const angle = ((index * 90 + 40) % 360) * (Math.PI / 180);
  const dLat = (distM / 111320) * Math.cos(angle);
  const dLon = (distM / (111320 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(angle);
  return [center.lat + dLat, center.lon + dLon];
}

export function ListingLocationMap({ context }: ListingLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());
  const [mapMode, setMapMode] = useState<"interactive" | "google">("interactive");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { coordinate, matchedAddress, stationWalks, amenities } = context;

  // 動態切換 marker 的高亮 CSS 樣式
  useEffect(() => {
    markerMapRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      if (!el) return;
      if (id === hoveredId) {
        el.classList.add("is-active-marker");
        marker.setZIndexOffset(9999);
      } else {
        el.classList.remove("is-active-marker");
        marker.setZIndexOffset(0);
      }
    });
  }, [hoveredId]);

  useEffect(() => {
    if (mapMode !== "interactive" || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    markerMapRef.current.clear();

    const map = L.map(mapContainerRef.current, {
      center: [coordinate.lat, coordinate.lon],
      zoom: 16,
      scrollWheelZoom: false,
    });
    mapInstanceRef.current = map;

    // OpenStreetMap 底圖
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);

    // 1. 本物件 Marker（醒目綠色房屋圖標）
    const propertyIcon = L.divIcon({
      className: "custom-property-pin",
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          background: #007d5a;
          color: white;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
          font-size: 20px;
          cursor: pointer;
        ">
          🏠
          <div style="
            position: absolute;
            bottom: -7px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 7px solid transparent;
            border-right: 7px solid transparent;
            border-top: 8px solid #007d5a;
          "></div>
        </div>
      `,
      iconSize: [42, 49],
      iconAnchor: [21, 49],
      popupAnchor: [0, -49],
    });

    const propertyMarker = L.marker([coordinate.lat, coordinate.lon], { icon: propertyIcon })
      .addTo(layerGroup)
      .bindPopup(
        `<div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; padding: 4px 2px;">
          <strong style="color: #007d5a; font-size: 13px;">📍 本物件所在地</strong><br/>
          <span style="color: #333; font-weight: 500;">${matchedAddress}</span>
        </div>`
      );
    markerMapRef.current.set("property", propertyMarker);

    // 2. 車站 Marker
    stationWalks.forEach((walk, idx) => {
      const [lat, lon] = getStationPoint(walk, coordinate, idx);
      const stationKey = `station-${idx}-${walk.station}`;

      const stationIcon = L.divIcon({
        className: "custom-station-pin",
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 5px;
            background: #1A2A22;
            color: white;
            padding: 4px 9px;
            border-radius: 16px;
            border: 2px solid #ffffff;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
          ">
            <span>🚆</span>
            <span>${walk.station}駅 (${walk.normalMinutes}分)</span>
          </div>
        `,
        iconSize: [124, 28],
        iconAnchor: [62, 28],
        popupAnchor: [0, -28],
      });

      const marker = L.marker([lat, lon], { icon: stationIcon })
        .addTo(layerGroup)
        .bindPopup(
          `<div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; padding: 4px 2px;">
            <strong style="font-size: 13px; color: #1A2A22;">🚆 ${walk.station}駅</strong><br/>
            <span>步行路徑：約 ${walk.distanceMeters.toLocaleString("zh-TW")} 公尺</span><br/>
            <div style="margin-top: 4px; padding: 3px 6px; background: #e6f6f1; border-radius: 4px; color: #007d5a; font-weight: bold;">
              常態步速約 ${walk.normalMinutes} 分鐘（快步 ${walk.fastMinutes} 分）
            </div>
          </div>`
        );

      marker.on("mouseover", () => {
        setHoveredId(stationKey);
        marker.openPopup();
      });
      marker.on("mouseout", () => {
        setHoveredId(null);
      });

      markerMapRef.current.set(stationKey, marker);
    });

    // 3. 周邊生活機能 Marker
    amenities.forEach((amenity, idx) => {
      const amenityKey = `amenity-${amenity.category}-${idx}`;
      if (activeCategory !== "all" && amenity.category !== activeCategory) return;

      const [lat, lon] = getAmenityPoint(amenity, coordinate, idx);
      const conf = CATEGORY_CONFIG[amenity.category] || {
        label: "設施",
        icon: "📍",
        bg: "#F5F8F6",
        text: "#1A2A22",
        border: "#DDE3DF",
        badgeBg: "#1A2A22",
      };

      const displayName = amenity.name.length > 8 ? `${amenity.name.slice(0, 8)}…` : amenity.name;

      const amenityIcon = L.divIcon({
        className: "custom-amenity-pin",
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: ${conf.bg};
            color: ${conf.text};
            border: 1.5px solid ${conf.border};
            padding: 3px 7px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.18);
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
          ">
            <span>${conf.icon}</span>
            <span>${displayName}</span>
          </div>
        `,
        iconSize: [88, 24],
        iconAnchor: [44, 24],
        popupAnchor: [0, -24],
      });

      const marker = L.marker([lat, lon], { icon: amenityIcon })
        .addTo(layerGroup)
        .bindPopup(
          `<div style="font-family: sans-serif; font-size: 12px; line-height: 1.45; padding: 4px 2px;">
            <span style="display: inline-block; padding: 1px 6px; font-size: 10px; font-weight: bold; background: ${conf.bg}; color: ${conf.text}; border-radius: 4px; border: 1px solid ${conf.border}; margin-bottom: 3px;">
              ${conf.icon} ${conf.label}
            </span><br/>
            <strong style="font-size: 13px; color: #1A2A22;">${amenity.name}</strong><br/>
            <span style="color: #555;">距離物件約 <strong>${amenity.distanceMeters}</strong> 公尺（徒步約 ${Math.ceil(amenity.distanceMeters / 75)} 分）</span><br/>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(amenity.name + " " + matchedAddress)}" target="_blank" rel="noreferrer" style="color: #007d5a; font-weight: bold; text-decoration: underline; font-size: 11px; display: inline-block; margin-top: 5px;">
              在 Google 地圖查看 ↗
            </a>
          </div>`
        );

      marker.on("mouseover", () => {
        setHoveredId(amenityKey);
        marker.openPopup();
        const cardEl = document.getElementById(`card-${amenityKey}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
      marker.on("mouseout", () => {
        setHoveredId(null);
      });

      markerMapRef.current.set(amenityKey, marker);
    });

    // 視野自動適應所有標記
    const points: L.LatLngExpression[] = [[coordinate.lat, coordinate.lon]];
    stationWalks.forEach((w, idx) => {
      points.push(getStationPoint(w, coordinate, idx));
    });
    amenities.forEach((a, idx) => {
      if (activeCategory === "all" || a.category === activeCategory) {
        points.push(getAmenityPoint(a, coordinate, idx));
      }
    });

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinate.lat, coordinate.lon, matchedAddress, stationWalks, amenities, mapMode, activeCategory]);

  const handleCardHover = (key: string | null) => {
    setHoveredId(key);
    if (!key) return;
    const marker = markerMapRef.current.get(key);
    if (marker && mapInstanceRef.current) {
      marker.openPopup();
      mapInstanceRef.current.panTo(marker.getLatLng(), { animate: true, duration: 0.35 });
    }
  };

  const handleCardClick = (key: string) => {
    const marker = markerMapRef.current.get(key);
    if (marker && mapInstanceRef.current) {
      mapInstanceRef.current.setView(marker.getLatLng(), 17, { animate: true });
      marker.openPopup();
    }
  };

  const resetView = () => {
    if (!mapInstanceRef.current) return;
    const points: L.LatLngExpression[] = [[coordinate.lat, coordinate.lon]];
    stationWalks.forEach((w, idx) => {
      points.push(getStationPoint(w, coordinate, idx));
    });
    amenities.forEach((a, idx) => {
      if (activeCategory === "all" || a.category === activeCategory) {
        points.push(getAmenityPoint(a, coordinate, idx));
      }
    });
    mapInstanceRef.current.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
  };

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
    ? amenities.map((a, idx) => ({ ...a, key: `amenity-${a.category}-${idx}` }))
    : amenities
        .map((a, idx) => ({ ...a, key: `amenity-${a.category}-${idx}` }))
        .filter(a => a.category === activeCategory);

  return (
    <div className="space-y-3 font-sans">
      <style>{`
        .custom-property-pin {
          transition: transform 0.2s ease;
        }
        .custom-amenity-pin {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
          cursor: pointer;
        }
        .custom-station-pin {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }
        .is-active-marker {
          transform: scale(1.28) translateY(-5px) !important;
          filter: drop-shadow(0 6px 16px rgba(0, 125, 90, 0.45)) !important;
          z-index: 99999 !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 6px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.2);
          border: 1px solid #DDE3DF;
        }
      `}</style>

      {/* 頂部地圖模式工具列 */}
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
            📍 設施互動標籤地圖
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
            🗺️ Google Maps 實景嵌入
          </button>
          {mapMode === "interactive" && (
            <button
              type="button"
              onClick={resetView}
              className="flex items-center gap-1 border border-[#DDE3DF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3F5147] hover:bg-[#F5F8F6]"
            >
              <Compass className="h-3 w-3 text-[#007d5a]" />
              <span>全覽居中</span>
            </button>
          )}
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
      <div className="relative h-72 w-full overflow-hidden border border-[#1A2A22] bg-[#E8ECE9] md:h-[400px]">
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

      {/* 分類篩選與互動提示 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#66736C]">類別篩選：</span>
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

        <div className="flex items-center gap-1 text-[11px] font-medium text-[#007d5a]">
          <Info className="h-3.5 w-3.5" />
          <span>滑鼠懸停下方設施，地圖將同步高亮並開啟資訊</span>
        </div>
      </div>

      {/* 設施快速卡片清單（支援懸停與地圖聯動） */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAmenities.map(amenity => {
          const conf = CATEGORY_CONFIG[amenity.category] || {
            label: "設施",
            icon: "📍",
            bg: "#F5F8F6",
            text: "#1A2A22",
            border: "#DDE3DF",
            badgeBg: "#1A2A22",
          };
          const walkMin = Math.ceil(amenity.distanceMeters / 75);
          const isHovered = hoveredId === amenity.key;

          return (
            <div
              id={`card-${amenity.key}`}
              key={amenity.key}
              onMouseEnter={() => handleCardHover(amenity.key)}
              onMouseLeave={() => handleCardHover(null)}
              onClick={() => handleCardClick(amenity.key)}
              className={`flex cursor-pointer items-center justify-between gap-2 border p-2.5 transition-all ${
                isHovered
                  ? "border-[#007d5a] bg-[#e6f6f1] shadow-md -translate-y-0.5"
                  : "border-[#DDE3DF] bg-white hover:border-[#9ee2cf] hover:bg-[#FAFCFB]"
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm transition-transform"
                  style={{
                    backgroundColor: conf.bg,
                    color: conf.text,
                    transform: isHovered ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  {conf.icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#1A2A22]" title={amenity.name}>
                    {amenity.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#66736C]">
                    <span className="font-semibold text-[#007d5a]">{conf.label}</span>
                    <span>•</span>
                    <span>步行約 {walkMin} 分</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="block text-xs font-black text-[#007d5a]">約 {amenity.distanceMeters}m</span>
                <span className="block text-[9px] font-semibold text-[#66736C]">
                  {isHovered ? "地圖定位中" : "點擊定位"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
