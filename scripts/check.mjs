import {access, readFile} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {dirname, resolve} from "node:path";

function lin(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const raw = hex.replace("#", "");
  const rgb = [0, 2, 4].map((index) => lin(Number.parseInt(raw.slice(index, index + 2), 16)));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const pages = ["index.html", "privacy.html", "credits.html", "404.html"];
for (const page of pages) {
  const html = await readFile(page, "utf8");
  if (!/<html[^>]*lang="zh-CN"/.test(html)) throw new Error(`${page}: missing Chinese language`);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const raw = match[1];
    if (/^(https?:|mailto:|data:)/.test(raw)) continue;
    const [path, hash] = raw.split("#");
    if (!path && hash && !ids.has(hash)) throw new Error(`${page}: broken anchor #${hash}`);
    if (path) await access(resolve(dirname(page), path.split("?")[0]));
  }
  console.log(`${page}: local links and assets OK`);
}

const home = await readFile("index.html", "utf8");
const css = await readFile("styles.css", "utf8");
const app = await readFile("app.js", "utf8");
const stage = await readFile("stage.js", "utf8");
const required = [
  "让热爱，走到聚光灯下",
  "扎根四川，连接创作者与观众。LANP 以内容与创意，探索更多元的娱乐表达。",
  "LANP 文化传媒有限公司",
  "2021",
  "四川",
  "文化传媒",
  "娱乐内容",
  "文化表达",
  "成员共创",
  "联系方式待补充",
  "备案信息待补充",
  "正式标志待补充",
  "请勿将其理解为客户案例",
  'href="#about"',
  'href="#join"',
  'href="#partner"',
];
for (const phrase of required) {
  if (!home.includes(phrase)) throw new Error(`index.html missing: ${phrase}`);
}
const banned = [/有限战队/, /unsplash/i, /蜀ICP/, /ICP备/, /mailto:/i, /提交成功/, /已发送/];
for (const pattern of banned) {
  if (pattern.test(home)) throw new Error(`index.html contains forbidden ${pattern}`);
}
if (!css.includes("prefers-reduced-motion")) throw new Error("styles.css missing reduced-motion fallback");
if (!stage.includes("visibilitychange") && !app.includes("visibilitychange")) {
  throw new Error("motion loop is not paused when the page is hidden");
}
if (!stage.includes("cancelAnimationFrame")) throw new Error("stage loop cannot be cancelled");
if (!/addEventListener\("pointermove"/.test(app)) throw new Error("pointer parallax is missing");
if (app.includes("preventDefault") && app.includes("wheel")) throw new Error("wheel events must not be hijacked");

for (const [fg, bg, min] of [
  ["#f4efe6", "#090807", 7],
  ["#e6e0d6", "#090807", 7],
  ["#b7b1a8", "#090807", 4.5],
  ["#cfc8be", "#110e0c", 4.5],
  ["#1c0d08", "#ff4b1f", 4.5],
  ["#1a1612", "#f3eee6", 7],
  ["#5e584f", "#f3eee6", 4.5],
  ["#3a342e", "#f3eee6", 4.5],
  ["#ffb088", "#090807", 3],
  ["#9a2508", "#f3eee6", 3],
]) {
  const ratio = contrast(fg, bg);
  if (ratio < min) throw new Error(`${fg} on ${bg} contrast ${ratio.toFixed(2)} < ${min}`);
}

for (const file of ["app.js", "stage.js", "stage-mode.js", "scripts/build.mjs", "scripts/serve.mjs", "scripts/check.mjs"]) {
  execFileSync(process.execPath, ["--check", file], {stdio: "inherit"});
}
console.log("copy, contrast, syntax: OK");
