const GLOW_VERT = `
precision mediump float;
attribute vec2 aCorner;
varying vec2 vUv;
void main() {
  vUv = aCorner * 0.5 + 0.5;
  gl_Position = vec4(aCorner, 0.0, 1.0);
}
`;

const GLOW_FRAG = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uCenter;
uniform float uAspect;
uniform float uTime;
void main() {
  vec2 p = vec2((vUv.x - uCenter.x) * uAspect, vUv.y - uCenter.y);
  float d = length(p);
  float breathe = 0.94 + 0.06 * sin(uTime * 0.45);
  float core = exp(-d * d * 9.5) * 0.62 * breathe;
  float halo = exp(-d * 2.4) * 0.16;
  vec3 col = vec3(1.0, 0.34, 0.1) * core + vec3(0.72, 0.78, 0.86) * halo;

  vec2 beamA1 = vec2(uCenter.x - 0.08, 1.02);
  vec2 beamA2 = uCenter + vec2(-0.01, 0.02);
  vec2 pa = vUv - beamA1;
  vec2 ba = beamA2 - beamA1;
  float ha = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  float beamA = exp(-pow(length(pa - ba * ha) * uAspect * 22.0, 2.0));
  beamA *= smoothstep(0.0, 0.25, ha) * smoothstep(1.0, 0.45, ha);

  vec2 beamB1 = vec2(uCenter.x + 0.12, 1.05);
  vec2 beamB2 = uCenter + vec2(0.02, 0.0);
  vec2 pb = vUv - beamB1;
  vec2 bb = beamB2 - beamB1;
  float hb = clamp(dot(pb, bb) / dot(bb, bb), 0.0, 1.0);
  float beamB = exp(-pow(length(pb - bb * hb) * uAspect * 34.0, 2.0));
  beamB *= smoothstep(0.0, 0.2, hb) * smoothstep(1.0, 0.4, hb);

  col += vec3(1.0, 0.48, 0.22) * beamA * 0.28;
  col += vec3(0.78, 0.84, 0.92) * beamB * 0.14;

  vec2 floorP = vec2((vUv.x - (uCenter.x + 0.02)) * 1.15, (vUv.y - 0.2) * 2.4);
  float floorL = exp(-dot(floorP, floorP) * 2.2) * 0.28;
  col += vec3(1.0, 0.36, 0.12) * floorL;

  gl_FragColor = vec4(col, 1.0);
}
`;

const POINT_VERT = `
precision mediump float;
attribute vec3 aPos;
attribute float aSeed;
attribute float aKind;
uniform float uTime;
uniform vec2 uPointer;
uniform vec2 uViewport;
uniform float uDpr;
varying float vSeed;
varying float vKind;
varying float vTwinkle;
void main() {
  vec3 p = aPos;
  float spin = uTime * 0.13;
  float cs = cos(spin);
  float sn = sin(spin);
  p = vec3(cs * p.x + sn * p.z, p.y, -sn * p.x + cs * p.z);

  float tx = uPointer.y * 0.2;
  float ty = uPointer.x * 0.26;
  float cx = cos(tx);
  float sx = sin(tx);
  p = vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);
  float cy = cos(ty);
  float sy = sin(ty);
  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  p.y += sin(uTime * 0.32 + aSeed * 6.28318) * 0.012;

  float z = p.z + 3.65;
  float fov = 1.22;
  float aspect = uViewport.x / max(uViewport.y, 1.0);
  vec2 ndc;
  ndc.x = (p.x / z) * fov + 0.3;
  ndc.y = (p.y / z) * fov * aspect + 0.06;
  gl_Position = vec4(ndc, 0.0, 1.0);

  float size = mix(1.35, 4.8, aSeed);
  if (aKind > 1.5) size *= 1.7;
  gl_PointSize = clamp(size * uDpr * clamp(2.35 / z, 0.35, 2.4), 1.0, 24.0);
  vSeed = aSeed;
  vKind = aKind;
  vTwinkle = 0.64 + 0.36 * sin(uTime * 0.5 + aSeed * 6.28318);
}
`;

const POINT_FRAG = `
precision mediump float;
varying float vSeed;
varying float vKind;
varying float vTwinkle;
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = dot(uv, uv);
  if (d > 1.0) discard;
  float falloff = pow(1.0 - d, 1.55);
  vec3 orange = vec3(1.0, 0.33, 0.11);
  vec3 silver = vec3(0.76, 0.82, 0.9);
  vec3 dust = vec3(1.0, 0.58, 0.36);
  float orangeMix = step(0.5, vKind) * (1.0 - step(1.5, vKind));
  float dustMix = step(1.5, vKind);
  vec3 col = mix(silver, orange, orangeMix);
  col = mix(col, dust, dustMix);
  float alpha = falloff * vTwinkle;
  if (dustMix > 0.5) alpha *= 0.42;
  else if (orangeMix < 0.5) alpha *= 0.72;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "shader compile failed";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function program(gl, vert, frag, bind) {
  const p = gl.createProgram();
  const vs = compile(gl, gl.VERTEX_SHADER, vert);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  bind(p);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p) || "program link failed";
    gl.deleteProgram(p);
    throw new Error(log);
  }
  return p;
}

function ring(data, count, radius, tube, tilt, kind) {
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  for (let i = 0; i < count; i += 1) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const r = tube * (0.35 + Math.random());
    const x = (radius + r * Math.cos(v)) * Math.cos(u);
    const y0 = r * Math.sin(v) * 0.38;
    const z0 = (radius + r * Math.cos(v)) * Math.sin(u);
    const y = ct * y0 - st * z0;
    const z = st * y0 + ct * z0;
    data.push(x, y, z, Math.random(), kind);
  }
}

function dust(data, count) {
  for (let i = 0; i < count; i += 1) {
    const h = Math.random();
    const rad = Math.pow(Math.random(), 0.55) * 0.9 * (0.2 + h);
    const a = Math.random() * Math.PI * 2;
    data.push(Math.cos(a) * rad, 0.95 - h * 1.85, Math.sin(a) * rad * 0.32, Math.random(), 2);
  }
}

function isSoftware(gl) {
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  if (!ext) return false;
  const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "");
  return /swiftshader|llvmpipe|softpipe|software/i.test(renderer);
}

export function mountStage(canvas, {getPointer, onReady, onFallback} = {}) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    premultipliedAlpha: false,
  });
  if (!gl) {
    onFallback?.("no-context");
    return null;
  }

  let glowProg;
  let pointProg;
  try {
    glowProg = program(gl, GLOW_VERT, GLOW_FRAG, (p) => gl.bindAttribLocation(p, 0, "aCorner"));
    pointProg = program(gl, POINT_VERT, POINT_FRAG, (p) => {
      gl.bindAttribLocation(p, 0, "aPos");
      gl.bindAttribLocation(p, 1, "aSeed");
      gl.bindAttribLocation(p, 2, "aKind");
    });
  } catch (error) {
    canvas.dataset.glError = String(error.message || error);
    onFallback?.("shader");
    return null;
  }

  const software = isSoftware(gl);
  const positions = [];
  ring(positions, software ? 380 : 1280, 1.12, 0.07, 1.08, 1);
  ring(positions, software ? 180 : 620, 1.46, 0.025, 0.62, 0);
  dust(positions, software ? 70 : 240);
  const particles = new Float32Array(positions);

  const cornerBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const particleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, particleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, particles, gl.STATIC_DRAW);
  const count = particles.length / 5;

  const glowCenter = gl.getUniformLocation(glowProg, "uCenter");
  const glowAspect = gl.getUniformLocation(glowProg, "uAspect");
  const glowTime = gl.getUniformLocation(glowProg, "uTime");
  const pointTime = gl.getUniformLocation(pointProg, "uTime");
  const pointPointer = gl.getUniformLocation(pointProg, "uPointer");
  const pointViewport = gl.getUniformLocation(pointProg, "uViewport");
  const pointDpr = gl.getUniformLocation(pointProg, "uDpr");

  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(9 / 255, 8 / 255, 7 / 255, 1);

  const pointer = {x: 0, y: 0};
  let raf = 0;
  let running = false;
  let elapsed = 0;
  let last = 0;
  let dpr = 1;
  let cssWidth = 1;
  let cssHeight = 1;
  let readySent = false;
  const parent = canvas.parentElement || canvas;

  function resize() {
    cssWidth = Math.max(1, parent.clientWidth);
    cssHeight = Math.max(1, parent.clientHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, software ? 1 : 1.35);
    const maxEdge = software ? 1100 : 1600;
    dpr = Math.min(ratio, maxEdge / Math.max(cssWidth, cssHeight));
    const bw = Math.max(1, Math.floor(cssWidth * dpr));
    const bh = Math.max(1, Math.floor(cssHeight * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!last) last = now;
    elapsed += Math.min(0.05, (now - last) / 1000);
    last = now;
    const target = getPointer?.() || {x: 0, y: 0};
    pointer.x += (target.x - pointer.x) * 0.07;
    pointer.y += (target.y - pointer.y) * 0.07;

    gl.disable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    gl.useProgram(glowProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disableVertexAttribArray(1);
    gl.disableVertexAttribArray(2);
    gl.uniform2f(glowCenter, 0.66 + pointer.x * 0.03, 0.54 + pointer.y * 0.03);
    gl.uniform1f(glowAspect, cssWidth / cssHeight);
    gl.uniform1f(glowTime, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.useProgram(pointProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 12);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 20, 16);
    gl.uniform1f(pointTime, elapsed);
    gl.uniform2f(pointPointer, pointer.x, pointer.y);
    gl.uniform2f(pointViewport, cssWidth, cssHeight);
    gl.uniform1f(pointDpr, dpr);
    gl.drawArrays(gl.POINTS, 0, count);

    if (!readySent) {
      readySent = true;
      const error = gl.getError();
      if (error && error !== gl.NO_ERROR) {
        canvas.dataset.glError = `gl ${error}`;
        stop();
        onFallback?.("gl-error");
        return;
      }
      onReady?.();
    }
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(parent);
  resize();

  return {
    setActive(active) {
      if (active) start();
      else stop();
    },
    destroy() {
      stop();
      resizeObserver.disconnect();
      const lose = gl.getExtension("WEBGL_lose_context");
      lose?.loseContext();
    },
  };
}
