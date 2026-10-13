/* global URL, console */
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

new Script(readFileSync(new URL('../code.js', import.meta.url), 'utf8'), { filename: 'code.js' });
const html = readFileSync(new URL('../ui.html', import.meta.url), 'utf8');
for (const [, script] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  new Script(script, { filename: 'ui.html' });
}
console.log('Checked code.js and UI scripts. Plugin files are ready to load.');
