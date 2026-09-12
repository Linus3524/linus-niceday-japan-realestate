import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

interface PdfHarness {
  mode: "ready" | "blank" | "timeout" | "load-error";
  jpeg: string;
  cancelled: number;
  destroyed: number;
  cleaned: number;
  documents: Array<Record<string, unknown>>;
  timeouts: number[];
}
const globals = globalThis as typeof globalThis & { __listingPdf?: PdfHarness };
const folder = await mkdtemp(join(tmpdir(), "linus-upload-test-"));
const original = {
  document: globalThis.document,
  FileReader: globalThis.FileReader,
  createImageBitmap: globalThis.createImageBitmap,
  setTimeout: globalThis.setTimeout,
  warn: console.warn,
};

try {
  // Bundle the real browser pipeline against a controlled pdf.js provider. No
  // production dependency injection or changes to the exported signatures.
  const output = join(folder, "upload.mjs");
  await build({
    stdin: {
      contents: 'export { encodeForUpload } from "./src/lib/listing/browser/uploadEncoding"; export { renderPdfPreview } from "./src/lib/listing/browser/pdfRendering";',
      resolveDir: process.cwd(), loader: "ts",
    },
    bundle: true, platform: "node", format: "esm", outfile: output, logLevel: "silent",
    plugins: [{
      name: "pdf-test-provider",
      setup(builder) {
        builder.onResolve({ filter: /^pdfjs-dist/ }, args => ({ path: args.path, namespace: "pdf-test" }));
        builder.onLoad({ filter: /.*/, namespace: "pdf-test" }, args => ({
          contents: args.path.includes("worker") ? 'export default "/test-pdf-worker.js";' : `
            export const GlobalWorkerOptions = {};
            export function getDocument(options) {
              const state = globalThis.__listingPdf;
              state.documents.push(options);
              if (state.mode === "load-error") return { promise: Promise.reject(new Error("unreadable PDF")) };
              const page = {
                getTextContent: async () => ({ items: [
                  { str: "無", transform: [1, 0, 0, 1, 100, 99] },
                  { str: "礼金", transform: [1, 0, 0, 1, 0, 80] },
                  { str: "敷金", transform: [1, 0, 0, 1, 0, 100] },
                ] }),
                getViewport: ({ scale }) => ({ width: 200 * scale, height: 100 * scale }),
                render: () => ({
                  promise: state.mode === "timeout" ? new Promise(() => {}) : Promise.resolve(),
                  cancel: () => { state.cancelled++; },
                }),
                cleanup: () => { state.cleaned++; },
              };
              return { promise: Promise.resolve({ getPage: async () => page, destroy: async () => { state.destroyed++; } }) };
            }`,
          loader: "js",
        }));
      },
    }],
  });
  const pipeline = await import(pathToFileURL(output).href) as
    Pick<typeof import("../src/lib/listing/browser/uploadEncoding.js"), "encodeForUpload">
    & Pick<typeof import("../src/lib/listing/browser/pdfRendering.js"), "renderPdfPreview">;

  const reset = (mode: PdfHarness["mode"] = "ready") => {
    globals.__listingPdf = { mode, jpeg: "anBlZw==", cancelled: 0, destroyed: 0, cleaned: 0, documents: [], timeouts: [] };
    return globals.__listingPdf;
  };
  let bitmapClosed = 0;
  let lastCanvas: { width: number; height: number } | undefined;
  globalThis.document = {
    createElement: (tag: string) => {
      assert.equal(tag, "canvas");
      const canvas = {
        width: 0, height: 0,
        getContext: () => ({
          drawImage: () => {},
          getImageData: () => ({ data: new Uint8ClampedArray(globals.__listingPdf?.mode === "blank" ? [255, 255, 255, 255] : [0, 0, 0, 255]) }),
        }),
        toDataURL: (mime: string, quality: number) => {
          assert.equal(mime, "image/jpeg");
          assert.ok(quality === 0.8 || quality === 0.88);
          return `data:image/jpeg;base64,${globals.__listingPdf!.jpeg}`;
        },
        toBlob: (callback: (blob: Blob) => void, mime: string, quality: number) => {
          assert.equal(quality, 0.9);
          callback(new Blob(["preview"], { type: mime }));
        },
      };
      lastCanvas = canvas;
      return canvas;
    },
  } as unknown as Document;
  globalThis.FileReader = class {
    result: string | null = null;
    onload: (() => void) | null = null;
    readAsDataURL(file: File) {
      void file.arrayBuffer().then(buffer => {
        this.result = `data:${file.type};base64,${Buffer.from(buffer).toString("base64")}`;
        this.onload?.();
      });
    }
  } as unknown as typeof FileReader;
  globalThis.createImageBitmap = (async (_file: File, options: ImageBitmapOptions) => {
    assert.equal(options.imageOrientation, "from-image");
    return { width: 4000, height: 2000, close: () => { bitmapClosed++; } };
  }) as typeof createImageBitmap;
  globalThis.setTimeout = ((callback: (...args: unknown[]) => void, ms: number, ...args: unknown[]) => {
    globals.__listingPdf!.timeouts.push(ms);
    return original.setTimeout(callback, 0, ...args);
  }) as typeof setTimeout;
  console.warn = () => {};

  const pdf = new File(["raw-pdf"], "物件.pdf", { type: "application/pdf" });
  const raw = { mimeType: "application/pdf", data: Buffer.from("raw-pdf").toString("base64") };
  let state = reset();
  assert.deepEqual(await pipeline.encodeForUpload(pdf), {
    files: [{ mimeType: "image/jpeg", data: "anBlZw==" }, raw], layoutText: "敷金　無\n礼金",
  });
  assert.deepEqual(state.timeouts, [10000]);
  assert.equal(state.destroyed, 1);
  assert.equal(state.cleaned, 1);
  assert.equal(lastCanvas?.width, 2200);
  assert.equal(state.documents[0].cMapUrl, "/pdfjs/cmaps/");
  assert.equal(state.documents[0].cMapPacked, true);
  assert.equal(state.documents[0].standardFontDataUrl, "/pdfjs/standard_fonts/");

  state = reset();
  state.jpeg = Buffer.alloc(3 * 1024 * 1024).toString("base64");
  const large = await pipeline.encodeForUpload(pdf);
  assert.equal(large.files.length, 1, "Combined size overflow retains the rendered image");
  assert.equal(large.files[0].mimeType, "image/jpeg");
  assert.equal(large.layoutText, "敷金　無\n礼金");

  for (const mode of ["blank", "timeout"] as const) {
    state = reset(mode);
    assert.deepEqual(await pipeline.encodeForUpload(pdf), { files: [raw], layoutText: "敷金　無\n礼金" });
    assert.equal(state.cancelled, mode === "timeout" ? 1 : 0);
    assert.equal(state.destroyed, 1);
  }
  reset("load-error");
  assert.deepEqual(await pipeline.encodeForUpload(pdf), { files: [raw], layoutText: "" });

  state = reset();
  let aspect: number | undefined;
  const preview = await pipeline.renderPdfPreview(pdf, value => { aspect = value; });
  assert.equal(aspect, 2);
  assert.equal(preview?.aspect, 2);
  assert.equal(state.destroyed, 1);
  assert.equal(lastCanvas?.width, 2200);
  if (preview) URL.revokeObjectURL(preview.blobUrl);
  state = reset("timeout");
  assert.equal(await pipeline.renderPdfPreview(pdf), null);
  assert.equal(state.cancelled, 1);
  assert.equal(state.destroyed, 1);

  reset();
  const image = new File(["original-image"], "photo.png", { type: "image/png" });
  assert.deepEqual(await pipeline.encodeForUpload(image), { files: [{ mimeType: "image/jpeg", data: "anBlZw==" }], layoutText: "" });
  assert.equal(lastCanvas?.width, 2000);
  assert.equal(lastCanvas?.height, 1000);
  assert.equal(bitmapClosed, 1);
  globalThis.createImageBitmap = async () => { throw new Error("decode failed"); };
  assert.deepEqual(await pipeline.encodeForUpload(image), {
    files: [{ mimeType: "image/png", data: Buffer.from("original-image").toString("base64") }], layoutText: "",
  });
} finally {
  globalThis.document = original.document;
  globalThis.FileReader = original.FileReader;
  globalThis.createImageBitmap = original.createImageBitmap;
  globalThis.setTimeout = original.setTimeout;
  console.warn = original.warn;
  delete globals.__listingPdf;
  await rm(folder, { recursive: true, force: true });
}
console.log("Listing upload: PDF/image encoding, layout text, size limits, blank/timeout fallbacks and resource cleanup passed.");
