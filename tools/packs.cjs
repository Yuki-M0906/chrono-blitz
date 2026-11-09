// Reads data/*.js (the asset packs written by build-sprites.mjs) without executing them.
// Each pack is one line: CB_ASSETS.add("<kind>",<json>,<bytes>);
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), dir = path.join(root, 'data');
function readPacks() {
  const html = fs.readFileSync(path.join(root, 'ai_studio_code.html'), 'utf8');
  const names = [...html.matchAll(/<script src="data\/([\w-]+)\.js\?v=([0-9a-f]+)"/g)].map(m => m[1]);
  const assets = { sprites: {}, stages: [], voices: {}, beltArt: {} }, files = [];
  for (const name of names) {
    const file = path.join(dir, name + '.js'), text = fs.readFileSync(file, 'utf8');
    const m = text.match(/^CB_ASSETS\.add\("(\w+)",(.*),(\d+)\);\n$/s);
    if (!m) throw new Error('Unexpected pack format: ' + name);
    const data = JSON.parse(m[2]);
    if (Number(m[3]) !== m[2].length) throw new Error('Pack byte count mismatch: ' + name);
    if (Array.isArray(assets[m[1]])) assets[m[1]].push(...data); else Object.assign(assets[m[1]], data);
    files.push({ name, kind: m[1], size: fs.statSync(file).size });
  }
  return { assets, files, names, all: JSON.stringify(assets) };
}
module.exports = { readPacks, root, dir };
