import assert from "node:assert/strict";
import test from "node:test";
import {forcedStage, stageMode} from "../stage-mode.js";

const desktop = {webgl: true};

test("desktop with WebGL uses the particle stage", () => {
  assert.equal(stageMode(desktop), "webgl");
});

test("reduced motion stays static even if webgl is forced", () => {
  assert.equal(stageMode({...desktop, reducedMotion: true, forced: "webgl"}), "static");
});

test("query and capability fallbacks", () => {
  assert.equal(stageMode({...desktop, forced: "static"}), "static");
  assert.equal(stageMode({...desktop, webgl: false, forced: "webgl"}), "static");
  assert.equal(stageMode({...desktop, coarsePointer: true}), "static");
  assert.equal(stageMode({...desktop, noHover: true}), "webgl");
  assert.equal(stageMode({...desktop, narrow: true}), "static");
  assert.equal(stageMode({...desktop, saveData: true}), "static");
  assert.equal(stageMode({...desktop, lowPower: true}), "static");
  assert.equal(stageMode({...desktop, webgl: false}), "static");
  assert.equal(stageMode({...desktop, narrow: true, forced: "webgl"}), "webgl");
});

test("forced stage query parsing", () => {
  assert.equal(forcedStage("?stage=static"), "static");
  assert.equal(forcedStage("?stage=webgl"), "webgl");
  assert.equal(forcedStage("?stage=nope"), null);
  assert.equal(forcedStage(""), null);
});
