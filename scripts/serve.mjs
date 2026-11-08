import http from "node:http";
import {readFile, stat} from "node:fs/promises";
import {extname, resolve, sep} from "node:path";

const root = resolve(process.argv.includes("--dist") ? "dist" : ".");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname);
    const base = "/lanp-official";
    if (pathname === base || pathname.startsWith(`${base}/`)) pathname = pathname.slice(base.length) || "/";
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const info = await stat(file);
    if (info.isDirectory()) file = resolve(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(body);
  } catch {
    try {
      const body = await readFile(resolve(root, "404.html"));
      res.writeHead(404, {"Content-Type": "text/html; charset=utf-8"}).end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  }
});

server.listen(4173, "127.0.0.1", () => {
  console.log("Local: http://127.0.0.1:4173");
  console.log("Subpath: http://127.0.0.1:4173/lanp-official/");
});
