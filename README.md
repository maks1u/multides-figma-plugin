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
- **Export PDF**: Select one or more frames, choose **RGB** or **CMYK**, raster resolution (72, 150, 300, or 600 DPI), and a file name. Click **Prepare PDF**, then **Save PDF** to choose the destination where the host supports the system file picker. **Download PDF** uses the browser/Figma download destination when that picker is unavailable or blocked.
- **Physical size stays fixed** when changing DPI. Each selected frame becomes a page in selection order. A 7 cm frame is approximately 827 raster pixels wide at 300 DPI while its PDF page remains exactly 7 cm wide.
- Both modes **rasterize text and vectors** and flatten transparency onto white. Source artwork is exported as sRGB; CMYK embeds actual four-channel **DeviceCMYK** pixels using generic mathematical conversion. It has **no ICC output profile, PDF/X conformance, bleed, or crop marks**. For press-critical color, convert with the printer's ICC profile in a color-managed prepress tool.
- Conversion runs **locally**, without uploading artwork or modifying the original frames. Limits: 50 frames, 16 million raster pixels per page, 40 million per export, 8192 raster pixels per side, and 200 inches per PDF side. Reduce DPI or split the selection if needed. Rotated/scaled frames or parents must be reset before exporting. Selection is captured when preparation starts; avoid editing artwork until it finishes. Cancellation discards partial output.

Sizing and export behavior follow [Figma's export settings](https://help.figma.com/hc/en-us/articles/13402894554519-Export-formats-and-settings-for-static-designs) and [Plugin API export capabilities](https://developers.figma.com/docs/plugins/api/ExportSettings/).

Run `npm test` for conversion, PDF structure, and mocked Figma export checks. The implementation lives directly in `code.js` and `ui.html`; `npm run build` validates their JavaScript without generating or overwriting files, and `npm run watch` repeats validation when either file changes.


## 📂 File Architecture

| File | Description |
|------|-------------|
| `manifest.json` | Plugin manifest metadata |
| `code.js` | Figma sandbox backend — variables collector, layer analysis, canvas manipulation |
| `ui.html` | Self-contained plugin UI (HTML/CSS/JS, no external dependencies) |

---

## 🏷️ Tags & Search Keywords

**Tags:** Design Tokens · Variable Export · Contrast Checker · Color Palette · Accessibility · Typography · Typescales

**Keywords:** CSS variables, JSON tokens, Style Dictionary, LCH color grade, OKLCH converter, WCAG contrast, typography scale, variable usage, fluid typography, color scale generator, theme exporter
