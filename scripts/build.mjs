import {cp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import {resolve} from "node:path";

const root = process.cwd();
const out = resolve(root, "dist");
await rm(out, {recursive: true, force: true});
await mkdir(out, {recursive: true});

let origin = "https://zovop.github.io/lanp-official";
try {
  const cname = (await readFile(resolve(root, "CNAME"), "utf8")).trim().split(/\s+/)[0];
  if (cname) origin = `https://${cname.replace(/\/$/, "")}`;
  await cp(resolve(root, "CNAME"), resolve(out, "CNAME"));
} catch {
  // No custom domain file is present.
}

const files = [
  "index.html",
  "styles.css",
  "app.js",
  "stage.js",
  "stage-mode.js",
  "favicon.svg",
  "favicon-32.png",
  "apple-touch-icon.png",
  "og.png",
  "privacy.html",
  "credits.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
];

for (const file of files) {
  const source = await readFile(resolve(root, file));
  const textLike = /\.(html|css|js|txt|xml|svg)$/.test(file);
  const body = textLike
    ? Buffer.from(source.toString("utf8").replaceAll("https://zovop.github.io/lanp-official", origin))
    : source;
  await writeFile(resolve(out, file), body);
}

await cp(resolve(root, "fonts"), resolve(out, "fonts"), {recursive: true});
await writeFile(resolve(out, ".nojekyll"), "");
console.log(`Built LANP static site in dist/ (${origin})`);
