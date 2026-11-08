export function forcedStage(search) {
  const value = new URLSearchParams(search).get("stage");
  return value === "static" || value === "webgl" ? value : null;
}

export function stageMode({
  reducedMotion = false,
  coarsePointer = false,
  noHover = false,
  narrow = false,
  saveData = false,
  lowPower = false,
  webgl = true,
  forced = null,
} = {}) {
  if (reducedMotion) return "static";
  if (forced === "static") return "static";
  if (forced === "webgl") return webgl ? "webgl" : "static";
  if (coarsePointer || narrow || saveData || lowPower || !webgl) return "static";
  return "webgl";
}
