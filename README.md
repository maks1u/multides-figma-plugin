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
