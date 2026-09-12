import assert from "node:assert/strict";

type Run = (code: string) => Promise<unknown>;
type Snapshot = {
  state: Record<string, unknown>;
  pending: Array<{ kind: string; payload: unknown }>;
  events: Array<Record<string, unknown>>;
};

/** Explicit desired behavior, independent of the historical refactor fixture. */
export async function verifyListingRaces(run: Run, analysis: object, encoded: object) {
  const data = JSON.stringify(analysis);
  const upload = JSON.stringify(encoded);
  const snapshot = async () => await run("return h.snapshot();") as Snapshot;
  let cases = 0;
  const start = async () => {
    await run('await h.mount("listing"); await h.file("A.png", "image/png"); await h.callTwice("analyze");');
    assert.equal((await snapshot()).pending.length, 1, "same-render duplicate submission is locked");
  };
  const report = async () => {
    await start();
    await run(`await h.settle("encode", ${upload}); await h.settle("analysis", ${data});`);
  };
  const context = { found: true, context: { matchedAddress: "東京都新宿区", stationWalks: [{ station: "新宿", normalMinutes: 6, advertisedMinutes: 5 }] } };

  for (const phase of ["encode", "analysis"] as const) {
    for (const ending of ["switch", "remove", "unmount"] as const) {
      for (const reject of [false, true]) {
        await start();
        if (phase === "analysis") await run(`await h.settle("encode", ${upload});`);
        if (ending === "switch") await run('await h.file("B.png", "image/png"); await h.call("analyze");');
        if (ending === "remove") await run('await h.call("removeFile");');
        if (ending === "unmount") await run('await h.unmount();');
        const before = await snapshot();
        const value = reject ? '"old failure"' : phase === "encode" ? upload : data;
        await run(`await h.settle("${phase}", ${value}, {reject:${reject}});`);
        const after = await snapshot();
        assert.deepEqual(after.state, before.state, `${phase}/${ending}/${reject}: no stale state or loading write`);
        assert.deepEqual(after.events, before.events, "stale completion starts no requests or tracking");
        if (ending === "switch") {
          assert.equal(after.state.loading, true, "B stays busy while A finishes");
          await run(`await h.settle("encode", ${upload}); await h.settle("analysis", ${data});`);
          assert.deepEqual((await snapshot()).state.result, analysis, "B still completes normally");
        }
        cases++;
      }
    }
  }

  for (const phase of ["location", "crime", "commute"] as const) {
    for (const ending of ["switch", "remove", "unmount"] as const) {
      for (const reject of [false, true]) {
        await report();
        if (phase !== "location") await run(`await h.settle("location", ${JSON.stringify(context)});`);
        if (phase === "commute") {
          await run('await h.settle("location", {found:false}); await h.call("setCommuteDestination", "東京"); await h.callTwice("analyzeCommute");');
        }
        if (ending === "switch") await run('await h.file("B.png", "image/png");');
        if (ending === "remove") await run('await h.call("removeFile");');
        if (ending === "unmount") await run('await h.unmount();');
        const before = await snapshot();
        const response = phase === "location" ? context : phase === "crime"
          ? { found: true, precision: "prefecture", prefecture: { name: "old" } }
          : { found: true, commute: { totalMinutes: 999 } };
        await run(`await h.settle("location", ${reject ? '"old failure"' : JSON.stringify(response)}, {reject:${reject}});`);
        const after = await snapshot();
        assert.deepEqual(after.state, before.state, `${phase}/${ending}/${reject}: no stale data, errors or loading`);
        assert.deepEqual(after.events, before.events, "stale location failure must not start crime fallback");
        cases++;
      }
    }
  }

  // A previous location retry cannot beat the new retry or clear its spinner.
  await report();
  await run(`await h.call("loadLocationContext", ${data}); await h.settle("location", "old timeout", {reject:true});`);
  assert.equal((await snapshot()).state.locationLoading, true);
  assert.equal((await snapshot()).pending.length, 1);
  await run(`await h.settle("location", ${JSON.stringify(context)});`);
  await run(`await h.call("loadLocationContext", ${data}); await h.settle("location", {found:true,crime:{old:true}});`);
  assert.equal((await snapshot()).state.crimeData, null, "old crime result ignored after location retry");
  await run('await h.settle("location", {error:"current timeout"}, {status:504});');
  assert.equal((await snapshot()).pending.length, 1, "current request still starts crime fallback");
  await run('await h.settle("location", {found:true,crime:{current:true}});');
  assert.deepEqual((await snapshot()).state.crimeData, { current: true });
  cases++;

  // A successful old share read may already have started location work before ID change.
  await run(`await h.mount("listing", "AAAAAAAA"); await h.settle("readShare", {result:${data}}); await h.setSharedId("BBBBBBBB");`);
  await run('await h.settle("location", "old failure", {reject:true});');
  assert.equal((await snapshot()).pending.length, 1, "only B's share read remains");
  assert.equal((await snapshot()).state.result, null);
  await run(`await h.settle("readShare", {result:${data}});`);
  assert.deepEqual((await snapshot()).state.result, analysis);
  cases++;

  // Both early PDF aspect callbacks and late blob URLs belong to their own file.
  await run('await h.mount("listing"); await h.file("A.pdf", "application/pdf"); await h.file("B.pdf", "application/pdf"); await h.previewAspect("B.pdf", 2); await h.previewAspect("A.pdf", 9);');
  assert.equal((await snapshot()).state.previewAspect, 2);
  await run('await h.settle("preview", {blobUrl:"blob:old",aspect:9});');
  assert.equal((await snapshot()).state.previewState, "rendering");
  assert.ok((await snapshot()).events.some(event => event.revokeUrl === "blob:old"));
  await run('await h.settle("preview", {blobUrl:"blob:new",aspect:2}); await h.file("C.pdf", "application/pdf"); await h.unmount(); await h.settle("preview", {blobUrl:"blob:unmounted",aspect:3});');
  assert.ok((await snapshot()).events.some(event => event.revokeUrl === "blob:unmounted"));
  cases++;

  await run('await h.mount("listing"); await h.file("A.png", "image/png"); await h.file("B.png", "image/png"); await h.imageLoaded(1, 200, 100); await h.imageLoaded(0, 900, 100);');
  assert.equal((await snapshot()).state.previewAspect, 2, "old image dimensions ignored");
  await run('await h.call("removeFile");');
  assert.equal((await snapshot()).state.previewAspect, null);
  cases++;

  for (const reject of [false, true]) {
    await report();
    await run('await h.call("setShareTitle", "old title"); await h.callTwice("createShareLink"); await h.callTwice("downloadPdf"); await h.file("B.png", "image/png");');
    const before = await snapshot();
    await run(`await h.settle("share", ${reject ? '"old failure"' : '{id:"OLDLINK"}'}, {reject:${reject}}); await h.settle("pdf", ${reject ? '"old failure"' : 'new Blob(["old pdf"])'}, {reject:${reject}});`);
    const after = await snapshot();
    assert.deepEqual(after.state, before.state, "old share and PDF cannot publish into B");
    assert.deepEqual(after.events, before.events, "old PDF must not trigger download");
    cases++;
  }
  console.log(`Listing race regression: ${cases} controlled cases passed.`);
}
