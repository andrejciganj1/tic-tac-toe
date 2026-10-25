// Runs a scenario script inside index.html in headless Chrome and returns the JSON it reports.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export function chromeAvailable() { return fs.existsSync(CHROME); }

const unescape = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

function chromeArgs(dir, extra, file) {
  return ['--headless=new', '--disable-gpu', '--no-first-run', '--window-size=360,640',
    '--virtual-time-budget=6000', '--user-data-dir=' + path.join(dir, 'profile'), ...extra, 'file://' + file];
}

// Copies index.html into a temp dir with an error catcher in <head> and the scenario before </body>.
function prepare(dir, js) {
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const catcher = `<script>window.__errors = []; window.addEventListener('error', e => window.__errors.push(String(e.message)));</script>`;
  const scenario = `<script>(async () => { const out = { errors: window.__errors }; try { ${js}\n } catch (e) { out.errors.push(String(e && e.stack || e)); } document.title = 'RESULT:' + JSON.stringify(out); })();</script>`;
  const html = src.replace('<head>', () => '<head>' + catcher).replace('</body>', () => scenario + '</body>');
  const file = path.join(dir, 'index.html');
  fs.writeFileSync(file, html);
  for (const f of ['manifest.json', 'icon.png']) if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
  return file;
}

export async function runScenario(js, { screenshot } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qubic-'));
  try {
    const file = prepare(dir, js);
    const r = spawnSync(CHROME, chromeArgs(dir, ['--dump-dom'], file), { encoding: 'utf8', timeout: 60000, maxBuffer: 1 << 26 });
    const m = /<title>RESULT:([\s\S]*?)<\/title>/.exec(r.stdout || '');
    if (!m) throw new Error('No RESULT in page title. stderr: ' + (r.stderr || '').slice(0, 500));
    const out = JSON.parse(unescape(m[1]));
    if (screenshot) {
      spawnSync(CHROME, chromeArgs(dir, ['--screenshot=' + screenshot], file), { encoding: 'utf8', timeout: 60000 });
    }
    return out;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
