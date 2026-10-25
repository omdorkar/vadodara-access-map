// AI street scan, Mac version (no installs: JXA + curl). The rules live in tools/scan_core.js.
// Usage (from the project folder):
//   osascript -l JavaScript tools/ai_scan.js "$PWD"
// The same scan runs every week on GitHub (.github/workflows/ai-scan.yml, using tools/ai_scan_node.js).
// Settings (city, area box, time zone) are in data/city.js. Mapillary detections are cached in ai_cache/ (not published).
ObjC.import('Foundation');
const app = Application.currentApplication(); app.includeStandardAdditions = true;

function readText(p){ const s = $.NSString.stringWithContentsOfFileEncodingError(p, $.NSUTF8StringEncoding, null); return s.isNil() ? null : s.js; }
function writeText(p, t){ $(t).writeToFileAtomicallyEncodingError(p, true, $.NSUTF8StringEncoding, null); }
function quoted(s){ return "'" + String(s).replace(/'/g, "'\\''") + "'"; }

function run(argv){
  const root = argv[0];
  if (!root) return 'Usage: osascript -l JavaScript tools/ai_scan.js "$PWD"';
  (0, eval)(readText(root + "/tools/scan_core.js"));
  const core = SCAN_CORE;
  const win = {}; new Function("window", readText(root + "/data/city.js"))(win); const cfg = win.CITY_CONFIG;
  const m = /MAPILLARY_TOKEN = "([^"]+)"/.exec(readText(root + "/index.html") || "");
  if (!m) return "No MAPILLARY_TOKEN found in index.html.";
  $.NSFileManager.defaultManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(root + "/ai_cache", true, $(), null);
  const ua = " -A " + quoted(core.UA) + " ";
  const io = {
    token: m[1],
    getJson: url => { try { return JSON.parse(app.doShellScript("curl -s --max-time 60" + ua + quoted(url))); } catch(e) { return null; } },
    postForm: (url, data) => { try { return JSON.parse(app.doShellScript("curl -s --max-time 90" + ua + "--data-urlencode " + quoted("data=" + data) + " " + quoted(url))); } catch(e) { return null; } },
    read: p => readText(root + "/" + p),
    write: (p, t) => writeText(root + "/" + p, t),
    sleep: s => delay(s),
    now: () => Date.now()
  };
  return core.run(io, cfg);
}
