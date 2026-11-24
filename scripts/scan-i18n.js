const fs = require("fs");
const path = require("path");

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (["node_modules", ".expo", "android", "ios", "dist", "scripts"].includes(e.name)) continue;
      walk(p, acc);
    } else if (/\.(tsx|ts)$/.test(e.name) && !e.name.endsWith(".d.ts")) {
      acc.push(p);
    }
  }
  return acc;
}

const root = path.resolve(__dirname, "..");
const roots = ["app", "components", "hooks"].map((d) => path.join(root, d)).filter(fs.existsSync);
const files = roots.flatMap((d) => walk(d));
const used = new Set();
const lit = /\bt\(\s*["']([^"']+)["']\s*\)/g;

for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  let m;
  while ((m = lit.exec(s))) used.add(m[1]);
}

const i18nPath = path.join(root, "utils", "i18n.tsx");
const i18n = fs.readFileSync(i18nPath, "utf8");
const startHi = i18n.indexOf("\n  hi: {");
const startMr = i18n.indexOf("\n  mr: {");
const endMr = i18n.indexOf("\n};", startMr);
if (startHi < 0 || startMr < 0 || endMr < 0) {
  console.error("Could not locate hi/mr blocks", { startHi, startMr, endMr });
  process.exit(1);
}

function parseKeys(body) {
  const k = new Set();
  const quoted = /^\s*["']([^"']+)["']\s*:/gm;
  let m;
  while ((m = quoted.exec(body))) k.add(m[1]);
  const bare = /^\s*([A-Za-z][A-Za-z0-9 ]*)\s*:/gm;
  while ((m = bare.exec(body))) {
    if (!["true", "false", "null"].includes(m[1])) k.add(m[1]);
  }
  return k;
}

const hi = parseKeys(i18n.slice(startHi, startMr));
const mr = parseKeys(i18n.slice(startMr, endMr));
const missingBoth = [...used].filter((k) => !hi.has(k) || !mr.has(k)).sort();

fs.writeFileSync(
  path.join(__dirname, "i18n-missing.json"),
  JSON.stringify(
    {
      used: used.size,
      missingHi: [...used].filter((k) => !hi.has(k)).sort(),
      missingMr: [...used].filter((k) => !mr.has(k)).sort(),
      missingBoth,
    },
    null,
    2,
  ),
);
console.log("used", used.size);
console.log("missingHi", [...used].filter((k) => !hi.has(k)).length);
console.log("missingMr", [...used].filter((k) => !mr.has(k)).length);
console.log("wrote scripts/i18n-missing.json");
