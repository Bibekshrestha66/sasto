import { createServer } from "http";
import { readFile } from "fs/promises";
import { resolve } from "node:path";

const port = Number(process.env.PORT || 4000);
const filePath = resolve(process.cwd(), "tsconfig.json");

const server = createServer(async (req, res) => {
  if (!req.url || (req.url !== "/" && req.url !== "/tsconfig.json")) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found\n");
    return;
  }

  try {
    const file = await readFile(filePath, "utf8");
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(file);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(`Failed to read tsconfig.json: ${error instanceof Error ? error.message : String(error)}\n`);
  }
});

server.listen(port, () => {
  console.log(`Serving tsconfig.json at http://localhost:${port}/tsconfig.json`);
});
