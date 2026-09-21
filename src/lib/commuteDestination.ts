import { districtStations as dsHousing } from "../data/housingMarket.js";
import { districtStations as dsStation } from "../data/stationData.js";
import graphJson from "../data/tokyoTransitGraph.json" with { type: "json" };
import regionalGraphJson from "../data/japanRegionalTransitGraph.json" with { type: "json" };
import { GoogleGenAI } from "@google/genai";
import { JAPANESE_STATION_NAMES, toJapanesePlaceName, toJapaneseStationName } from "./transit.js";
import { stripStationOperatorPrefix } from "./listingExtraction.js";
import { nearestStationForAddress } from "./listingLocation.js";

// 彙整已知站名（包含首都圈 2,300+ 車站、全國主要都會路網與各區市町村重要車站）
const KNOWN_STATIONS = new Set<string>();
for (const list of Object.values(dsHousing)) {
  for (const s of list) KNOWN_STATIONS.add(toJapaneseStationName(s.name));
}
for (const list of Object.values(dsStation)) {
  for (const s of list) KNOWN_STATIONS.add(toJapaneseStationName(s.name));
}
for (const name of Object.keys((graphJson as { stations?: Record<string, unknown> }).stations || {})) {
  KNOWN_STATIONS.add(toJapaneseStationName(name.replace(/[〈（(].*$/, "")));
}
for (const name of Object.keys((regionalGraphJson as { stations?: Record<string, unknown> }).stations || {})) {
  KNOWN_STATIONS.add(toJapaneseStationName(name.replace(/[〈（(].*$/, "")));
}
for (const target of Object.values(JAPANESE_STATION_NAMES)) {
  KNOWN_STATIONS.add(target);
}

export interface CommuteDestinationInfo {
  station: string;
  matchedAddress: string;
  distanceMeters: number;
  fastMinutes: number;
  normalMinutes: number;
  slowMinutes: number;
  addressConfidence?: string;
  resolutionNote?: string | null;
}

/**
 * 透過 Google Search Grounding (Gemini 3.1 Flash Lite) 辨識非門牌地址的日文機構、大學、地標或俗稱。
 */
async function resolveDestinationWithAi(destination: string): Promise<CommuteDestinationInfo | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  const cleaned = destination.trim();
  if (!apiKey || cleaned.length < 2) return null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{
        role: "user",
        parts: [{
          text: `使用者正在日本不動產網站試算通勤時間，目的地欄位輸入了繁簡中文：\n<query>${cleaned}</query>\n\n請使用 Google Search 查出此日本地點、公司、學校或地標的正式日文地址以及最近的鐵路或地鐵車站名稱。\n請務必明確標示：\n正式名稱: [日文正式名稱]\n完整地址: [都道府県市区町村町名番地]\n最近車站: [車站名，純站名不帶駅字，例如：早稲田、六本木、赤羽橋]\n若找不到請回答 NOT_FOUND。`
        }]
      }],
      config: { temperature: 0, tools: [{ googleSearch: {} }] }
    });
    const text = response.text || "";
    if (/NOT_FOUND/i.test(text)) return null;

    const addressMatch = text.match(/完整地址\s*[:：]\s*([^\n]+)/i)?.[1]?.replace(/[*`"'「」]/g, "").trim();
    const stationMatch = text.match(/最近車站\s*[:：]\s*([^\n,，、]+)/i)?.[1]?.replace(/[*`"'「」]/g, "").trim();

    if (addressMatch && /[都道府県].+(?:市|区|町|村)/.test(addressMatch)) {
      const info = await nearestStationForAddress(addressMatch);
      if (info && info.normalMinutes <= 30) {
        return {
          ...info,
          resolutionNote: `已由 AI 辨識為「${toJapanesePlaceName(cleaned)}」：${info.matchedAddress}`,
        };
      }
    }

    if (stationMatch) {
      const station = toJapaneseStationName(stationMatch);
      if (station) {
        return {
          station,
          matchedAddress: `${station}駅`,
          distanceMeters: 0,
          fastMinutes: 0,
          normalMinutes: 0,
          slowMinutes: 0,
          addressConfidence: "medium",
          resolutionNote: `已由 AI 辨識「${cleaned}」最近車站為 ${station}駅`,
        };
      }
    }
  } catch (error) {
    if (process.env.DEBUG_ADDRESS_RESOLUTION === "1") console.warn("AI destination resolution failed:", error);
  }
  return null;
}

/**
 * 判斷並解析通勤目的地為「車站」或「地址」。
 *
 * 支援多種自然語言輸入：
 * 1. 明確車站後綴（「新宿站」、「新宿駅」、「新宿車站」、「池袋站」、「澀谷站」、「涉谷站」、「涩谷站」、「秋叶原站」）
 * 2. 鐵路公司與路線前綴（「JR新宿站」、「東京メトロ銀座站」）
 * 3. 純站名（無後綴，例如「新宿」、「池袋」、「渋谷」、「秋葉原」、「東京」、「梅田」）
 * 4. 門牌地址（「東京都新宿区西新宿2-8-1」、「东京都新宿区西新宿2-8-1」、「大阪市北區梅田1-1」）-> 自動查找最近車站並計算真實步行距離
 * 5. 知名地標與大學學校（「晴空塔」、「六本木之丘」、「早稻田大學」）-> 結合字典與 AI 地標意圖辨識
 */
export async function resolveCommuteDestination(destination: string): Promise<CommuteDestinationInfo | null> {
  const trimmed = destination.trim();
  if (!trimmed) return null;

  // 1. 若帶有明確車站後綴（站/駅/車站/车站）或營運商前綴（如 JR新宿）：直接以車站解析
  const hasStationSuffix = /\s*(?:車站|车站|站|駅)\s*$/i.test(trimmed);
  const hasOperatorPrefix = /^(?:JR|ＪＲ|東京メトロ|東京地下鉄|東京地下鐵|都営地下鉄|都營地下鐵|都営|都營|地下鉄|地下鐵|メトロ)[\s・･]*/i.test(trimmed);

  if (hasStationSuffix || hasOperatorPrefix) {
    const stripped = stripStationOperatorPrefix(trimmed);
    const station = stripped ? toJapaneseStationName(stripped) : null;
    if (station) {
      return {
        station,
        matchedAddress: `${station}駅`,
        distanceMeters: 0,
        fastMinutes: 0,
        normalMinutes: 0,
        slowMinutes: 0,
        addressConfidence: "high",
        resolutionNote: null,
      };
    }
  }

  // 2. 使用者直接輸入站名或知名地標（無後綴，例如「新宿」、「池袋」、「渋谷」、「秋葉原」、「晴空塔」）：
  // 檢查是否沒有門牌地址特徵（無數字-數字、丁目等），且為已知車站或字典地標
  const isAddressLike = /\d+[-－ー丁目番号]/.test(trimmed) || /[0-9０-９一二三四五六七八九十]+(?:丁目|番|号)/.test(trimmed);
  if (!isAddressLike && trimmed.length <= 15) {
    const stripped = stripStationOperatorPrefix(trimmed) || trimmed;
    const candidate = toJapaneseStationName(stripped);
    if (candidate && KNOWN_STATIONS.has(candidate)) {
      return {
        station: candidate,
        matchedAddress: `${candidate}駅`,
        distanceMeters: 0,
        fastMinutes: 0,
        normalMinutes: 0,
        slowMinutes: 0,
        addressConfidence: "high",
        resolutionNote: null,
      };
    }
  }

  // 3. 嘗試以地址定位（例如「東京都新宿区西新宿2-8-1」）
  const addressInfo = await nearestStationForAddress(trimmed);
  if (addressInfo && addressInfo.normalMinutes <= 30) {
    return addressInfo;
  }

  // 4. 若地址定位查無資料，或步行時間異常偏長（如 GSI 把學校名稱匹配到同名偏鄉街區）：
  // 啟動 AI 地標／機構／學校意圖辨識
  const aiInfo = await resolveDestinationWithAi(trimmed);
  if (aiInfo) {
    return aiInfo;
  }

  // 5. 若 AI 未啟用或未解析出結果，且 addressInfo 仍存在（即使大於 30 分鐘，如鄉村地區真實距離）：
  if (addressInfo) {
    return addressInfo;
  }

  // 6. 若為簡短輸入且無地址特徵（如關西或其他外縣市站名「梅田」、「難波」、「博多」）：
  if (!isAddressLike && trimmed.length <= 8) {
    const stripped = stripStationOperatorPrefix(trimmed) || trimmed;
    const candidate = toJapaneseStationName(stripped);
    if (candidate) {
      return {
        station: candidate,
        matchedAddress: `${candidate}駅`,
        distanceMeters: 0,
        fastMinutes: 0,
        normalMinutes: 0,
        slowMinutes: 0,
        addressConfidence: "medium",
        resolutionNote: null,
      };
    }
  }

  return null;
}
