// Copy MediaPipe Tasks Vision WASM and worker files into public/mediapipe
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MOD = path.join(ROOT, 'node_modules', '@mediapipe', 'tasks-vision');
const PUB = path.join(ROOT, 'public', 'mediapipe');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function cp(src, dst) {
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
  console.log('copied', path.relative(ROOT, dst));
}

function copyIfExist(name, to = '') {
  const src = path.join(MOD, name);
  if (fs.existsSync(src)) {
    cp(src, path.join(PUB, to || path.basename(name)));
    return true;
  }
  return false;
}

function copyDirSafe(dir, to) {
  const srcDir = path.join(MOD, dir);
  if (!fs.existsSync(srcDir)) return;
  const files = fs.readdirSync(srcDir);
  for (const f of files) {
    const s = path.join(srcDir, f);
    const d = path.join(PUB, to || dir, f);
    if (fs.statSync(s).isDirectory()) {
      copyDirSafe(path.join(dir, f), path.join(to || dir, f));
    } else {
      cp(s, d);
    }
  }
}

ensureDir(PUB);
// Typical files across versions:
copyIfExist('vision_wasm_internal.wasm');
copyIfExist('vision_wasm_internal.js');
copyIfExist('vision_task_api_worker.js');
// Some versions keep assets under wasm/ subfolder
copyDirSafe('wasm', 'wasm');

console.log('MediaPipe WASM copy complete.');
