/* global URL, console */
import { readFileSync, writeFileSync } from 'node:fs';
import { Script } from 'node:vm';

new Script(readFileSync(new URL('../code.js', import.meta.url), 'utf8'), { filename: 'code.js' });
const uiPath = new URL('../ui.html', import.meta.url);
const previous = readFileSync(uiPath, 'utf8');
const libraryPath = new URL('../node_modules/pdf-lib/', import.meta.url);
const license = readFileSync(new URL('LICENSE.md', libraryPath), 'utf8');
const library = readFileSync(new URL('dist/pdf-lib.min.js', libraryPath), 'utf8').replace(/\/\/# sourceMappingURL=.*$/m, '');
const marker = /<script id="print-pdf-lib">[\s\S]*?<\/script>/;
if (!marker.test(previous)) throw new Error('Missing embedded PDF library marker.');
const html = previous.replace(marker, () => '<script id="print-pdf-lib">\n/* pdf-lib 1.17.1\n' + license + '\n*/\n' + library + '\n</script>');
if (html !== previous) writeFileSync(uiPath, html);
for (const [, script] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  new Script(script, { filename: 'ui.html' });
}
console.log('Embedded pdf-lib and checked code.js and UI scripts. Plugin files are ready to load.');
