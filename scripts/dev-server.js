const fs = require("fs");
const http = require("http");
const path = require("path");
const handler = require("serve-handler");

const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "api", "preview-data.json");
const port = Number(process.env.PORT) || 3000;
const clients = new Set();
let seq = 0;
let lastRecord = null;

function readRecord() {
  try {
    const parsed = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    if (parsed && typeof parsed === "object") lastRecord = parsed;
  } catch (error) {
    if (!lastRecord) throw error;
  }
  return lastRecord;
}

function payload() {
  const record = Object.assign({}, readRecord(), {
    live: true,
    seq: ++seq,
    asOf: new Date().toISOString()
  });
  return JSON.stringify(record);
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=UTF-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body);
}

function previewRequest(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, JSON.stringify({ live: false }));
    return;
  }

  const stream = url.searchParams.get("stream");
  if (!stream || stream === "0") {
    if (req.method === "HEAD") {
      res.writeHead(200, {
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-store"
      });
      res.end();
      return;
    }
    sendJson(res, 200, payload());
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=UTF-8",
    "Cache-Control": "no-store, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    "X-Content-Type-Options": "nosniff"
  });
  res.write("data: " + payload() + "\n\n");
  clients.add(res);
  req.on("close", function () {
    clients.delete(res);
  });
}

setInterval(function () {
  if (!clients.size) return;
  const message = "data: " + payload() + "\n\n";
  clients.forEach(function (res) {
    res.write(message);
  });
}, 2000);

const server = http.createServer(function (req, res) {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/preview.php" || url.pathname === "/api/preview") {
    try {
      previewRequest(req, res, url);
    } catch (error) {
      sendJson(res, 500, JSON.stringify({ live: false }));
    }
    return;
  }
  return handler(req, res, {
    public: root,
    directoryListing: false
  });
});

server.listen(port, function () {
  console.log("Caviren site http://localhost:" + port);
  console.log("Preview API  http://localhost:" + port + "/api/preview.php?stream=1");
});
