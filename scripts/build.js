const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const files = [
  "index.html",
  "product.html",
  "terms.html",
  "privacy.html",
  ".htaccess"
];

const dirs = ["assets", "public", "css", "js", "api", "private"];

function copyFile(rel) {
  const from = path.join(root, rel);
  const to = path.join(dist, rel);
  if (!fs.existsSync(from)) {
    throw new Error("Missing source file: " + rel);
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDir(rel) {
  const from = path.join(root, rel);
  if (!fs.existsSync(from)) {
    throw new Error("Missing source folder: " + rel);
  }
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const child = path.posix.join(rel.split(path.sep).join("/"), entry.name);
    if (entry.isDirectory()) copyDir(child);
    else if (entry.isFile()) copyFile(child);
  }
}

function localRefs(file) {
  const text = fs.readFileSync(file, "utf8");
  const found = [];
  const pattern = /(?:\b(?:src|href)\s*=\s*|url\(\s*)["']?([^"')\s]+)["']?/gi;
  let match;
  while ((match = pattern.exec(text))) {
    const raw = match[1];
    if (!raw || /^(?:https?:|\/\/|data:|mailto:|#|javascript:)/i.test(raw)) continue;
    const clean = decodeURIComponent(raw.split("#")[0].split("?")[0]);
    if (!clean) continue;
    found.push(clean);
  }
  return found;
}

function checkRefs() {
  const pages = [".html", ".css", ".js"];
  const missing = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (pages.includes(path.extname(entry.name))) {
        for (const ref of localRefs(full)) {
          const target = path.resolve(path.dirname(full), ref);
          if (!target.startsWith(dist)) continue;
          if (!fs.existsSync(target)) {
            missing.push(path.relative(dist, full) + " -> " + ref);
          }
        }
      }
    }
  }

  walk(dist);
  if (missing.length) {
    throw new Error("dist is missing files the site requests:\n  " + missing.join("\n  "));
  }
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of files) copyFile(file);
for (const dir of dirs) copyDir(dir);
checkRefs();

const required = ["index.html", ".htaccess", "assets", "public", "css/styles.css", "js/main.js"];
for (const item of required) {
  if (!fs.existsSync(path.join(dist, item))) {
    throw new Error("dist is missing " + item);
  }
}

console.log("dist ready:");
console.log("  index.html");
console.log("  .htaccess");
for (const dir of dirs) console.log("  " + dir + "/");
