// AI street scan, Node version, used by the weekly GitHub Action. The rules live in tools/scan_core.js.
// Usage (from the project folder): node tools/ai_scan_node.js
// Token: MAPILLARY_TOKEN environment variable, or the MAPILLARY_TOKEN in index.html.
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const core = require("./scan_core.js");
const read = p => { try { return fs.readFileSync(path.join(root, p), "utf8"); } catch (e) { return null; } };

const sandbox = { window: {} };
vm.runInNewContext(read("data/city.js"), sandbox);
const cfg = sandbox.window.CITY_CONFIG;

const m = /MAPILLARY_TOKEN = "([^"]+)"/.exec(read("index.html") || "");
const token = process.env.MAPILLARY_TOKEN || (m && m[1]);
if (!token) { console.error("No Mapillary token."); process.exit(1); }
fs.mkdirSync(path.join(root, "ai_cache"), { recursive: true });

const curl = args => { try { return JSON.parse(execFileSync("curl", ["-s", "-A", core.UA].concat(args), { maxBuffer: 1 << 28 }).toString()); } catch (e) { return null; } };
const io = {
  token,
  getJson: url => curl(["--max-time", "60", url]),
  postForm: (url, data) => curl(["--max-time", "90", "--data-urlencode", "data=" + data, url]),
  read,
  write: (p, t) => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), t); },
  sleep: s => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.ceil(s * 1000)),
  now: () => Date.now()
};
console.log(core.run(io, cfg));
