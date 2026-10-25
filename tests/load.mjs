// Loads the logic blocks (<script id="...">) straight out of index.html into one vm context.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

export function loadQubic(...ids) {
  const context = vm.createContext({ console, performance, Math, Date });
  for (const id of ids) {
    const m = html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)</script>`));
    if (!m) throw new Error(`no <script id="${id}"> in index.html`);
    vm.runInContext(m[1], context, { filename: `index.html#${id}` });
  }
  return context.Qubic;
}

// 64-array of ''|'X'|'O' with X on the cells in xs and O on the cells in os.
export function boardOf(xs, os) {
  const b = Array(64).fill('');
  xs.forEach(i => { b[i] = 'X'; });
  os.forEach(i => { b[i] = 'O'; });
  return b;
}
