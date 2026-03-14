const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 80;
// Serve from dist/ (Vite build output) if it exists, otherwise fall back to root
const distDir = path.join(__dirname, "dist");
const DIR = fs.existsSync(distDir) ? distDir : path.join(__dirname);

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

const server = http.createServer((req, res) => {
  // CORS for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");

  let url = req.url.split("?")[0];
  if (url === "/") url = "/index.html";

  const filePath = path.join(DIR, url);
  // Security: stay within DIR
  if (!filePath.startsWith(DIR)) { res.writeHead(403); res.end(); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";
    // No caching — always serve fresh
    res.writeHead(200, {
      "Content-Type": mime,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Aurora Log dev server running on http://localhost:${PORT}`);
  console.log(`Serving from: ${DIR}`);
  console.log(`LAN access: http://<your-ip>:${PORT}`);
});
