# MultiDes — Designer & Developer Multi-Tool for Figma

[**🔗 Get it on Figma Community**](https://www.figma.com/community/plugin/1646195545147758648/multides)

> Export variables, check WCAG color contrast, generate color scales, build responsive typography systems, and track variable usage across your Figma files.

**MultiDes** is a utility plugin that bridges the gap between design systems and codebases. It gives designers and developers precise control over colors, typography, accessibility, and design token exports — all from a single centralized dashboard within Figma.

---

## 🚀 Key Features

### 1. Advanced Design Token & Variable Exporter
Translate Figma variables into production-ready code instantly.
- **Multi-Format Export**: Generates clean **CSS Custom Properties** (`:root` or mode-specific selectors) or structured **JSON Tokens** (ready for Style Dictionary).
- **5 Color Formats**: Export colors in **HEX**, **RGB**, **HSL**, **LCH**, or **OKLCH**.
- **Custom CSS Prefix**: Define your own CSS variable prefix (e.g., `--brand-` or `--color-`).
- **Alias Resolution**: Resolves variable references to standard dotted token structures (`{colors.primary}`).

### 2. WCAG 2.1 Contrast Checker (Accessibility / A11y)
Ensure your designs comply with WCAG 2.1 AA and AAA standards.
- **Smart Selection Sync**: Select any layers and the plugin automatically detects foreground and background colors.
- **Recursive Alpha Blending**: Correctly blends transparent/semi-transparent layers to calculate *true* visual contrast.
- **2-Layer Overlap Analyzer**: Resolves layer hierarchy for immediate contrast assessment between two overlapping shapes.

### 3. Color Grade Generator & Palette Builder
Create perceptually uniform color scales (`-100` to `-900`) and draw them onto the Figma canvas.
- **3 Interpolation Methods**: Perceptual LCH, Dynamic Hue-Shift, Classic Tint/Shade.
- **Add to Figma**: Creates a styled Auto-Layout frame with swatches, stop labels, and hex codes.

### 4. Typescales Generator
Build fluid and responsive typography scales perfectly sized for any screen.
- **Custom Ratios**: Choose from industry-standard scaling ratios (Balanced, Compact, Spacious, Expressive, Editorial) or define your own custom ratio.
- **Fine-Grained Control**: Select base font size, number of steps, and min/max limits.
- **Add to Figma**: Automatically generates text styles directly into your local Figma styles based on the chosen scale.

### 5. Variable Usage Tracker
Easily find where specific variables are used across your Figma file.
- **Scope Selection**: Search within the entire document or limit it to specific pages or selections.
- **Instant Navigating**: Quickly locate frames, shapes, or text layers using a specific token.

### 6. Quick Access Dashboard
- **Centralized Tools Menu**: Access all MultiDes features from a single, clean home screen.
- **Recently Used Tools**: MultiDes remembers your most frequently used features (like Color Grade or Typescales) and keeps them in a quick-access list at the bottom of the plugin window.

### 7. Print
- **Create Frame**: Enter width and height in centimeters, millimeters, or inches. The conversion uses **72 Figma units per inch**, matching PDF points, rather than the 96 px/in used for CSS. A **7 × 7 cm** frame is **198.42519685 × 198.42519685 px**; fractional dimensions are preserved. Print at **100% / actual size**, rather than fitting to paper.
- **Export PDF**: Select one or more frames and a file name. Click **Prepare PDF**, then **Save PDF** to choose the destination where the host supports the system file picker. **Download PDF** uses the browser/Figma download destination when that picker is unavailable or blocked.
- **Vector output**: Each frame uses Figma's native PDF export in sRGB. The plugin copies the PDF pages into one document with bundled [pdf-lib](https://pdf-lib.js.org/docs/api/classes/pdfdocument#copypages), preserving vector paths, text/glyphs, fonts, and transparency from Figma's export instead of converting whole pages into images. Photos and effects rasterized by Figma remain raster; text editability follows Figma's exporter.
- **Convert text to outlines**: Enable this checkbox to replace visible text (including text on paths and inside component instances) with vector paths in the exported PDF using [Figma's flatten API](https://developers.figma.com/docs/plugins/api/properties/figma-flatten/). Conversion uses temporary copies, freezes auto-layout positioning, and leaves original frames and raster image layers unchanged. The PDF needs no fonts for the outlined text, which is no longer searchable, selectable, or editable as text. Fonts must be available in Figma during conversion; missing fonts stop the export with an explanation. Copies are removed on completion, error, cancellation, or plugin close.
- **Exact physical size**: Each selected frame becomes a page in selection order, using 72 PDF points per inch. Fractional page bounds are preserved, so a 7 cm frame produces a 7 cm PDF page. Vector output has no DPI setting or raster pixel limits.
- **Print color**: The previous raster CMYK conversion is removed. Figma's PDF API supports RGB profiles, not CMYK. For CMYK or PDF/X delivery, convert the vector PDF with the printer's ICC profile in a color-managed prepress tool. The plugin does not add bleed or crop marks.
- Export runs **locally**, without uploading artwork or modifying the original frames. Limits: 50 frames and 200 inches per PDF side. Rotated/scaled frames or parents must be reset before exporting. Selection is captured when preparation starts; avoid editing artwork until it finishes. Cancellation discards partial output.

Sizing and export behavior follow [Figma's export settings](https://help.figma.com/hc/en-us/articles/13402894554519-Export-formats-and-settings-for-static-designs) and [Plugin API export capabilities](https://developers.figma.com/docs/plugins/api/ExportSettings/).

Run `npm install` and `npm run build` to refresh the embedded pdf-lib bundle in `ui.html` and validate the plugin JavaScript. Run `npm test` for physical sizing, preserved vector/text content, multipage PDF structure, and mocked Figma export/UI checks. The implementation lives directly in `code.js` and `ui.html`; `npm run watch` repeats bundling and validation when either file changes. The checked-in UI remains self-contained for Figma; no CDN access is needed for PDF export.


## 📂 File Architecture

| File | Description |
|------|-------------|
| `manifest.json` | Plugin manifest metadata |
| `code.js` | Figma sandbox backend — variables collector, layer analysis, canvas manipulation |
| `ui.html` | Self-contained plugin UI with embedded pdf-lib for vector PDF page merging |

---

## 🏷️ Tags & Search Keywords

**Tags:** Design Tokens · Variable Export · Contrast Checker · Color Palette · Accessibility · Typography · Typescales

**Keywords:** CSS variables, JSON tokens, Style Dictionary, LCH color grade, OKLCH converter, WCAG contrast, typography scale, variable usage, fluid typography, color scale generator, theme exporter
