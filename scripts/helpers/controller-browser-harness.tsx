import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { useCalculatorController } from "../../src/hooks/useCalculatorController";
import { useListingHealthCheckController } from "../../src/hooks/useListingHealthCheckController";
import type { CalculatorTabProps } from "../../src/lib/calculator/types";

// Loaded only by the isolated browser test bundle. Real React renders each hook;
// deferred external providers let the runner choose response order explicitly.
type Pending = { kind: string; payload: unknown; resolve: (value: unknown) => void; reject: (reason: Error) => void };
const pending: Pending[] = [];
const events: unknown[] = [];
const previewCallbacks = new Map<string, (aspect: number) => void>();
const imageLoads: HTMLImageElement[] = [];
const NativeImage = window.Image;
window.Image = function () { const img = new NativeImage(); imageLoads.push(img); return img; } as unknown as typeof Image;
let model: Record<string, unknown>;
let root: ReturnType<typeof createRoot> | undefined;
let nextUrl = 0;
let clipboardFails = false;
let sharedId: string | undefined;
let mode: "listing" | "calculator" = "listing";
const globals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean; controllerHarness: typeof harness };
globals.IS_REACT_ACT_ENVIRONMENT = true;
const deferred = (kind: string, payload: unknown) => {
  events.push({ kind, payload });
  return new Promise((resolve, reject) => pending.push({ kind, payload, resolve, reject }));
};
function Probe() {
  const [calcMode, setCalcMode] = useState<CalculatorTabProps["calcMode"]>("rent");
  const [calcDistrict, setCalcDistrict] = useState("新宿區");
  const [calcRoomType, setCalcRoomType] = useState<CalculatorTabProps["calcRoomType"]>("k1");
  const [calcModifiers, setCalcModifiers] = useState<CalculatorTabProps["calcModifiers"]>([]);
  const [calcBuyModifiers, setCalcBuyModifiers] = useState<CalculatorTabProps["calcBuyModifiers"]>([]);
  const [calcStation, setCalcStation] = useState("none");
  const props = { calcMode, setCalcMode, calcDistrict, setCalcDistrict, calcRoomType, setCalcRoomType, calcModifiers, setCalcModifiers, calcBuyModifiers, setCalcBuyModifiers, calcStation, setCalcStation, handleTabChange() {}, handleSendMessage() {} };
  return mode === "listing" ? <ListingProbe /> : <CalculatorProbe props={props} />;
}
function ListingProbe() { model = useListingHealthCheckController({ sharedId }); return null; }
function CalculatorProbe({ props }: { props: CalculatorTabProps }) { model = useCalculatorController(props); return null; }
URL.createObjectURL = blob => { const url = `blob:test-${++nextUrl}`; events.push({ createUrl: url, name: blob instanceof File ? blob.name : "blob" }); return url; };
HTMLAnchorElement.prototype.click = function () { events.push({ download: this.download, href: this.href }); };
URL.revokeObjectURL = url => { events.push({ revokeUrl: url }); };
Object.defineProperty(navigator, "clipboard", { value: { async writeText(text: string) { events.push({ clipboard: text }); if (clipboardFails) throw new Error("blocked"); } } });
window.requestAnimationFrame = callback => { callback(0); return 0; };
const listingKeys = ["sharedTitle", "sharedExpiresAt", "file", "previewUrl", "previewImageUrl", "previewAspect", "previewState", "showFullPreview", "isDragging", "loading", "error", "result", "locationContext", "locationLoading", "locationError", "crimeData", "prefectureSafety", "crimeLoading", "commute", "commuteError", "commuteLoading", "shareTitle", "shareUrl", "shareLoading", "shareError", "shareCopied", "pdfLoading", "pdfError"];
const calculatorKeys = ["calcMode", "calcDistrict", "calcStation", "calcRoomType", "calcModifiers", "calcBuyModifiers", "guidedDistrictSelections", "guidedLineSelections", "guidedStationSelections", "guidedMinArea", "guidedAgeMax", "guidedFloorMin", "guidedWalkMinutes", "guidedStructure", "guidedAutoLock", "guidedElevator", "guidedCommuteStation", "guidedCommuteMinutes", "rentSearchFilters", "rentMonthlyBudget", "rentMonthlyBudgetMin", "aiResult", "analysisLoading", "analysisNotice", "aiInputLoading", "aiInputError", "appliedNotice", "locationGuardNotice", "showAdvancedTools"];
const harness = {
  deferred, events,
  registerPreview(name: string, callback: (aspect: number) => void) { previewCallbacks.set(name, callback); },
  async previewAspect(name: string, aspect: number) { await act(async () => previewCallbacks.get(name)?.(aspect)); },
  async imageLoaded(index: number, width: number, height: number) {
    const img = imageLoads[index];
    Object.defineProperties(img, { naturalWidth: {value:width}, naturalHeight: {value:height} });
    await act(async () => img.dispatchEvent(new Event("load")));
  },
  async callTwice(name: string) {
    await act(async () => { const callback = model[name] as () => unknown; void callback(); void callback(); });
  },
  track(name: string) { events.push({ track: name }); },
  async mount(nextMode: typeof mode, id?: string) {
    await act(async () => root?.unmount());
    pending.length = 0; events.length = 0; previewCallbacks.clear(); imageLoads.length = 0; nextUrl = 0; clipboardFails = false;
    mode = nextMode; sharedId = id;
    root = createRoot(document.getElementById("root")!);
    await act(async () => root!.render(<Probe />));
  },
  async setSharedId(id: string) { sharedId = id; await act(async () => root!.render(<Probe />)); },
  async unmount() { await act(async () => root?.unmount()); root = undefined; },
  async call(name: string, ...args: unknown[]) {
    await act(async () => { void (model[name] as (...args: unknown[]) => unknown)(...args); });
  },
  async file(name: string, type: string) {
    const input = { files: [new File(["test"], name, { type })], value: "selected" };
    await this.call("handleFileSelect", { target: input });
    if (input.value !== "") throw new Error("file input must reset");
  },
  async settle(kind: string, value: unknown, options: { occurrence?: number; reject?: boolean; status?: number; invalidJson?: boolean } = {}) {
    const matches = pending.map((item, index) => ({ item, index })).filter(({ item }) => item.kind === kind);
    const match = matches[options.occurrence || 0];
    if (!match) throw new Error(`No pending ${kind}`);
    pending.splice(match.index, 1);
    await act(async () => {
      if (options.reject) match.item.reject(new Error(String(value)));
      else if (["analysis", "location", "share", "readShare", "rent"].includes(kind)) match.item.resolve({
        ok: (options.status || 200) < 400, status: options.status || 200,
        json: () => options.invalidJson ? Promise.reject(new Error("invalid JSON")) : Promise.resolve(value),
      });
      else match.item.resolve(value);
    });
  },
  clipboardFailure(value: boolean) { clipboardFails = value; },
  snapshot() {
    const keys = mode === "listing" ? listingKeys : calculatorKeys;
    return JSON.parse(JSON.stringify({
      state: Object.fromEntries(keys.map(key => [key, model[key] instanceof File ? (model[key] as File).name : model[key]])),
      pending: pending.map(({ kind, payload }) => ({ kind, payload })), events,
    }));
  },
};
globals.controllerHarness = harness;
