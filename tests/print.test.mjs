/* global Blob, URL, setTimeout, clearTimeout */
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import { PDFDocument, PDFName, PDFRawStream, StandardFonts, decodePDFRawStream, rgb } from 'pdf-lib';

const backend = readFileSync(new URL('../code.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../ui.html', import.meta.url), 'utf8');
const core = html.match(/<script id="print-pdf-core">([\s\S]*?)<\/script>/)[1];

function pdfContext() {
  const context = vm.createContext({ Blob, Uint8Array, ArrayBuffer, setTimeout, clearTimeout });
  vm.runInContext(html.match(/<script id="print-pdf-lib">([\s\S]*?)<\/script>/)[1], context);
  vm.runInContext(core, context);
  return context;
}

function mockFigma(selection = []) {
  const messages = [];
  const created = [];
  const listeners = {};
  const figma = {
    root: { setRelaunchData() {} }, showUI() {},
    ui: { postMessage(message) { messages.push(message); } },
    currentPage: { selection },
    viewport: { center: { x: 100, y: 200 }, scrollAndZoomIntoView() {} },
    on(event, callback) { listeners[event] = callback; },
    createFrame() {
      const node = { resize(width, height) { this.width = width; this.height = height; } };
      created.push(node);
      return node;
    },
  };
  const context = vm.createContext({ figma, __html__: '' });
  vm.runInContext(backend, context);
  return { figma, messages, created, listeners, context, send: message => figma.ui.onmessage(message) };
}

function frame(name = 'Print', width = 72, height = 144) {
  return { name, type: 'FRAME', width, height,
    absoluteTransform: [[1, 0, 0], [0, 1, 0]],
    async exportAsync(settings) { this.settings = settings; return new Uint8Array([1, 2, 3]); } };
}

test('cm, mm and inch inputs preserve exact print dimensions', async () => {
  for (const [unit, width, expected] of [['cm', 7, 7 / 2.54 * 72], ['mm', 70, 70 / 25.4 * 72], ['in', 1, 72],
    ['mm', 5080, 14400], ['cm', 508, 14400], ['in', 200, 14400]]) {
    const m = mockFigma();
    await m.send({ type: 'PRINT_CREATE_FRAME', width, height: width, unit });
    assert.equal(m.created.length, 1);
    assert.ok(Math.abs(m.created[0].width - expected) < 1e-10);
    assert.equal(m.created[0].height, m.created[0].width);
    assert.equal(m.figma.currentPage.selection[0], m.created[0]);
    assert.ok(Math.abs(m.created[0].x - (100 - expected / 2)) < 1e-10);
  }
});

test('invalid dimensions never create a frame', async () => {
  for (const data of [{ width: 0 }, { width: -1 }, { width: NaN }, { width: Infinity },
    { width: '7' }, { unit: 'px' }, { unit: 'toString' }, { width: 201, unit: 'in' }, { height: 0.000001 }]) {
    const m = mockFigma();
    await m.send({ type: 'PRINT_CREATE_FRAME', width: 7, height: 7, unit: 'cm', ...data });
    assert.equal(m.created.length, 0);
    assert.equal(m.messages.at(-1).type, 'PRINT_ERROR');
  }
});

test('PDF exports capture selection and request native sRGB vector PDFs one page at a time', async () => {
  const first = frame('First', 7 / 2.54 * 72, 7 / 2.54 * 72);
  const second = frame('Second');
  const m = mockFigma([first, second]);
  await m.send({ type: 'PRINT_EXPORT_START', requestId: 1 });
  assert.equal(first.settings, undefined);
  assert.equal(m.messages.at(-1).count, 2);
  m.figma.currentPage.selection = [frame('Changed selection')];
  await m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
  assert.equal(m.messages.at(-1).name, 'First');
  assert.equal(m.messages.at(-1).width, first.width);
  assert.equal(first.settings.format, 'PDF');
  assert.equal(first.settings.constraint, undefined);
  assert.equal(first.settings.colorProfile, 'SRGB');
  assert.equal(first.settings.useAbsoluteBounds, true);
  await m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
  assert.equal(m.messages.at(-1).name, 'Second');
  assert.equal(m.messages.at(-1).index, 1);
  const count = m.messages.length;
  await m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
  assert.equal(m.messages.length, count);
});

test('invalid selection, request IDs, transforms and page sizes fail before exporting', async () => {
  const rotated = frame();
  rotated.absoluteTransform = [[0, -1, 0], [1, 0, 0]];
  for (const [nodes, options] of [[[], {}], [[{ ...frame(), type: 'RECTANGLE' }], {}],
    [[rotated], {}], [[frame('Huge', 14401, 72)], {}], [[frame('Invalid', NaN, 72)], {}],
    [[frame('Invalid', 72, Infinity)], {}], [Array.from({ length: 51 }, () => frame()), {}],
    [[frame()], { requestId: NaN }], [[frame()], { requestId: -1 }], [[frame()], { outlineText: 'true' }],
    [[frame('Tiny', 0.001, 72)], {}]]) {
    const m = mockFigma(nodes);
    await m.send({ type: 'PRINT_EXPORT_START', requestId: 1, ...options });
    assert.equal(m.messages.at(-1).type, 'PRINT_ERROR');
    assert.ok(nodes.every(node => node.settings === undefined));
  }
});

test('native PDFs allow large vector pages and selections formerly blocked by raster limits', async () => {
  const nodes = [frame('Large', 14400, 14400), ...Array.from({ length: 5 }, () => frame('A4', 595.276, 841.89))];
  const m = mockFigma(nodes);
  await m.send({ type: 'PRINT_EXPORT_START', requestId: 1 });
  assert.equal(m.messages.at(-1).type, 'PRINT_EXPORT_READY');
  assert.equal(m.messages.at(-1).count, 6);
  await m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
  assert.equal(nodes[0].settings.format, 'PDF');
});

test('resizing or deleting a captured frame aborts, and export failures allow retry', async () => {
  for (const change of [node => { node.width++; }, node => { node.removed = true; },
    node => { node.exportAsync = async () => { throw new Error('Figma render failed'); }; }]) {
    const node = frame();
    const m = mockFigma([node]);
    await m.send({ type: 'PRINT_EXPORT_START', requestId: 1 });
    change(node);
    await m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
    assert.equal(m.messages.at(-1).type, 'PRINT_ERROR');
    m.figma.currentPage.selection = [frame()];
    await m.send({ type: 'PRINT_EXPORT_START', requestId: 2 });
    assert.equal(m.messages.at(-1).type, 'PRINT_EXPORT_READY');
  }
});

test('cancelled in-flight renders and stale requests cannot leak into the next export', async () => {
  const node = frame();
  let resolve;
  node.exportAsync = () => new Promise(done => { resolve = done; });
  const m = mockFigma([node]);
  await m.send({ type: 'PRINT_EXPORT_START', requestId: 1 });
  const rendering = m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
  await m.send({ type: 'PRINT_EXPORT_CANCEL', requestId: 1 });
  await m.send({ type: 'PRINT_EXPORT_START', requestId: 2 });
  resolve(new Uint8Array([1]));
  await rendering;
  await m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
  assert.equal(m.messages.filter(msg => msg.type === 'PRINT_EXPORT_PAGE').length, 0);
  assert.equal(m.messages.at(-1).requestId, 2);
});

function outlineFixture(m) {
  const copies = [], flattened = [], detached = [], fonts = [];
  function node(type, name, children = [], properties = {}) {
    const item = { type, name, children, width: 72, height: 20, visible: true, removed: false,
      relativeTransform: [[1, 0, 10], [0, 1, 20]], absoluteTransform: [[1, 0, 0], [0, 1, 0]],
      resolvedVariableModes: {}, ...properties,
      resizeWithoutConstraints(width, height) { this.width = width; this.height = height; },
      remove() {
        this.removed = true;
        if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1);
      },
      getRangeAllFontNames() { return this.fonts || [{ family: 'Inter', style: 'Regular' }]; },
      setExplicitVariableModeForCollection(collection, mode) { this.resolvedVariableModes[collection.id] = mode; },
      clone() {
        const copy = node(this.type, this.name, this.children.map(child => child.clone()), {
          width: this.width, height: this.height, visible: this.visible,
          relativeTransform: this.relativeTransform.map(row => [...row]),
          characters: this.characters, hasMissingFont: this.hasMissingFont, fonts: this.fonts,
          fills: this.fills, resolvedVariableModes: {},
        });
        if ('layoutMode' in this) copy.layoutMode = this.layoutMode;
        if (this === source) copies.push(copy);
        return copy;
      },
      detachInstance() {
        assert.equal(this.type, 'INSTANCE');
        assert.notEqual(this.parent?.type, 'INSTANCE', 'detach outer instances first');
        detached.push(this.name);
        const frame = node('FRAME', this.name, this.children, {
          width: this.width, height: this.height, relativeTransform: this.relativeTransform,
        });
        frame.layoutMode = 'HORIZONTAL';
        frame.parent = this.parent;
        this.parent.children[this.parent.children.indexOf(this)] = frame;
        this.removed = true;
        return frame;
      },
      async exportAsync(settings) { this.settings = settings; return new Uint8Array([1, 2, 3]); },
    };
    children.forEach(child => { child.parent = item; });
    if (type === 'FRAME' || type === 'INSTANCE') {
      let layout = 'HORIZONTAL';
      Object.defineProperty(item, 'layoutMode', { enumerable: true,
        get() { return layout; },
        set(value) {
          layout = value;
          if (value === 'NONE') children.forEach(child => {
            // Simulate geometry changes when exiting auto-layout to check snapshot restoration.
            child.width++;
            child.relativeTransform = [[1, 0, 99], [0, 1, 99]];
          });
        },
      });
    }
    return item;
  }
  const image = node('RECTANGLE', 'Photo', [], { fills: [{ type: 'IMAGE', imageHash: 'original-image', scaleMode: 'FILL' }] });
  const nested = node('INSTANCE', 'Inner instance', [node('TEXT_PATH', 'Curved', [], { characters: 'Curve' })]);
  const instance = node('INSTANCE', 'Outer instance', [node('TEXT', 'Instance text', [], { characters: 'Button' }), nested]);
  const source = node('FRAME', 'Print', [
    node('TEXT', 'Title', [], { characters: 'Hello', fonts: [
      { family: 'Inter', style: 'Regular' }, { family: 'Inter', style: 'Bold' },
    ] }), image, instance, node('TEXT', 'Empty', [], { characters: '' }),
  ], { height: 144, resolvedVariableModes: { colors: 'dark' } });
  m.figma.currentPage.selection = [source];
  m.figma.loadFontAsync = async font => { fonts.push(font); };
  m.figma.variables = { async getVariableCollectionByIdAsync(id) { return { id }; } };
  m.figma.flatten = ([text], parent, index) => {
    assert.ok(['TEXT', 'TEXT_PATH'].includes(text.type), 'only text is flattened');
    for (let ancestor = parent; ancestor; ancestor = ancestor.parent) {
      assert.notEqual(ancestor.type, 'INSTANCE');
      if ('layoutMode' in ancestor) assert.equal(ancestor.layoutMode, 'NONE');
    }
    assert.equal(parent.children[index], text);
    const vector = node('VECTOR', text.name, [], { width: text.width - 5, relativeTransform: text.relativeTransform });
    flattened.push(text.name);
    vector.parent = parent;
    parent.children.splice(index, 1, vector);
    text.removed = true;
    return vector;
  };
  const snapshot = item => ({ type: item.type, name: item.name, width: item.width, height: item.height,
    transform: item.relativeTransform, layout: item.layoutMode, characters: item.characters,
    fills: item.fills, modes: item.resolvedVariableModes, children: item.children.map(snapshot) });
  return { source, copies, flattened, detached, fonts, image, snapshot };
}

test('outline export converts nested/instance text only, freezes layout and preserves originals and image fills', async () => {
  const m = mockFigma();
  const fixture = outlineFixture(m);
  const before = fixture.snapshot(fixture.source);
  await m.send({ type: 'PRINT_EXPORT_START', requestId: 1, outlineText: true });
  await m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
  assert.equal(m.messages.at(-1).type, 'PRINT_EXPORT_PAGE');
  assert.deepEqual(fixture.flattened, ['Title', 'Instance text', 'Curved']);
  assert.deepEqual(fixture.detached, ['Outer instance', 'Inner instance']);
  assert.deepEqual(fixture.fonts.map(font => font.style).sort(), ['Bold', 'Regular']);
  const copy = fixture.copies[0];
  assert.equal(copy.settings.format, 'PDF');
  assert.equal(copy.removed, true);
  assert.equal(copy.children[1].fills, fixture.image.fills);
  assert.equal(copy.children[1].width, fixture.image.width);
  assert.deepEqual(copy.children[1].relativeTransform, fixture.image.relativeTransform);
  assert.equal(copy.resolvedVariableModes.colors, 'dark');
  assert.deepEqual(fixture.snapshot(fixture.source), before);
  assert.equal(m.figma.currentPage.selection[0], fixture.source);
});

test('unchecked outline option uses the original native export without cloning or loading fonts', async () => {
  const m = mockFigma();
  const fixture = outlineFixture(m);
  await m.send({ type: 'PRINT_EXPORT_START', requestId: 1, outlineText: false });
  await m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
  assert.equal(fixture.copies.length, 0);
  assert.equal(fixture.fonts.length, 0);
  assert.equal(fixture.source.settings.format, 'PDF');
});

test('missing/unloadable fonts fail clearly without changing the source or silently keeping live text', async () => {
  for (const missing of [true, false]) {
    const m = mockFigma();
    const fixture = outlineFixture(m);
    fixture.source.children[0].hasMissingFont = missing;
    if (!missing) m.figma.loadFontAsync = async () => { throw new Error('Font unavailable'); };
    const before = fixture.snapshot(fixture.source);
    await m.send({ type: 'PRINT_EXPORT_START', requestId: 1, outlineText: true });
    await m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
    assert.equal(m.messages.at(-1).type, 'PRINT_ERROR');
    assert.match(m.messages.at(-1).message, /font/i);
    assert.equal(fixture.copies.length, 0);
    assert.deepEqual(fixture.snapshot(fixture.source), before);
  }
});

test('temporary outline copies are removed after conversion or PDF export errors', async () => {
  for (const failure of ['flatten', 'export']) {
    const m = mockFigma();
    const fixture = outlineFixture(m);
    if (failure === 'flatten') m.figma.flatten = () => { throw new Error('Outline failed'); };
    else {
      const clone = fixture.source.clone;
      fixture.source.clone = function() {
        const copy = clone.call(this);
        copy.exportAsync = async () => { throw new Error('PDF failed'); };
        return copy;
      };
    }
    const before = fixture.snapshot(fixture.source);
    await m.send({ type: 'PRINT_EXPORT_START', requestId: 1, outlineText: true });
    await m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
    assert.equal(m.messages.at(-1).type, 'PRINT_ERROR');
    assert.equal(fixture.copies[0].removed, true);
    assert.deepEqual(fixture.snapshot(fixture.source), before);
  }
});

test('cancellation and plugin close remove in-flight copies and discard stale outlined pages', async () => {
  for (const action of ['cancel', 'close']) {
    const m = mockFigma();
    const fixture = outlineFixture(m);
    let resolve, started;
    const exporting = new Promise(done => { started = done; });
    const clone = fixture.source.clone;
    fixture.source.clone = function() {
      const copy = clone.call(this);
      copy.exportAsync = () => new Promise(done => { resolve = done; started(); });
      return copy;
    };
    const before = fixture.snapshot(fixture.source);
    await m.send({ type: 'PRINT_EXPORT_START', requestId: 1, outlineText: true });
    const rendering = m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
    await exporting;
    assert.equal(fixture.copies[0].removed, false);
    if (action === 'cancel') await m.send({ type: 'PRINT_EXPORT_CANCEL', requestId: 1 });
    else m.listeners.close();
    assert.equal(fixture.copies[0].removed, true);
    resolve(new Uint8Array([1]));
    await rendering;
    assert.equal(m.messages.filter(message => message.type === 'PRINT_EXPORT_PAGE').length, 0);
    assert.deepEqual(fixture.snapshot(fixture.source), before);
  }
});

test('cancelling while fonts load does not create a temporary copy', async () => {
  const m = mockFigma();
  const fixture = outlineFixture(m);
  let resolve;
  const loading = new Promise(done => { resolve = done; });
  m.figma.loadFontAsync = () => loading;
  await m.send({ type: 'PRINT_EXPORT_START', requestId: 1, outlineText: true });
  const rendering = m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
  await m.send({ type: 'PRINT_EXPORT_CANCEL', requestId: 1 });
  resolve();
  await rendering;
  assert.equal(fixture.copies.length, 0);
  assert.equal(m.messages.filter(message => message.type === 'PRINT_EXPORT_PAGE').length, 0);
});

test('missing fonts in hidden content do not block the visible outlined PDF', async () => {
  const m = mockFigma();
  const fixture = outlineFixture(m);
  fixture.source.children[0].visible = false;
  fixture.source.children[0].hasMissingFont = true;
  await m.send({ type: 'PRINT_EXPORT_START', requestId: 1, outlineText: true });
  await m.send({ type: 'PRINT_EXPORT_NEXT', requestId: 1 });
  assert.equal(m.messages.at(-1).type, 'PRINT_EXPORT_PAGE');
  assert.ok(!fixture.flattened.includes('Title'));
});

async function vectorFixture(label, width = 198, height = 198) {
  const document = await PDFDocument.create();
  const page = document.addPage([width, height]);
  const font = await document.embedFont(StandardFonts.Helvetica);
  page.drawRectangle({ x: 10, y: 10, width: 40, height: 30, color: rgb(1, 0, 0), opacity: 0.5 });
  page.drawText(label, { x: 10, y: 60, size: 12, font });
  return document.save();
}

function pageContent(document, page) {
  return page.node.Contents().asArray().map(ref => {
    const stream = document.context.lookup(ref, PDFRawStream);
    return Buffer.from(decodePDFRawStream(stream).decode()).toString('latin1');
  }).join('\n');
}

test('merged native PDFs retain vector operators, fonts, transparency, page order and exact physical sizes', async () => {
  const { PrintPDF: { Writer } } = pdfContext();
  const writer = new Writer(2);
  const first = await vectorFixture('First vector page');
  const second = await vectorFixture('Second vector page', 612, 792);
  const size = 7 / 2.54 * 72;
  await writer.addPage(size, size, first);
  await writer.addPage(612, 792, second);
  const blob = await writer.finish();
  assert.equal(blob.type, 'application/pdf');
  const merged = await PDFDocument.load(await blob.arrayBuffer());
  assert.equal(merged.getPageCount(), 2);
  const pages = merged.getPages();
  assert.ok(Math.abs(pages[0].getWidth() - size) < 1e-10);
  assert.ok(Math.abs(pages[0].getHeight() - size) < 1e-10);
  assert.deepEqual(pages[1].getSize(), { width: 612, height: 792 });
  for (const [i, bytes] of [first, second].entries()) {
    const source = await PDFDocument.load(bytes);
    const original = pageContent(source, source.getPage(0));
    const content = pageContent(merged, pages[i]);
    assert.ok(content.includes(original), 'original drawing stream survives unchanged');
    assert.match(content, /\b0 0 m\n0 30 l\n40 30 l\n40 0 l\nh\nf\b/);
    assert.match(content, /\bBT\b/);
    assert.match(content, /\bTj\b/);
    assert.ok(pages[i].node.Resources().has(PDFName.of('Font')));
    assert.ok(pages[i].node.Resources().has(PDFName.of('ExtGState')));
  }
  assert.ok(!merged.context.enumerateIndirectObjects().some(([, object]) =>
    object instanceof PDFRawStream && object.dict.get(PDFName.of('Subtype')) === PDFName.of('Image')),
  'vector-only input never becomes an image');
});

test('PDF writer rejects incomplete exports, invalid bytes, sizes and multi-page frame exports', async () => {
  const { PrintPDF: { Writer } } = pdfContext();
  const writer = new Writer(1);
  await assert.rejects(() => writer.finish(), /incomplete/);
  await assert.rejects(() => writer.addPage(72, 72, new Uint8Array(4)));
  await assert.rejects(() => writer.addPage(0, 72, new Uint8Array(4)), /Invalid/);
  await assert.rejects(() => writer.addPage(NaN, 72, new Uint8Array(4)), /Invalid/);
  const document = await PDFDocument.create();
  document.addPage();
  document.addPage();
  const multiplePages = await document.save();
  await assert.rejects(() => writer.addPage(72, 72, multiplePages), /one PDF page/);
  const firstBytes = await vectorFixture('Valid retry');
  await writer.addPage(72, 72, firstBytes);
  await assert.rejects(() => writer.addPage(72, 72, firstBytes), /Invalid/);
  assert.throws(() => new Writer(0), /Invalid/);
});

function printUI() {
  const context = pdfContext();
  const elements = new Map(Array.from(html.matchAll(/id="([^"]+)"/g), ([, id]) => [id, {
    value: '', checked: false, hidden: false, disabled: false, textContent: '', listeners: {},
    addEventListener(name, callback) { this.listeners[name] = callback; },
    setAttribute() {}, querySelectorAll() { return []; }, focus() {},
    emit(name) { return this.listeners[name]?.call(this); },
  }]));
  for (const [id, value] of [['print-width', '7'], ['print-height', '7'], ['print-unit', 'cm'],
    ['print-filename', 'vector.pdf']]) elements.get(id).value = value;
  const messages = [];
  elements.get('print-export-fields').querySelectorAll = () =>
    [elements.get('print-filename'), elements.get('print-outline-text')];
  let messageHandler;
  const result = { context, elements, messages, saved: null, downloaded: null, downloadClicks: 0 };
  context.document = {
    getElementById(id) { assert.ok(elements.has(id), 'missing UI element: ' + id); return elements.get(id); },
    body: { appendChild() {} },
    createElement(tag) {
      assert.equal(tag, 'a', 'PDF export must not create a canvas');
      return { click() { result.downloadClicks++; }, remove() {} };
    },
  };
  context.parent = { postMessage(message) { messages.push(message.pluginMessage); } };
  context.window = {
    addEventListener(name, callback) { assert.equal(name, 'message'); messageHandler = callback; },
    async showSaveFilePicker() {
      return { name: 'vector.pdf', async createWritable() {
        return { async write(blob) { result.saved = blob; }, async close() {} };
      } };
    },
  };
  context.URL = {
    createObjectURL(blob) { result.downloaded = blob; return 'blob:vector-pdf'; },
    revokeObjectURL() {},
  };
  context.setTimeout = (callback, delay) => {
    const timer = setTimeout(callback, delay);
    if (delay === 60000) timer.unref();
    return timer;
  };
  vm.runInContext(html.match(/<script id="print-ui">([\s\S]*?)<\/script>/)[1], context);
  result.receive = message => messageHandler({ data: { pluginMessage: message } });
  result.start = async () => {
    await result.receive({ type: 'PRINT_SELECTION', nodes: [{ name: 'Vector', width: 72, height: 72, isFrame: true }] });
    elements.get('print-prepare').emit('click');
    await result.receive({ type: 'PRINT_EXPORT_READY', requestId: messages.at(-1).requestId, count: 1 });
  };
  return result;
}

test('print UI prepares native vector PDFs and saves/downloads the same PDF without a canvas', async () => {
  const ui = printUI();
  await ui.start();
  assert.deepEqual(Object.keys(ui.messages[0]).sort(), ['outlineText', 'requestId', 'type']);
  assert.equal(ui.messages[0].outlineText, false);
  assert.equal(ui.messages[0].type, 'PRINT_EXPORT_START');
  assert.equal(ui.messages.at(-1).type, 'PRINT_EXPORT_NEXT');
  await ui.receive({ type: 'PRINT_EXPORT_PAGE', requestId: 1, index: 0, name: 'Vector',
    width: 72, height: 72, bytes: await vectorFixture('Saved vector') });
  assert.equal(ui.elements.get('print-save').hidden, false);
  assert.match(ui.elements.get('print-export-status').textContent, /Vector PDF/);
  await ui.elements.get('print-save').emit('click');
  ui.elements.get('print-download').emit('click');
  assert.equal(ui.downloadClicks, 1);
  assert.equal(ui.downloaded, ui.saved);
  const saved = await PDFDocument.load(await ui.saved.arrayBuffer());
  assert.equal(saved.getPageCount(), 1);
  assert.match(pageContent(saved, saved.getPage(0)), /\bBT\b/);
});

test('outline checkbox is captured for the export, disabled while busy, and invalidates a prepared PDF', async () => {
  const ui = printUI();
  const checkbox = ui.elements.get('print-outline-text');
  checkbox.checked = true;
  await ui.start();
  assert.equal(ui.messages[0].outlineText, true);
  assert.equal(checkbox.disabled, true);
  await ui.receive({ type: 'PRINT_EXPORT_PAGE', requestId: 1, index: 0, name: 'Outlined',
    width: 72, height: 72, bytes: await vectorFixture('UI fixture') });
  assert.match(ui.elements.get('print-export-status').textContent, /Text outlined/);
  assert.equal(checkbox.disabled, false);
  assert.equal(ui.elements.get('print-save').hidden, false);
  checkbox.checked = false;
  ui.elements.get('print-export-fields').emit('input');
  assert.equal(ui.elements.get('print-save').hidden, true);
  assert.match(ui.elements.get('print-export-status').textContent, /Prepare the PDF again/);
});

test('cancelling while the final PDF is saving bytes cannot publish stale output', async () => {
  const ui = printUI();
  let resolve;
  let entered;
  const finishing = new Promise(done => { entered = done; });
  ui.context.PrintPDF.Writer = function() {
    this.addPage = async () => {};
    this.finish = () => new Promise(done => { resolve = done; entered(); });
  };
  await ui.start();
  const rendering = ui.receive({ type: 'PRINT_EXPORT_PAGE', requestId: 1, index: 0,
    name: 'Cancelled', width: 72, height: 72, bytes: new Uint8Array() });
  await finishing;
  assert.equal(typeof resolve, 'function');
  ui.elements.get('print-cancel').emit('click');
  resolve(new Blob(['stale'], { type: 'application/pdf' }));
  await rendering;
  assert.equal(ui.elements.get('print-save').hidden, true);
  assert.equal(ui.elements.get('print-export-status').textContent, 'Export cancelled.');
});

test('all embedded UI scripts remain valid JavaScript', () => {
  for (const [, script] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(script);
});
