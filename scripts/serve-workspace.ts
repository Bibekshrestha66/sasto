import { createServer } from "http";
import { promises as fs } from "fs";
import { extname, join, normalize, sep } from "path";

const port = Number(process.env.PORT || 3000);
const rootDir = normalize(process.cwd());

const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".ts": "application/typescript",
  ".tsx": "application/typescript",
  ".md": "text/markdown",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
};

function sanitizePath(pathname: string) {
  const normalized = normalize(pathname).replace(/^\.+/, "");
  return normalized.split(sep).join("/");
}

async function sendListing(res: any, dirPath: string, requestUrl: string) {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const rows = items.map(item => {
    const slash = item.isDirectory() ? "/" : "";
    const href = `${requestUrl.replace(/\/?$/, "")}/${item.name}${slash}`;
    return `<li><a href="${href}">${item.name}${slash}</a></li>`;
  }).join("\n");

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!doctype html><html><head><meta charset="utf-8"><title>Workspace Host</title></head><body><h1>Directory listing for ${requestUrl}</h1><ul>${rows}</ul></body></html>`);
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Bad request\n");
    return;
  }

  const urlPath = sanitizePath(decodeURIComponent(req.url.split("?")[0]));
  let filePath = join(rootDir, urlPath);

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden\n");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      const indexFile = join(filePath, "index.html");
      try {
        await fs.access(indexFile);
        filePath = indexFile;
      } catch {
        await sendListing(res, filePath, req.url);
        return;
      }
    }

    const data = await fs.readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store" });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end(`Not found: ${req.url}\n`);
  }
});

server.listen(port, () => {
  console.log(`Serving workspace at http://localhost:${port}/`);
});
