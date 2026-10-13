// MultiDes – Figma Plugin Backend (code.js)
// Runs in the Figma sandbox. Reads variables/collections and sends to UI.

try { figma.root.setRelaunchData({ open: '' }); } catch (e) {}

figma.showUI(__html__, {
  width: 480,
  height: 680,
  title: 'MultiDes',
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function rgbaToHex(r, g, b, a) {
  const to255 = (v) => Math.round(v * 255);
  const hexByte = (n) => Math.round(n).toString(16).padStart(2, '0');
  const rHex = hexByte(r * 255);
  const gHex = hexByte(g * 255);
  const bHex = hexByte(b * 255);
  if (a !== undefined && a < 1) {
    const aHex = hexByte(a * 255);
    return `#${rHex}${gHex}${bHex}${aHex}`;
  }
  return `#${rHex}${gHex}${bHex}`;
}

function formatColor(r, g, b, a, format) {
  if (format === 'rgb') {
    const R = Math.round(r * 255);
    const G = Math.round(g * 255);
    const B = Math.round(b * 255);
    if (a < 1) {
      return `rgba(${R}, ${G}, ${B}, ${a.toFixed(2).replace(/\.?0+$/, '')})`;
    }
    return `rgb(${R}, ${G}, ${B})`;
  }
  
  if (format === 'hsl') {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    const H = Math.round(h * 360);
    const S = Math.round(s * 100);
    const L = Math.round(l * 100);
    if (a < 1) {
      return `hsla(${H}, ${S}%, ${L}%, ${a.toFixed(2).replace(/\.?0+$/, '')})`;
    }
    return `hsl(${H}, ${S}%, ${L}%)`;
  }
  
  if (format === 'lch') {
    const R = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    const G = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    const B = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    const x = R * 0.4124 + G * 0.3576 + B * 0.1805;
    const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
    const z = R * 0.0193 + G * 0.1192 + B * 0.9505;
    
    const Xn = 0.950489, Yn = 1.0, Zn = 1.08884;
    const x_ = x / Xn, y_ = y / Yn, z_ = z / Zn;
    const f = (t) => t > 0.008856 ? Math.pow(t, 1/3) : 7.787 * t + 16 / 116;
    const fx = f(x_), fy = f(y_), fz = f(z_);
    const LabL = 116 * fy - 16;
    const LabA = 500 * (fx - fy);
    const LabB = 200 * (fy - fz);
    
    const C = Math.round(Math.sqrt(LabA * LabA + LabB * LabB) * 10) / 10;
    let H = Math.round(Math.atan2(LabB, LabA) * 180 / Math.PI * 10) / 10;
    if (H < 0) H += 360;
    const L = Math.round(LabL * 10) / 10;
    
    if (a < 1) {
      return `lch(${L}% ${C} ${H} / ${a.toFixed(2).replace(/\.?0+$/, '')})`;
    }
    return `lch(${L}% ${C} ${H})`;
  }
  
  if (format === 'oklch') {
    const R = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    const G = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    const B = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    
    const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
    const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
    const s = 0.0883024619 * R + 0.2817784868 * G + 0.6299787041 * B;
    
    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);
    
    const LabL = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
    const LabA = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
    const LabB = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
    
    const chroma = (Math.sqrt(LabA * LabA + LabB * LabB)).toFixed(3).replace(/\.?0+$/, '');
    const lightness = (LabL * 100).toFixed(1).replace(/\.?0+$/, '') + '%';
    let H = Math.round(Math.atan2(LabB, LabA) * 180 / Math.PI * 10) / 10;
    if (H < 0) H += 360;
    
    if (a < 1) {
      return `oklch(${lightness} ${chroma} ${H} / ${a.toFixed(2).replace(/\.?0+$/, '')})`;
    }
    return `oklch(${lightness} ${chroma} ${H})`;
  }

  return rgbaToHex(r, g, b, a);
}

function resolveValue(value, allVariables, colorFormat) {
  if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    const ref = allVariables[value.id];
    return ref ? `{${ref.name.replace(/\//g, '.')}}` : `alias:${value.id}`;
  }
  if (value && typeof value === 'object' && 'r' in value) {
    return formatColor(value.r, value.g, value.b, value.a !== undefined ? value.a : 1, colorFormat || 'hex');
  }
  return value;
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ─── Data Collection ─────────────────────────────────────────────────────────

async function collectData() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const allVarsArray = await figma.variables.getLocalVariablesAsync();
  const allVars = {};
  for (const v of allVarsArray) allVars[v.id] = v;

  const data = [];

  for (const col of collections) {
    const colEntry = {
      id: col.id,
      name: col.name,
      modes: col.modes,          // [{modeId, name}]
      groups: {},
    };

    // Gather variables belonging to this collection
    const colVars = allVarsArray.filter((v) => v.variableCollectionId === col.id);

    for (const variable of colVars) {
      // Derive group path – everything before the last "/" in the name
      const parts = variable.name.split('/');
      const groupPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '__root__';
      const varName = parts[parts.length - 1];

      if (!colEntry.groups[groupPath]) {
        colEntry.groups[groupPath] = [];
      }

      const valuesByMode = {};
      for (const mode of col.modes) {
        const raw = variable.valuesByMode[mode.modeId];
        valuesByMode[mode.modeId] = raw !== undefined ? resolveValue(raw, allVars, 'hex') : null;
      }

      colEntry.groups[groupPath].push({
        id: variable.id,
        name: varName,
        fullPath: variable.name,
        type: variable.resolvedType,
        valuesByMode,
        description: variable.description || '',
      });
    }

    data.push(colEntry);
  }

  return data;
}

// ─── Font Replacer Helpers ───────────────────────────────────────────────────

function collectTextNodes(scope) {
  var textNodes = [];
  function walk(node) {
    if (node.type === 'TEXT') {
      textNodes.push(node);
    }
    if ('children' in node) {
      for (var i = 0; i < node.children.length; i++) {
        walk(node.children[i]);
      }
    }
  }
  if (Array.isArray(scope)) {
    for (var i = 0; i < scope.length; i++) walk(scope[i]);
  } else {
    walk(scope);
  }
  return textNodes;
}

function getScopeNodes(scopeType, pageIds) {
  if (scopeType === 'selection') {
    return figma.currentPage.selection;
  } else if (scopeType === 'page') {
    return [figma.currentPage];
  } else if (scopeType === 'pages') {
    return figma.root.children.filter(function(p) { return pageIds.indexOf(p.id) !== -1; });
  } else {
    return figma.root.children;
  }
}

// ─── Font Replacer Helpers ───────────────────────────────────────────────────

function collectTextNodes(scope) {
  var textNodes = [];
  function walk(node) {
    if (node.type === 'TEXT') {
      textNodes.push(node);
    }
    if ('children' in node) {
      for (var i = 0; i < node.children.length; i++) {
        walk(node.children[i]);
      }
    }
  }
  if (Array.isArray(scope)) {
    for (var i = 0; i < scope.length; i++) walk(scope[i]);
  } else {
    walk(scope);
  }
  return textNodes;
}

function getScopeNodes(scopeType, pageIds) {
  if (scopeType === 'selection') {
    return figma.currentPage.selection;
  } else if (scopeType === 'page') {
    return [figma.currentPage];
  } else if (scopeType === 'pages') {
    return figma.root.children.filter(function(p) { return pageIds.indexOf(p.id) !== -1; });
  } else {
    return figma.root.children;
  }
}

// ─── Export Generators ───────────────────────────────────────────────────────

function generateCSS(selectedData, cssPrefix) {
  // selectedData: array of { collection, groups[], modes[] }
  const lines = ['/* Generated by MultiDes */\n'];

  // Helper to format custom prefix or fall back to collection name
  const getPrefix = (collectionName) => {
    if (cssPrefix === undefined || cssPrefix === null || cssPrefix.trim() === '') {
      return `--${sanitizeName(collectionName).toLowerCase()}-`;
    }
    let p = cssPrefix.trim();
    if (!p.startsWith('--')) {
      p = '--' + p;
    }
    if (p !== '--' && !p.endsWith('-')) {
      p = p + '-';
    }
    return p.toLowerCase();
  };

  for (const { collection, groups, modes } of selectedData) {
    lines.push(`/* ═══ ${collection.name} ═══ */`);

    const basePrefix = getPrefix(collection.name);

    for (const mode of modes) {
      // Use :root when only one mode selected; named selector for multi-mode
      const selector = modes.length > 1
        ? `[data-mode="${sanitizeName(mode.name).toLowerCase()}"]`
        : ':root';
      lines.push(`${selector} {`);

      for (const group of groups) {
        const prefix = group.path !== '__root__'
          ? group.path.split('/').map(sanitizeName).join('-') + '-'
          : '';
        lines.push(`  /* ${group.path === '__root__' ? collection.name : group.path} */`);

        for (const variable of group.variables) {
          const value = variable.valuesByMode[mode.modeId];
          const token = `${basePrefix}${prefix}${sanitizeName(variable.name)}`.toLowerCase();
          lines.push(`  ${token}: ${value !== null ? value : 'unset'};`);
        }
        lines.push('');
      }

      lines.push('}');
      lines.push('');
    }
  }

  return lines.join('\n');
}

function buildJsonStructure(selectedData) {
  const root = {};

  for (const { collection, groups, modes } of selectedData) {
    root[collection.name] = {};

    for (const mode of modes) {
      root[collection.name][mode.name] = {};
      const modeNode = root[collection.name][mode.name];

      for (const group of groups) {
        let target;
        if (group.path === '__root__') {
          target = modeNode;
        } else {
          target = modeNode;
          for (const segment of group.path.split('/')) {
            if (!target[segment]) target[segment] = {};
            target = target[segment];
          }
        }

        for (const variable of group.variables) {
          var entry = {
            value: variable.valuesByMode[mode.modeId],
            type: variable.type.toLowerCase(),
          };
          if (variable.description) {
            entry.description = variable.description;
          }
          target[variable.name] = entry;
        }
      }
    }
  }

  return root;
}

// ─── Message Handler ──────────────────────────────────────────────────────────

// Print dimensions use PDF points: one Figma unit is 1/72 inch.
const PRINT_UNITS_PER_INCH = 72;
let printExportJob = null;

function printDimension(value, unit) {
  const perInch = { cm: 2.54, mm: 25.4, in: 1 };
  if (!Object.prototype.hasOwnProperty.call(perInch, unit) ||
      typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error('Enter positive dimensions in cm, mm, or inches.');
  }
  const points = value / perInch[unit] * PRINT_UNITS_PER_INCH;
  if (points < 0.01 || points > 14400) {
    throw new Error('Each dimension must be between 0.01 and 14,400 Figma px (200 inches).');
  }
  return points;
}

function sendPrintSelection() {
  figma.ui.postMessage({
    type: 'PRINT_SELECTION',
    nodes: figma.currentPage.selection.map(node => ({
      name: node.name, width: node.width, height: node.height, isFrame: node.type === 'FRAME',
    })),
  });
}

function validatePrintPage(node) {
  if (node.removed || node.type !== 'FRAME' || !Number.isFinite(node.width) ||
      !Number.isFinite(node.height) || node.width < 0.01 || node.height < 0.01) {
    throw new Error('Select one or more frames to export.');
  }
  if (node.width > 14400 || node.height > 14400) {
    throw new Error('PDF pages cannot exceed 200 inches on either side.');
  }
  const t = node.absoluteTransform;
  if (Math.abs(t[0][0] - 1) > 0.0001 || Math.abs(t[1][1] - 1) > 0.0001 ||
      Math.abs(t[0][1]) > 0.0001 || Math.abs(t[1][0]) > 0.0001) {
    throw new Error('Reset frame and parent rotation or scaling before exporting.');
  }
}

function printTextNodes(node, result = []) {
  if (node.visible === false) return result;
  if (node.type === 'TEXT' || node.type === 'TEXT_PATH') result.push(node);
  if ('children' in node) node.children.forEach(child => printTextNodes(child, result));
  return result;
}

function freezePrintLayout(node) {
  if (node.visible === false) return;
  if (node.type === 'INSTANCE') node = node.detachInstance();
  const children = 'children' in node ? Array.from(node.children) : [];
  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    const { width, height } = node;
    const positions = children.filter(child => child.visible !== false).map(child => ({
      child, width: child.width, height: child.height, transform: child.relativeTransform,
    }));
    // Outlining shrinks text bounds; freeze auto-layout so neighboring artwork cannot shift.
    node.layoutMode = 'NONE';
    node.resizeWithoutConstraints(width, height);
    positions.forEach(({ child, width, height, transform }) => {
      if (child.width !== width || child.height !== height) child.resizeWithoutConstraints(width, height);
      child.relativeTransform = transform;
    });
  }
  children.forEach(freezePrintLayout);
}

async function exportPrintPage(page, job) {
  const settings = { format: 'PDF', colorProfile: 'SRGB', contentsOnly: true, useAbsoluteBounds: true };
  if (!job.outlineText) return page.node.exportAsync(settings);
  const fonts = new Map();
  printTextNodes(page.node).forEach(text => {
    if (!text.characters.length) return;
    if (text.hasMissingFont) throw new Error(`Text "${text.name}" uses missing fonts. Install or replace them before converting to outlines.`);
    text.getRangeAllFontNames(0, text.characters.length).forEach(font => fonts.set(JSON.stringify(font), font));
  });
  await Promise.all(Array.from(fonts.values(), async font => {
    try { await figma.loadFontAsync(font); }
    catch (_) { throw new Error(`Could not load ${font.family} ${font.style || ''}. Install the font before converting text to outlines.`); }
  }));
  // A copy on the page must retain variable modes inherited from the original's ancestors.
  const modes = await Promise.all(Object.entries(page.node.resolvedVariableModes).map(async ([id, mode]) => {
    const collection = await figma.variables.getVariableCollectionByIdAsync(id);
    if (!collection) throw new Error('A color or typography variable collection is unavailable.');
    return { collection, mode };
  }));
  if (printExportJob !== job) return;
  validatePrintPage(page.node);
  if (page.node.width !== page.width || page.node.height !== page.height) {
    throw new Error('A frame was resized during export. Prepare the PDF again.');
  }
  const copy = page.node.clone();
  job.temporary = copy;
  try {
    modes.forEach(({ collection, mode }) => copy.setExplicitVariableModeForCollection(collection, mode));
    freezePrintLayout(copy);
    printTextNodes(copy).forEach(text => {
      if (!text.characters.length) { text.remove(); return; }
      const parent = text.parent;
      figma.flatten([text], parent, parent.children.indexOf(text));
    });
    return await copy.exportAsync(settings);
  } finally {
    if (!copy.removed) copy.remove();
    if (job.temporary === copy) job.temporary = null;
  }
}

function cancelPrintExport() {
  const job = printExportJob;
  printExportJob = null;
  if (job && job.temporary && !job.temporary.removed) job.temporary.remove();
}

figma.on('close', cancelPrintExport);

async function handlePrintMessage(msg) {
  try {
    if (msg.type === 'GET_PRINT_SELECTION') {
      sendPrintSelection();
    } else if (msg.type === 'PRINT_CREATE_FRAME') {
      const width = printDimension(msg.width, msg.unit);
      const height = printDimension(msg.height, msg.unit);
      const frame = figma.createFrame();
      frame.resize(width, height);
      frame.name = `Print ${msg.width} × ${msg.height} ${msg.unit}`;
      frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      frame.x = figma.viewport.center.x - width / 2;
      frame.y = figma.viewport.center.y - height / 2;
      figma.currentPage.selection = [frame];
      figma.viewport.scrollAndZoomIntoView([frame]);
      figma.ui.postMessage({ type: 'PRINT_FRAME_CREATED', width, height });
      sendPrintSelection();
    } else if (msg.type === 'PRINT_EXPORT_START') {
      if (printExportJob) throw new Error('A PDF export is already in progress.');
      if (!Number.isSafeInteger(msg.requestId) || msg.requestId < 1 ||
          (msg.outlineText !== undefined && typeof msg.outlineText !== 'boolean')) throw new Error('Invalid PDF export settings.');
      const nodes = Array.from(figma.currentPage.selection);
      if (!nodes.length || nodes.length > 50) throw new Error('Select between 1 and 50 frames.');
      const pages = nodes.map(node => {
        validatePrintPage(node);
        return { node, width: node.width, height: node.height, name: node.name };
      });
      printExportJob = { requestId: msg.requestId, outlineText: msg.outlineText === true, pages, index: 0, busy: false };
      figma.ui.postMessage({ type: 'PRINT_EXPORT_READY', requestId: msg.requestId, count: pages.length });
    } else if (msg.type === 'PRINT_EXPORT_NEXT') {
      const job = printExportJob;
      if (!job || job.requestId !== msg.requestId || job.busy) return;
      job.busy = true;
      const page = job.pages[job.index];
      validatePrintPage(page.node);
      if (page.node.width !== page.width || page.node.height !== page.height) {
        throw new Error('A frame was resized during export. Prepare the PDF again.');
      }
      const bytes = await exportPrintPage(page, job);
      if (printExportJob !== job) return;
      figma.ui.postMessage({
        type: 'PRINT_EXPORT_PAGE', requestId: job.requestId, index: job.index,
        width: page.width, height: page.height, name: page.name, bytes,
      });
      job.index++;
      job.busy = false;
      if (job.index === job.pages.length) printExportJob = null;
    } else if (msg.type === 'PRINT_EXPORT_CANCEL') {
      if (printExportJob && printExportJob.requestId === msg.requestId) cancelPrintExport();
    }
  } catch (err) {
    if (printExportJob && printExportJob.requestId === msg.requestId) cancelPrintExport();
    figma.ui.postMessage({ type: 'PRINT_ERROR', requestId: msg.requestId, action: msg.type, message: err.message });
  }
}

figma.ui.onmessage = async (msg) => {
  if (!msg || typeof msg.type !== 'string') return;
  if (msg.type === 'GET_PRINT_SELECTION' || msg.type.startsWith('PRINT_')) {
    await handlePrintMessage(msg);
    return;
  }
  switch (msg.type) {
    case 'READY': {
      const data = await collectData();
      figma.ui.postMessage({ type: 'DATA', payload: data });
      break;
    }

    case 'EXPORT': {
      const { format, colorFormat, cssPrefix, selections } = msg;
      // selections: [{ collectionId, groupPaths[], modeIds[] }]

      const allVarsArray = await figma.variables.getLocalVariablesAsync();
      const allVars = {};
      for (const v of allVarsArray) allVars[v.id] = v;

      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const colMap = {};
      for (const c of collections) colMap[c.id] = c;

      // Rebuild selected data subset
      const selectedData = [];

      for (const sel of selections) {
        const col = colMap[sel.collectionId];
        if (!col) continue;

        const modes = col.modes.filter((m) => sel.modeIds.includes(m.modeId));
        const colVars = allVarsArray.filter((v) => v.variableCollectionId === col.id);

        const groupMap = {};
        for (const variable of colVars) {
          const parts = variable.name.split('/');
          const groupPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '__root__';
          const varName = parts[parts.length - 1];

          if (!sel.groupPaths.includes(groupPath)) continue;

          if (!groupMap[groupPath]) groupMap[groupPath] = [];

          const valuesByMode = {};
          for (const mode of col.modes) {
            const raw = variable.valuesByMode[mode.modeId];
            valuesByMode[mode.modeId] = raw !== undefined ? resolveValue(raw, allVars, colorFormat) : null;
          }

          groupMap[groupPath].push({
            id: variable.id,
            name: varName,
            fullPath: variable.name,
            type: variable.resolvedType,
            valuesByMode,
            description: variable.description || '',
          });
        }

        const groups = Object.entries(groupMap).map(([path, variables]) => ({ path, variables }));
        selectedData.push({ collection: col, groups, modes });
      }

      let output;
      if (format === 'css') {
        output = generateCSS(selectedData, cssPrefix);
      } else {
        output = JSON.stringify(buildJsonStructure(selectedData), null, 2);
      }

      figma.ui.postMessage({ type: 'EXPORT_RESULT', format, output });
      break;
    }

    case 'GET_COLOR_TOKENS': {
      const tokens = await getColorTokens();
      figma.ui.postMessage({ type: 'COLOR_TOKENS', payload: tokens });
      break;
    }

    case 'GET_SELECTION_COLORS': {
      await sendSelectionColors();
      break;
    }

    case 'CREATE_COLOR_SCALE': {
      const { name, colors } = msg;
      
      try {
        await Promise.all([
          figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
          figma.loadFontAsync({ family: 'Inter', style: 'Bold' }),
        ]);
      } catch (err) {
        figma.notify('Error loading font, using default.');
      }

      function hexToFigmaColor(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        return { r, g, b };
      }

      const frame = figma.createFrame();
      frame.name = `Color Scale: ${name || 'Palette'}`;
      frame.setRelaunchData({ open: '' });
      frame.layoutMode = 'HORIZONTAL';
      frame.itemSpacing = 16;
      frame.paddingLeft = 24;
      frame.paddingRight = 24;
      frame.paddingTop = 24;
      frame.paddingBottom = 24;
      frame.primaryAxisSizingMode = 'AUTO';
      frame.counterAxisSizingMode = 'AUTO';
      frame.cornerRadius = 12;
      
      frame.fills = [{ type: 'SOLID', color: { r: 12/255, g: 12/255, b: 12/255 } }];
      frame.strokes = [{ type: 'SOLID', color: { r: 42/255, g: 42/255, b: 42/255 } }];
      frame.strokeWeight = 1;
      frame.strokeAlign = 'INSIDE';

      for (const item of colors) {
        const col = figma.createFrame();
        col.name = `Stop -${item.label}`;
        col.layoutMode = 'VERTICAL';
        col.itemSpacing = 8;
        col.counterAxisAlignItems = 'CENTER';
        col.fills = [];
        col.primaryAxisSizingMode = 'AUTO';
        col.counterAxisSizingMode = 'AUTO';

        const rect = figma.createRectangle();
        rect.resize(64, 64);
        rect.cornerRadius = 8;
        rect.fills = [{ type: 'SOLID', color: hexToFigmaColor(item.hex) }];
        col.appendChild(rect);

        const lbl = figma.createText();
        lbl.fontName = { family: 'Inter', style: 'Bold' };
        lbl.fontSize = 11;
        lbl.characters = `-${item.label}`;
        lbl.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        col.appendChild(lbl);

        const code = figma.createText();
        code.fontName = { family: 'Inter', style: 'Regular' };
        code.fontSize = 9;
        code.characters = item.hex.toUpperCase();
        code.fills = [{ type: 'SOLID', color: { r: 119/255, g: 119/255, b: 119/255 } }];
        col.appendChild(code);

        frame.appendChild(col);
      }

      figma.currentPage.appendChild(frame);
      figma.currentPage.selection = [frame];
      figma.viewport.scrollAndZoomIntoView([frame]);
      figma.notify(`Created color scale: ${name}`);
      break;
    }

    case 'CREATE_COLOR_STYLES': {
      const { name, colors, generateGuide } = msg;
      
      function localHexToFigmaColor(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        return { r, g, b };
      }

      for (const item of colors) {
        const styleName = `${name}/${item.label}`;
        const style = figma.createPaintStyle();
        style.name = styleName;
        style.paints = [{ type: 'SOLID', color: localHexToFigmaColor(item.hex) }];
      }
      
      figma.notify(`Created color styles for ${name}`);
      
      if (generateGuide) {
        msg.type = 'CREATE_COLOR_SCALE';
        figma.ui.onmessage(msg);
      }
      break;
    }

    case 'CREATE_COLOR_VARIABLES': {
      const { name, colors, generateGuide } = msg;
      function localHexToFigmaColorWithAlpha(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        return { r, g, b, a: 1 };
      }
      
      // Get all local collections
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      let collection = collections.find(c => c.name === name);
      
      if (!collection) {
        collection = figma.variables.createVariableCollection(name);
      }
      const modeId = collection.modes[0].modeId;
      
      for (const item of colors) {
        try {
          const varName = item.label.toString();
          const variable = figma.variables.createVariable(varName, collection, 'COLOR');
          variable.setValueForMode(modeId, localHexToFigmaColorWithAlpha(item.hex));
        } catch (e) {
          figma.notify('Error creating variable: ' + e.message);
        }
      }
      
      figma.notify(`Created color variables for ${name}`);
      
      if (generateGuide) {
        msg.type = 'CREATE_COLOR_SCALE';
        figma.ui.onmessage(msg);
      }
      break;
    }

    case 'GET_PAGES': {
      var pages = figma.root.children.map(function(p) {
        return { id: p.id, name: p.name };
      });
      figma.ui.postMessage({ type: 'PAGES_LIST', payload: pages });
      break;
    }

    case 'SCAN_FONTS': {
      var scopeType = msg.scope;
      var pageIds = msg.pageIds || [];
      
      try {
        if (scopeType === 'file' || scopeType === 'pages') {
          await figma.loadAllPagesAsync();
        }
        
        var scopeNodes = getScopeNodes(scopeType, pageIds);
        var textNodes = collectTextNodes(scopeNodes);
        var fontMap = {};
        
        for (var i = 0; i < textNodes.length; i++) {
          var node = textNodes[i];
          var len = node.characters.length;
          if (len === 0) continue;
          
          var fontName = node.fontName;
          if (fontName === figma.mixed) {
            var j = 0;
            while (j < len) {
              var rangeFontName = node.getRangeFontName(j, j + 1);
              var key = rangeFontName.family + '::' + rangeFontName.style;
              if (!fontMap[key]) {
                fontMap[key] = { family: rangeFontName.family, style: rangeFontName.style, count: 0 };
              }
              fontMap[key].count++;
              j++;
            }
          } else {
            var key = fontName.family + '::' + fontName.style;
            if (!fontMap[key]) {
              fontMap[key] = { family: fontName.family, style: fontName.style, count: 0 };
            }
            fontMap[key].count++;
          }
        }
        
        var fonts = Object.keys(fontMap).map(function(k) { return fontMap[k]; });
        fonts.sort(function(a, b) {
          if (a.family < b.family) return -1;
          if (a.family > b.family) return 1;
          if (a.style < b.style) return -1;
          if (a.style > b.style) return 1;
          return 0;
        });
        
        figma.ui.postMessage({ type: 'FONT_SCAN_RESULT', payload: fonts });
      } catch (err) {
        figma.ui.postMessage({ type: 'FONT_SCAN_RESULT', payload: [], error: String(err) });
      }
      break;
    }

    case 'GET_AVAILABLE_FONTS': {
      try {
        var availableFonts = await figma.listAvailableFontsAsync();
        var familyMap = {};
        
        for (var i = 0; i < availableFonts.length; i++) {
          var f = availableFonts[i].fontName;
          if (!familyMap[f.family]) {
            familyMap[f.family] = [];
          }
          familyMap[f.family].push(f.style);
        }
        
        var families = Object.keys(familyMap).sort().map(function(fam) {
          return { family: fam, styles: familyMap[fam] };
        });
        
        figma.ui.postMessage({ type: 'AVAILABLE_FONTS', payload: families });
      } catch (err) {
        figma.ui.postMessage({ type: 'AVAILABLE_FONTS', payload: [], error: String(err) });
      }
      break;
    }

    case 'REPLACE_FONTS': {
      var mappings = msg.mappings;
      var scopeType = msg.scope;
      var pageIds = msg.pageIds || [];
      var replaced = 0;
      var errors = [];
      
      try {
        if (scopeType === 'file' || scopeType === 'pages') {
          await figma.loadAllPagesAsync();
        }
        
        // Load all target fonts first
        for (var m = 0; m < mappings.length; m++) {
          try {
            await figma.loadFontAsync({ family: mappings[m].to.family, style: mappings[m].to.style });
          } catch (err) {
            errors.push('Failed to load ' + mappings[m].to.family + ' ' + mappings[m].to.style + ': ' + String(err));
          }
        }
        
        // Also load source fonts (needed for setRangeFontName to work)
        for (var m = 0; m < mappings.length; m++) {
          try {
            await figma.loadFontAsync({ family: mappings[m].from.family, style: mappings[m].from.style });
          } catch (err) {
            // Source font might not be loadable, that's okay
          }
        }
        
        var scopeNodes = getScopeNodes(scopeType, pageIds);
        var textNodes = collectTextNodes(scopeNodes);
        
        for (var i = 0; i < textNodes.length; i++) {
          var node = textNodes[i];
          var len = node.characters.length;
          if (len === 0) continue;
          
          try {
            var fontName = node.fontName;
            if (fontName === figma.mixed) {
              // Handle mixed fonts: check each character range
              for (var m = 0; m < mappings.length; m++) {
                var fromFont = mappings[m].from;
                var toFont = mappings[m].to;
                
                // Find contiguous ranges of the source font and replace them
                var j = 0;
                while (j < node.characters.length) {
                  var rangeFontName = node.getRangeFontName(j, j + 1);
                  if (rangeFontName.family === fromFont.family && rangeFontName.style === fromFont.style) {
                    // Find the end of this contiguous range
                    var rangeStart = j;
                    while (j < node.characters.length) {
                      var rf = node.getRangeFontName(j, j + 1);
                      if (rf.family !== fromFont.family || rf.style !== fromFont.style) break;
                      j++;
                    }
                    node.setRangeFontName(rangeStart, j, { family: toFont.family, style: toFont.style });
                    replaced++;
                  } else {
                    j++;
                  }
                }
              }
            } else {
              // Uniform font — check against all mappings
              for (var m = 0; m < mappings.length; m++) {
                var fromFont = mappings[m].from;
                var toFont = mappings[m].to;
                if (fontName.family === fromFont.family && fontName.style === fromFont.style) {
                  // Load the current font to allow editing
                  await figma.loadFontAsync(fontName);
                  node.fontName = { family: toFont.family, style: toFont.style };
                  replaced++;
                  break;
                }
              }
            }
          } catch (err) {
            errors.push('Error on node "' + node.name + '": ' + String(err));
          }
        }
        
        figma.ui.postMessage({ type: 'REPLACE_RESULT', replaced: replaced, errors: errors });
        if (replaced > 0) {
          figma.notify('Replaced fonts in ' + replaced + ' text node' + (replaced !== 1 ? 's' : ''));
        }
      } catch (err) {
        figma.ui.postMessage({ type: 'REPLACE_RESULT', replaced: replaced, errors: [String(err)] });
      }
      break;
    }

    case 'GET_PAGES': {
      var pages = figma.root.children.map(function(p) {
        return { id: p.id, name: p.name };
      });
      figma.ui.postMessage({ type: 'PAGES_LIST', payload: pages });
      break;
    }

    case 'SCAN_FONTS': {
      var scopeType = msg.scope;
      var pageIds = msg.pageIds || [];

      try {
        if (scopeType === 'file' || scopeType === 'pages') {
          await figma.loadAllPagesAsync();
        }

        var scopeNodes = getScopeNodes(scopeType, pageIds);
        var textNodes = collectTextNodes(scopeNodes);
        var fontMap = {};

        for (var i = 0; i < textNodes.length; i++) {
          var node = textNodes[i];
          var len = node.characters.length;
          if (len === 0) continue;

          var fontName = node.fontName;
          if (fontName === figma.mixed) {
            var j = 0;
            while (j < len) {
              var rangeFontName = node.getRangeFontName(j, j + 1);
              var key = rangeFontName.family + '::' + rangeFontName.style;
              if (!fontMap[key]) {
                fontMap[key] = { family: rangeFontName.family, style: rangeFontName.style, count: 0 };
              }
              fontMap[key].count++;
              j++;
            }
          } else {
            var key = fontName.family + '::' + fontName.style;
            if (!fontMap[key]) {
              fontMap[key] = { family: fontName.family, style: fontName.style, count: 0 };
            }
            fontMap[key].count++;
          }
        }

        var fonts = Object.keys(fontMap).map(function(k) { return fontMap[k]; });
        fonts.sort(function(a, b) {
          if (a.family < b.family) return -1;
          if (a.family > b.family) return 1;
          if (a.style < b.style) return -1;
          if (a.style > b.style) return 1;
          return 0;
        });

        figma.ui.postMessage({ type: 'FONT_SCAN_RESULT', payload: fonts });
      } catch (err) {
        figma.ui.postMessage({ type: 'FONT_SCAN_RESULT', payload: [], error: String(err) });
      }
      break;
    }

    case 'GET_AVAILABLE_FONTS': {
      try {
        var availableFonts = await figma.listAvailableFontsAsync();
        var familyMap = {};

        for (var i = 0; i < availableFonts.length; i++) {
          var f = availableFonts[i].fontName;
          if (!familyMap[f.family]) {
            familyMap[f.family] = [];
          }
          familyMap[f.family].push(f.style);
        }

        var families = Object.keys(familyMap).sort().map(function(fam) {
          return { family: fam, styles: familyMap[fam] };
        });

        figma.ui.postMessage({ type: 'AVAILABLE_FONTS', payload: families });
      } catch (err) {
        figma.ui.postMessage({ type: 'AVAILABLE_FONTS', payload: [], error: String(err) });
      }
      break;
    }

    case 'REPLACE_FONTS': {
      var mappings = msg.mappings;
      var scopeType = msg.scope;
      var pageIds = msg.pageIds || [];
      var replaced = 0;
      var errors = [];

      try {
        if (scopeType === 'file' || scopeType === 'pages') {
          await figma.loadAllPagesAsync();
        }

        // Load all target fonts first
        for (var m = 0; m < mappings.length; m++) {
          try {
            await figma.loadFontAsync({ family: mappings[m].to.family, style: mappings[m].to.style });
          } catch (err) {
            errors.push('Failed to load ' + mappings[m].to.family + ' ' + mappings[m].to.style + ': ' + String(err));
          }
        }

        // Also load source fonts (needed for setRangeFontName to work)
        for (var m = 0; m < mappings.length; m++) {
          try {
            await figma.loadFontAsync({ family: mappings[m].from.family, style: mappings[m].from.style });
          } catch (err) {
            // Source font might not be loadable, that's okay
          }
        }

        var scopeNodes = getScopeNodes(scopeType, pageIds);
        var textNodes = collectTextNodes(scopeNodes);

        for (var i = 0; i < textNodes.length; i++) {
          var node = textNodes[i];
          var len = node.characters.length;
          if (len === 0) continue;

          try {
            var fontName = node.fontName;
            if (fontName === figma.mixed) {
              // Handle mixed fonts: check each character range
              for (var m = 0; m < mappings.length; m++) {
                var fromFont = mappings[m].from;
                var toFont = mappings[m].to;

                // Find contiguous ranges of the source font and replace them
                var j = 0;
                while (j < node.characters.length) {
                  var rangeFontName = node.getRangeFontName(j, j + 1);
                  if (rangeFontName.family === fromFont.family && rangeFontName.style === fromFont.style) {
                    var rangeStart = j;
                    while (j < node.characters.length) {
                      var rf = node.getRangeFontName(j, j + 1);
                      if (rf.family !== fromFont.family || rf.style !== fromFont.style) break;
                      j++;
                    }
                    node.setRangeFontName(rangeStart, j, { family: toFont.family, style: toFont.style });
                    replaced++;
                  } else {
                    j++;
                  }
                }
              }
            } else {
              // Uniform font — check against all mappings
              for (var m = 0; m < mappings.length; m++) {
                var fromFont = mappings[m].from;
                var toFont = mappings[m].to;
                if (fontName.family === fromFont.family && fontName.style === fromFont.style) {
                  await figma.loadFontAsync(fontName);
                  node.fontName = { family: toFont.family, style: toFont.style };
                  replaced++;
                  break;
                }
              }
            }
          } catch (err) {
            errors.push('Error on node "' + node.name + '": ' + String(err));
          }
        }

        figma.ui.postMessage({ type: 'REPLACE_RESULT', replaced: replaced, errors: errors });
        if (replaced > 0) {
          figma.notify('Replaced fonts in ' + replaced + ' text node' + (replaced !== 1 ? 's' : ''));
        }
      } catch (err) {
        figma.ui.postMessage({ type: 'REPLACE_RESULT', replaced: replaced, errors: [String(err)] });
      }
      break;
    }

    case 'GET_ALL_VARIABLES_LIST': {
      const allVarsArray = await figma.variables.getLocalVariablesAsync();
      const tokens = allVarsArray.map(v => ({
        id: v.id,
        name: v.name,
        type: v.resolvedType,
        hex: '' // UI expects a hex property for token picker
      }));
      figma.ui.postMessage({ type: 'ALL_VARIABLES_LIST', payload: tokens });
      break;
    }

    case 'FIND_VARIABLE_USAGE': {
      const { variableId, scope } = msg;
      let nodesToSearch = [];
      
      try {
        if (scope === 'selection') {
          nodesToSearch = figma.currentPage.selection;
        } else if (scope === 'file') {
          await figma.loadAllPagesAsync();
          nodesToSearch = figma.root.children;
        } else {
          nodesToSearch = [figma.currentPage];
        }

        const results = [];
        
        function checkDeep(obj) {
          if (!obj) return false;
          if (typeof obj === 'object') {
            if (obj.type === 'VARIABLE_ALIAS' && obj.id === variableId) return true;
            for (const k in obj) {
              if (checkDeep(obj[k])) return true;
            }
          }
          return false;
        }
        
        function walk(node) {
          let isUsed = false;
          if (node.boundVariables) {
            isUsed = checkDeep(node.boundVariables);
          }

          if (isUsed) {
            let p = node;
            while (p && p.type !== 'PAGE') p = p.parent;
            results.push({
              id: node.id,
              name: node.name,
              type: node.type,
              pageName: p ? p.name : ''
            });
          }

          if ('children' in node) {
            for (let i = 0; i < node.children.length; i++) {
              walk(node.children[i]);
            }
          }
        }

        for (let i = 0; i < nodesToSearch.length; i++) {
          walk(nodesToSearch[i]);
        }

        figma.ui.postMessage({ type: 'VARIABLE_USAGE_RESULT', payload: results });
      } catch (err) {
        figma.ui.postMessage({ type: 'VARIABLE_USAGE_RESULT', payload: [] });
        figma.notify('Error searching for variable: ' + String(err));
      }
      break;
    }

    case 'CREATE_TYPESCALES': {
      try {
        const { styles } = msg;
        let created = 0;
        let updated = 0;
        let skipped = 0;
        let errors = 0;

        // Load all required fonts first
        for (const st of styles) {
          try {
            await figma.loadFontAsync({ family: st.family, style: st.style });
          } catch (err) {
            figma.notify(`Failed to load font: ${st.family} ${st.style}`);
            figma.ui.postMessage({ type: 'TYPESCALES_CREATED', message: `Failed to load font: ${st.family} ${st.style}` });
            return;
          }
        }

        const localStyles = figma.getLocalTextStylesAsync ? await figma.getLocalTextStylesAsync() : figma.getLocalTextStyles();
        const styleMap = new Map();
        for (const s of localStyles) {
          styleMap.set(s.name, s);
        }

        for (const st of styles) {
          try {
            let styleNode = styleMap.get(st.name);
            let isManaged = false;

            if (styleNode) {
              const pluginData = styleNode.getPluginData('typescales');
              if (pluginData) {
                isManaged = true;
              }
            }

            if (styleNode && !isManaged) {
              // Unrelated style with same name -> skip
              skipped++;
              continue;
            }

            if (!styleNode) {
              styleNode = figma.createTextStyle();
              styleNode.name = st.name;
              created++;
            } else {
              updated++;
            }

            styleNode.fontName = { family: st.family, style: st.style };
            styleNode.fontSize = st.size;
            styleNode.lineHeight = { value: Math.round(st.lineHeight * 100), unit: 'PERCENT' };
            
            if (st.letterSpacing !== 0) {
              styleNode.letterSpacing = { value: st.letterSpacing, unit: 'PERCENT' };
            } else {
              styleNode.letterSpacing = { value: 0, unit: 'PERCENT' };
            }

            styleNode.setPluginData('typescales', JSON.stringify({
              version: 1,
              size: st.size,
              family: st.family,
              style: st.style
            }));
          } catch (err) {
            errors++;
            console.error("Error creating style:", err);
          }
        }

        figma.ui.postMessage({ 
          type: 'TYPESCALES_CREATED', 
          message: `Typescales: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors` 
        });
      } catch (err) {
        figma.notify(`Error: ${err.message}`);
        figma.ui.postMessage({ type: 'TYPESCALES_CREATED', message: `Error: ${err.message}` });
      }
      break;
    }

    case 'CREATE_PRESENTATION': {
      try {
        const { styles, baseSize, ratioName } = msg;

        // Load fonts
        const fontsToLoad = new Map();
        for (const st of styles) {
          const key = `${st.family}-${st.style}`;
          if (!fontsToLoad.has(key)) {
            fontsToLoad.set(key, { family: st.family, style: st.style });
          }
        }
        const labelFont = { family: 'Inter', style: 'Regular' };
        fontsToLoad.set('Inter-Regular', labelFont);
        
        // Load bold font for title
        const titleFont = { family: 'Inter', style: 'Bold' };
        fontsToLoad.set('Inter-Bold', titleFont);

        for (const font of fontsToLoad.values()) {
          try {
            await figma.loadFontAsync(font);
          } catch (err) {
            figma.notify(`Failed to load font: ${font.family} ${font.style}`);
            figma.ui.postMessage({ type: 'PRESENTATION_CREATED', message: `Failed to load font` });
            return;
          }
        }

        // Create Frame
        const frame = figma.createFrame();
        frame.name = `Typescale: ${ratioName}`;
        frame.setRelaunchData({ open: '' });
        frame.fills = [{ type: 'SOLID', color: { r: 0.96, g: 0.96, b: 0.96 } }];
        frame.layoutMode = 'VERTICAL';
        frame.primaryAxisSizingMode = 'AUTO';
        frame.counterAxisSizingMode = 'AUTO';
        frame.paddingLeft = 80;
        frame.paddingRight = 80;
        frame.paddingTop = 80;
        frame.paddingBottom = 80;
        frame.itemSpacing = 0;

        // Title
        const title = figma.createText();
        title.fontName = titleFont;
        title.characters = `Typescale (${ratioName})`;
        title.fontSize = 48;
        title.fills = [{ type: 'SOLID', color: { r: 0.35, g: 0.15, b: 0.9 } }];
        frame.appendChild(title);
        
        // Spacer
        const spacer = figma.createFrame();
        spacer.name = 'Spacer';
        spacer.resize(100, 60);
        spacer.fills = [];
        frame.appendChild(spacer);

        for (const st of styles) {
          const row = figma.createFrame();
          row.name = st.name;
          row.layoutMode = 'HORIZONTAL';
          row.counterAxisAlignItems = 'CENTER';
          row.primaryAxisSizingMode = 'FIXED';
          row.resize(1200, row.height); 
          row.fills = [];
          row.paddingTop = 24;
          row.paddingBottom = 24;
          row.itemSpacing = 40;
          
          row.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
          row.strokeBottomWeight = 1;
          row.strokeTopWeight = 0;
          row.strokeLeftWeight = 0;
          row.strokeRightWeight = 0;
          row.dashPattern = [4, 4];

          // Size text (left)
          const sizeText = figma.createText();
          row.appendChild(sizeText);
          sizeText.fontName = labelFont;
          const remVal = (st.size / baseSize).toFixed(3);
          sizeText.characters = `${remVal}rem\n${st.size}px`;
          sizeText.fontSize = 14;
          sizeText.lineHeight = { value: 150, unit: 'PERCENT' };
          sizeText.textAlignHorizontal = 'RIGHT';
          sizeText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
          sizeText.layoutSizingHorizontal = 'FIXED';
          sizeText.resize(100, sizeText.height);

          // Preview text (middle)
          const preview = figma.createText();
          row.appendChild(preview);
          preview.fontName = { family: st.family, style: st.style };
          preview.characters = `What is a Typographic Scale?`;
          preview.fontSize = st.size;
          preview.lineHeight = { value: Math.round(st.lineHeight * 100), unit: 'PERCENT' };
          if (st.letterSpacing !== 0) {
            preview.letterSpacing = { value: st.letterSpacing, unit: 'PERCENT' };
          }
          preview.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
          preview.layoutSizingHorizontal = 'FILL';
          // Use a very large fixed width if layoutSizingHorizontal=FILL fails on older API
          preview.layoutGrow = 1; 

          // Role text (right)
          const roleText = figma.createText();
          row.appendChild(roleText);
          roleText.fontName = labelFont;
          const roleName = st.name.split('/').pop() || 'Body';
          roleText.characters = roleName.toUpperCase();
          roleText.fontSize = 18;
          roleText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
          roleText.layoutSizingHorizontal = 'FIXED';
          roleText.resize(100, roleText.height);
          roleText.textAlignHorizontal = 'RIGHT';
          
          frame.appendChild(row);
        }

        figma.currentPage.appendChild(frame);
        
        // Position frame in viewport
        figma.viewport.scrollAndZoomIntoView([frame]);
        
        figma.ui.postMessage({ type: 'PRESENTATION_CREATED', message: 'Presentation created on canvas' });
      } catch (err) {
        figma.notify(`Error: ${err.message}`);
        figma.ui.postMessage({ type: 'PRESENTATION_CREATED', message: `Error: ${err.message}` });
      }
      break;
    }

    case 'SELECT_NODE': {
      try {
        const node = await figma.getNodeByIdAsync(msg.nodeId);
        if (node) {
          let p = node;
          while (p && p.type !== 'PAGE') p = p.parent;
          if (p && p !== figma.currentPage) {
            figma.currentPage = p;
          }
          figma.currentPage.selection = [node];
          figma.viewport.scrollAndZoomIntoView([node]);
        }
      } catch (err) {
        figma.notify('Could not navigate to node');
      }
      break;
    }

    case 'CLOSE':
      figma.closePlugin();
      break;
  }
};

// ─── Selection listener and Contrast Helper functions ────────────────────────

figma.on('selectionchange', () => {
  sendSelectionColors();
  sendPrintSelection();
});

function getSolidColorOfNode(node) {
  if (!node) return null;
  let fills = null;
  if ('fills' in node) {
    fills = node.fills;
    if (fills === figma.mixed && typeof node.getRangeFills === 'function') {
      try {
        fills = node.getRangeFills(0, 1);
      } catch (e) {
        fills = null;
      }
    }
  }
  if (Array.isArray(fills)) {
    const solid = fills.find(f => f.type === 'SOLID' && f.visible !== false);
    if (solid) {
      return {
        r: solid.color.r,
        g: solid.color.g,
        b: solid.color.b,
        a: solid.opacity !== undefined ? solid.opacity : 1
      };
    }
  }
  return null;
}

function getBackgroundColorOfNode(node) {
  if (!node) return { r: 1, g: 1, b: 1, a: 1 };
  
  const colors = [];
  
  // 1. Check siblings below the node in its parent
  const parent = node.parent;
  if (parent && 'children' in parent) {
    const idx = parent.children.indexOf(node);
    if (idx > 0) {
      for (let i = idx - 1; i >= 0; i--) {
        const sibling = parent.children[i];
        const color = getSolidColorOfNode(sibling);
        if (color) {
          colors.push(color);
          if (color.a >= 1) break;
        }
      }
    }
  }
  
  // 2. Walk up parent hierarchy
  let current = parent;
  let hasOpaque = colors.some(c => c.a >= 1);
  
  while (current && !hasOpaque) {
    const color = getSolidColorOfNode(current);
    if (color) {
      colors.push(color);
      if (color.a >= 1) {
        hasOpaque = true;
        break;
      }
    }
    
    if (current.type === 'PAGE') {
      if ('backgrounds' in current && Array.isArray(current.backgrounds)) {
        const solid = current.backgrounds.find(f => f.type === 'SOLID');
        if (solid) {
          colors.push({ r: solid.color.r, g: solid.color.g, b: solid.color.b, a: 1 });
          hasOpaque = true;
        }
      }
      break;
    }
    current = current.parent;
  }
  
  // Fallback to white if no opaque background collected
  if (!hasOpaque) {
    colors.push({ r: 1, g: 1, b: 1, a: 1 });
  }
  
  // Blend from bottom (end of array) to top (start of array)
  let base = colors[colors.length - 1];
  for (let i = colors.length - 2; i >= 0; i--) {
    const layer = colors[i];
    base = {
      r: layer.r * layer.a + base.r * (1 - layer.a),
      g: layer.g * layer.a + base.g * (1 - layer.a),
      b: layer.b * layer.a + base.b * (1 - layer.a),
      a: layer.a + base.a * (1 - layer.a)
    };
  }
  
  return base;
}

function getVisualColorOfNode(node) {
  const solid = getSolidColorOfNode(node);
  if (!solid) return null;
  if (solid.a >= 1) return solid;
  const bg = getBackgroundColorOfNode(node);
  return {
    r: solid.r * solid.a + bg.r * (1 - solid.a),
    g: solid.g * solid.a + bg.g * (1 - solid.a),
    b: solid.b * solid.a + bg.b * (1 - solid.a),
    a: 1
  };
}

function isAncestor(child, potentialParent) {
  let p = child.parent;
  while (p) {
    if (p.id === potentialParent.id) return true;
    p = p.parent;
  }
  return false;
}

function extractFromTwoNodes(nodeA, nodeB) {
  if (isAncestor(nodeA, nodeB)) {
    return { fg: nodeA, bg: nodeB };
  }
  if (isAncestor(nodeB, nodeA)) {
    return { fg: nodeB, bg: nodeA };
  }
  if (nodeA.parent && nodeA.parent === nodeB.parent && 'children' in nodeA.parent) {
    const idxA = nodeA.parent.children.indexOf(nodeA);
    const idxB = nodeA.parent.children.indexOf(nodeB);
    if (idxA > idxB) {
      return { fg: nodeA, bg: nodeB };
    } else {
      return { fg: nodeB, bg: nodeA };
    }
  }
  return { fg: nodeA, bg: nodeB };
}

async function sendSelectionColors() {
  const selection = figma.currentPage.selection;
  if (!selection || selection.length === 0) {
    figma.ui.postMessage({ type: 'SELECTION_COLORS', fg: null, bg: null, count: 0 });
    return;
  }

  if (selection.length === 1) {
    const node = selection[0];
    const fgColor = getSolidColorOfNode(node);
    const bgColor = getBackgroundColorOfNode(node);
    
    const fgHex = fgColor ? rgbaToHex(fgColor.r, fgColor.g, fgColor.b, fgColor.a) : null;
    const bgHex = bgColor ? rgbaToHex(bgColor.r, bgColor.g, bgColor.b, bgColor.a) : null;
    
    figma.ui.postMessage({
      type: 'SELECTION_COLORS',
      fg: fgHex,
      bg: bgHex,
      count: 1,
      name: node.name
    });
  } else {
    const nodeA = selection[0];
    const nodeB = selection[1];
    const nodes = extractFromTwoNodes(nodeA, nodeB);
    
    const fgColor = getSolidColorOfNode(nodes.fg);
    let bgColor = getVisualColorOfNode(nodes.bg);
    if (!bgColor) {
      bgColor = getBackgroundColorOfNode(nodes.bg);
    }
    
    const fgHex = fgColor ? rgbaToHex(fgColor.r, fgColor.g, fgColor.b, fgColor.a) : null;
    const bgHex = bgColor ? rgbaToHex(bgColor.r, bgColor.g, bgColor.b, bgColor.a) : null;
    
    figma.ui.postMessage({
      type: 'SELECTION_COLORS',
      fg: fgHex,
      bg: bgHex,
      count: selection.length,
      name: `${nodes.fg.name} over ${nodes.bg.name}`
    });
  }
}

async function getColorTokens() {
  const allVarsArray = await figma.variables.getLocalVariablesAsync();
  const allVars = {};
  for (const v of allVarsArray) allVars[v.id] = v;

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const colMap = {};
  for (const c of collections) colMap[c.id] = c;

  const tokens = [];

  const colorVars = allVarsArray.filter(v => v.resolvedType === 'COLOR');
  for (const v of colorVars) {
    const col = colMap[v.variableCollectionId];
    const modes = col ? col.modes : [];
    for (const mode of modes) {
      const rawValue = v.valuesByMode[mode.modeId];
      const hexColor = resolveToHexColor(rawValue, allVars);
      if (hexColor) {
        const suffix = modes.length > 1 ? ` (${mode.name})` : '';
        tokens.push({
          name: v.name + suffix,
          hex: hexColor,
          type: 'variable'
        });
      }
    }
  }

  const paintStyles = figma.getLocalPaintStyles();
  for (const style of paintStyles) {
    const solid = style.paints.find(p => p.type === 'SOLID' && p.visible !== false);
    if (solid) {
      const hexColor = rgbaToHex(solid.color.r, solid.color.g, solid.color.b, solid.opacity !== undefined ? solid.opacity : 1);
      tokens.push({
        name: style.name,
        hex: hexColor,
        type: 'style'
      });
    }
  }

  return tokens;
}

function resolveToHexColor(value, allVariables) {
  if (!value) return null;
  if (typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    const ref = allVariables[value.id];
    if (ref) {
      for (const modeId in ref.valuesByMode) {
        const val = ref.valuesByMode[modeId];
        const res = resolveToHexColor(val, allVariables);
        if (res) return res;
      }
    }
    return null;
  }
  if (typeof value === 'object' && 'r' in value) {
    return rgbaToHex(value.r, value.g, value.b, value.a !== undefined ? value.a : 1);
  }
  return null;
}

