import { createReadStream, createWriteStream, mkdirSync, writeFileSync } from "node:fs";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { createInterface } from "node:readline";
import { execFileSync } from "node:child_process";

const BASE = "https://api.transitous.org/gtfs/";
const FEEDS = [
  { id: "tokyo", file: "jp_tokyo-rail.gtfs.zip", label: "TokyoGTFS", source: "https://github.com/MKuranowski/TokyoGTFS", exclude: /新幹線|成田エクスプレス|踊り子|あずさ|かいじ|富士回遊|サフィール/ },
  { id: "toyama-tram", file: "jp_%E5%AF%8C%E5%B1%B1%E5%9C%B0%E6%96%B9%E9%89%84%E9%81%93%E5%B8%82%E5%86%85%E9%9B%BB%E8%BB%8A.gtfs.zip", label: "富山地方鉄道市内電車", source: "https://www.chitetsu.co.jp/" },
  { id: "kumamoto-rail", file: "jp_%E7%86%8A%E6%9C%AC%E9%9B%BB%E9%89%84%E9%9B%BB%E8%BB%8A.gtfs.zip", label: "熊本電鉄電車", source: "https://www.kumamotodentetsu.co.jp/train/" },
  { id: "kochi-tram", file: "jp_%E8%B7%AF%E9%9D%A2%E9%9B%BB%E8%BB%8A.gtfs.zip", label: "とさでん交通路面電車", source: "https://www.tosaden.co.jp/train/" }
];
const OUTPUT = new URL("../src/data/tokyoTransitGraph.json", import.meta.url);

function csv(line) {
  const values = []; let value = ""; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { if (quoted && line[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (char === "," && !quoted) { values.push(value); value = ""; } else value += char;
  }
  values.push(value); return values;
}

async function rows(path, visit) {
  const input = createInterface({ input: createReadStream(path), crlfDelay: Infinity }); let headers;
  for await (const line of input) {
    if (!headers) { headers = csv(line).map(value => value.replace(/^\uFEFF/, "")); continue; }
    const values = csv(line); const row = {}; headers.forEach((header, index) => row[header] = values[index] || ""); await visit(row);
  }
}

const japanese = value => value.replace(/\s+[A-Za-zÀ-ž].*$/, "").trim();
const seconds = value => { const [h, m, s] = value.split(":").map(Number); return h * 3600 + m * 60 + s; };

async function processFeed(feed, stations, metadata) {
  const work = await mkdtemp(join(tmpdir(), `linus-${feed.id}-`)); const zip = join(work, "feed.zip"); const dir = join(work, "feed"); await mkdir(dir);
  const url = BASE + feed.file;
  const response = await fetch(url, { headers: { "User-Agent": "LINUS-NiceDay-GTFS-Builder/1.1 (https://github.com/Linus3524/linus-niceday-japan-realestate)" } });
  if (!response.ok || !response.body) throw new Error(`${feed.label} GTFS download failed: ${response.status}`);
  await pipeline(response.body, createWriteStream(zip)); execFileSync("unzip", ["-oq", zip, "-d", dir]);

  const services = new Set();
  try { await rows(join(dir, "calendar.txt"), row => { if (row.monday === "1" && row.tuesday === "1" && row.wednesday === "1" && row.thursday === "1" && row.friday === "1") services.add(row.service_id); }); } catch { /* Some feeds encode weekday service in the id only. */ }
  const agencies = new Map(); await rows(join(dir, "agency.txt"), row => agencies.set(row.agency_id, japanese(row.agency_name)));
  const routes = new Map(); await rows(join(dir, "routes.txt"), row => routes.set(row.route_id, {
    name: japanese(row.route_long_name || row.route_short_name), shortName: row.route_short_name || null,
    color: `#${row.route_color || "3F626D"}`, textColor: `#${row.route_text_color || "FFFFFF"}`, operator: agencies.get(row.agency_id) || row.agency_id
  }));
  const parentNames = new Map(); const rawStops = [];
  await rows(join(dir, "stops.txt"), row => { rawStops.push(row); if (row.location_type === "1" || !row.parent_station) parentNames.set(row.stop_id, japanese(row.stop_name)); });
  const stops = new Map(); for (const row of rawStops) stops.set(row.stop_id, { name: parentNames.get(row.parent_station || row.stop_id) || japanese(row.stop_name), code: row.stop_code || null });
  const weekdayTrips = new Map(); await rows(join(dir, "trips.txt"), row => {
    if (services.has(row.service_id) || (!services.size && /Weekday|平日|●/i.test(row.service_id))) weekdayTrips.set(row.trip_id, { routeId: row.route_id, headsign: japanese(row.trip_headsign) });
  });
  const edges = new Map(); let currentTrip = ""; let tripStops = [];
  function flushTrip() {
    const trip = weekdayTrips.get(currentTrip); if (!trip || tripStops.length < 2) { tripStops = []; return; }
    const route = routes.get(trip.routeId); if (!route || feed.exclude?.test(route.name)) { tripStops = []; return; }
    for (let index = 1; index < tripStops.length; index++) {
      const from = tripStops[index - 1]; const to = tripStops[index]; if (!from.stop || !to.stop || from.stop.name === to.stop.name) continue;
      const departure = seconds(from.departure); if (departure < 6 * 3600 || departure > 11 * 3600) continue;
      const duration = seconds(to.arrival) - departure; if (duration <= 0 || duration > 45 * 60) continue;
      const routeId = `${feed.id}:${trip.routeId}`; const key = `${from.stop.name}\u0000${to.stop.name}\u0000${routeId}`;
      const aggregate = edges.get(key) || { from: from.stop.name, to: to.stop.name, routeId, fromCode: from.stop.code, toCode: to.stop.code, headsign: trip.headsign, route, sum: 0, count: 0, schedule: [] };
      aggregate.sum += duration; aggregate.count++; aggregate.schedule.push([Math.round(departure / 60), Math.max(1, Math.round(duration / 60))]); edges.set(key, aggregate);
    }
    tripStops = [];
  }
  await rows(join(dir, "stop_times.txt"), row => { if (row.trip_id !== currentTrip) { flushTrip(); currentTrip = row.trip_id; } if (weekdayTrips.has(row.trip_id)) tripStops.push({ stop: stops.get(row.stop_id), arrival: row.arrival_time, departure: row.departure_time }); }); flushTrip();
  for (const edge of edges.values()) {
    const schedule = [...new Map(edge.schedule.sort((a, b) => a[0] - b[0]).map(item => [`${item[0]}:${item[1]}`, item])).values()];
    stations[edge.from] ||= []; stations[edge.from].push({ to: edge.to, lineName: edge.route.name, lineShortName: edge.route.shortName, lineColor: edge.route.color, lineTextColor: edge.route.textColor, operator: edge.route.operator, sourceId: feed.id, durationMinutes: Math.max(1, Math.round(edge.sum / edge.count / 60)), schedule, fromCode: edge.fromCode, toCode: edge.toCode, headsign: edge.headsign });
  }
  metadata.push({ id: feed.id, label: feed.label, sourceUrl: feed.source, downloadUrl: url, updatedAt: response.headers.get("last-modified"), stationCount: new Set([...edges.values()].flatMap(edge => [edge.from, edge.to])).size, edgeCount: edges.size });
  console.log(`${feed.label}: ${metadata.at(-1).stationCount} stations, ${edges.size} directed edges`);
}

const stations = {}; const sources = [];
for (const feed of FEEDS) await processFeed(feed, stations, sources);
const graph = { generatedAt: new Date().toISOString(), sourceUpdatedAt: null, attribution: "Public GTFS schedules processed via Transitous; TokyoGTFS © Akihiko Kusanagi (MIT)", sourceUrl: "https://transitous.org/sources/", sources, stations };
mkdirSync(new URL("../src/data", import.meta.url), { recursive: true }); writeFileSync(OUTPUT, JSON.stringify(graph));
console.log(`Wrote ${Object.keys(stations).length} stations to ${OUTPUT.pathname}`);
