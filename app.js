import {forcedStage, stageMode} from "./stage-mode.js";

const root = document.documentElement;
const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const narrowQuery = window.matchMedia("(max-width: 860px)");
const coarseQuery = window.matchMedia("(pointer: coarse)");
const hoverQuery = window.matchMedia("(hover: hover)");
const fineQuery = window.matchMedia("(pointer: fine)");

function connectionSaveData() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return Boolean(connection && connection.saveData);
}

function lowPower() {
  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  return (typeof memory === "number" && memory > 0 && memory <= 2)
    || (typeof cores === "number" && cores > 0 && cores <= 2);
}

function stageSignals() {
  return {
    reducedMotion: reducedQuery.matches,
    coarsePointer: coarseQuery.matches,
    noHover: !hoverQuery.matches,
    narrow: narrowQuery.matches,
    saveData: connectionSaveData(),
    lowPower: lowPower(),
    webgl: true,
    forced: forcedStage(location.search),
  };
}

const pointer = {x: 0, y: 0};
let stageHandle = null;
let stageStarting = false;

function setStage(mode, reason) {
  root.dataset.stage = mode;
  root.dataset.stageReason = reason;
}

async function destroyStage() {
  stageHandle?.destroy();
  stageHandle = null;
  const canvas = document.getElementById("stage-canvas");
  if (canvas) canvas.hidden = true;
}

async function setupStage() {
  const stage = document.getElementById("stage");
  const canvas = document.getElementById("stage-canvas");
  if (!stage || !canvas || stageStarting) return;
  const signals = stageSignals();
  const mode = stageMode(signals);
  if (mode !== "webgl") {
    await destroyStage();
    const reason = signals.reducedMotion ? "reduced"
      : signals.forced === "static" ? "forced-static"
      : signals.narrow ? "narrow"
      : signals.coarsePointer ? "coarse"
      : signals.noHover ? "no-hover"
      : signals.saveData ? "save-data"
      : signals.lowPower ? "low-power"
      : "static";
    setStage("static", reason);
    return;
  }
  if (stageHandle) return;
  stageStarting = true;
  try {
    const mod = await import("./stage.js");
    canvas.hidden = false;
    stageHandle = mod.mountStage(canvas, {
      getPointer: () => pointer,
      onReady: () => setStage("webgl", "running"),
      onFallback: (reason) => {
        canvas.hidden = true;
        stageHandle = null;
        setStage("static", reason || "fallback");
      },
    });
    if (!stageHandle) {
      canvas.hidden = true;
      if (!root.dataset.stage) setStage("static", "unavailable");
    } else {
      const rect = stage.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight && !document.hidden;
      root.classList.toggle("motion-paused", !visible);
      stageHandle.setActive(visible);
    }
  } catch {
    canvas.hidden = true;
    stageHandle = null;
    setStage("static", "error");
  } finally {
    stageStarting = false;
  }
}

function bindParallax() {
  const hero = document.querySelector(".hero");
  if (!hero || reducedQuery.matches || !fineQuery.matches) return;
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
    pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
    hero.style.setProperty("--px", pointer.x.toFixed(4));
    hero.style.setProperty("--py", pointer.y.toFixed(4));
  }, {passive: true});
  hero.addEventListener("pointerleave", () => {
    pointer.x = 0;
    pointer.y = 0;
    hero.style.setProperty("--px", "0");
    hero.style.setProperty("--py", "0");
  });
}

function bindMagnet() {
  if (reducedQuery.matches || !fineQuery.matches) return;
  document.querySelectorAll("[data-magnet]").forEach((el) => {
    el.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate(${(x * 0.18).toFixed(2)}px, ${(y * 0.28).toFixed(2)}px)`;
    });
    const reset = () => { el.style.transform = ""; };
    el.addEventListener("pointerleave", reset);
    el.addEventListener("blur", reset);
  });
}

function bindAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: reducedQuery.matches ? "auto" : "smooth",
        block: "start",
      });
      const hash = `#${id}`;
      if (location.hash !== hash) history.pushState(null, "", hash);
    });
  });
}

function bindMenu() {
  const toggle = document.querySelector(".nav-toggle");
  const panel = document.getElementById("nav-panel");
  const main = document.querySelector("main");
  const footer = document.querySelector(".footer");
  if (!toggle || !panel) return;

  function setOpen(open) {
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    const label = toggle.querySelector(".sr-only");
    if (label) label.textContent = open ? "关闭导航菜单" : "打开导航菜单";
    if (main) main.inert = open;
    if (footer) footer.inert = open;
    if (open) panel.querySelector("a")?.focus();
    else if (panel.contains(document.activeElement)) toggle.focus();
  }

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });
  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
      setOpen(false);
    }
    if (event.key !== "Tab" || !document.body.classList.contains("nav-open")) return;
    const items = [toggle, ...panel.querySelectorAll("a")];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  narrowQuery.addEventListener("change", (event) => {
    if (!event.matches) setOpen(false);
  });
}

function bindReveal() {
  const nodes = [...document.querySelectorAll("[data-reveal]")];
  if (!nodes.length) return;
  const show = (node) => {
    node.classList.add("is-in");
    if (node.id === "growth") node.classList.add("is-lit");
  };
  if (reducedQuery.matches || !("IntersectionObserver" in window)) {
    nodes.forEach(show);
    return;
  }
  root.classList.add("enhance");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      show(entry.target);
      observer.unobserve(entry.target);
    });
  }, {threshold: 0.18});
  nodes.forEach((node) => observer.observe(node));
  window.setTimeout(() => nodes.forEach(show), 1800);
}

function bindScroll() {
  const header = document.querySelector(".nav");
  const bar = document.querySelector(".scroll-progress");
  const links = [...document.querySelectorAll("#nav-panel a[href^='#']")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar) bar.style.transform = `scaleX(${progress})`;
      header?.classList.toggle("is-scrolled", window.scrollY > 8);
    });
  }

  if (header || bar) {
    onScroll();
    document.addEventListener("scroll", onScroll, {passive: true});
    window.addEventListener("resize", onScroll);
  }

  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        links.forEach((link) => {
          if (link.getAttribute("href") === id) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, {rootMargin: "-42% 0px -48% 0px"});
    sections.forEach((section) => spy.observe(section));
  }
}

function bindGallery() {
  const track = document.getElementById("gallery-track");
  if (!track) return;
  const tools = document.querySelector(".gallery-tools");
  const progress = document.querySelector(".gallery-progress span");
  const reduced = () => reducedQuery.matches;

  function step(direction) {
    const card = track.querySelector(".plate");
    const delta = (card?.getBoundingClientRect().width || 320) + 18;
    track.scrollBy({left: direction * delta, behavior: reduced() ? "auto" : "smooth"});
  }

  document.querySelectorAll("[data-gallery]").forEach((button) => {
    button.addEventListener("click", () => step(button.dataset.gallery === "next" ? 1 : -1));
  });

  function sync() {
    const overflow = track.scrollWidth > track.clientWidth + 8;
    track.tabIndex = overflow ? 0 : -1;
    if (tools) tools.hidden = !overflow;
  }

  function onScroll() {
    if (!progress) return;
    const max = track.scrollWidth - track.clientWidth;
    const value = max > 0 ? track.scrollLeft / max : 0;
    progress.style.transform = `scaleX(${value})`;
  }

  track.addEventListener("scroll", onScroll, {passive: true});
  track.addEventListener("keydown", (event) => {
    if (track.tabIndex !== 0) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  });
  sync();
  onScroll();
  window.addEventListener("resize", sync);
}

function bindMotionPause() {
  const stage = document.getElementById("stage");
  if (!stage) return;
  let visible = true;
  const sync = () => {
    const active = visible && !document.hidden;
    root.classList.toggle("motion-paused", !active);
    stageHandle?.setActive(active);
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, {threshold: 0.02});
    observer.observe(stage);
  }
  document.addEventListener("visibilitychange", sync);
}

function bindStageLifecycle() {
  const refresh = () => {
    if (reducedQuery.matches) root.classList.add("reduce");
    else root.classList.remove("reduce");
    setupStage();
  };
  refresh();
  reducedQuery.addEventListener("change", async () => {
    await destroyStage();
    if (reducedQuery.matches) {
      root.classList.add("reduce");
      document.querySelectorAll("[data-reveal]").forEach((node) => {
        node.classList.add("is-in");
        if (node.id === "growth") node.classList.add("is-lit");
      });
    }
    refresh();
  });
  narrowQuery.addEventListener("change", async () => {
    await destroyStage();
    refresh();
  });
}

bindAnchors();
bindMenu();
bindReveal();
bindScroll();
bindGallery();
bindParallax();
bindMagnet();
bindMotionPause();
bindStageLifecycle();
