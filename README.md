# MultiDes — Designer & Developer Multi-Tool for Figma

> Export variables to CSS/JSON, check WCAG color contrast with smart background blending, and generate perceptual LCH or hue-shifted color scales.

**MultiDes** is a utility plugin that bridges the gap between design systems and codebases. It gives designers and developers precise control over colors, accessibility, and design token exports — all from within Figma.

---

## 🚀 Key Features

### 1. Advanced Design Token & Variable Exporter
Translate Figma variables into production-ready code instantly.
- **Multi-Format Export**: Generates clean **CSS Custom Properties** (`:root` or mode-specific selectors) or structured **JSON Tokens** (ready for Style Dictionary).
- **5 Color Formats**: Export colors in **HEX**, **RGB**, **HSL**, **LCH**, or **OKLCH**.
- **Custom CSS Prefix**: Define your own CSS variable prefix (e.g., `--brand-` or `--color-`).
- **Copy & Save**: One-click copy to clipboard or direct file download (`variables.css` / `variables.json`).
- **Alias Resolution**: Resolves variable references to standard dotted token structures (`{colors.primary}`).

### 2. WCAG 2.1 Contrast Checker (Accessibility / A11y)
Ensure your designs comply with WCAG 2.1 AA and AAA standards.
- **Smart Selection Sync**: Select any layers and the plugin automatically detects foreground and background colors.
- **Recursive Alpha Blending**: Correctly blends transparent/semi-transparent layers to calculate *true* visual contrast.
- **2-Layer Overlap Analyzer**: Select two overlapping layers — the plugin resolves layer hierarchy for immediate contrast assessment.
- **Searchable Token Picker**: Pick color values from local variable collections or solid paint styles.

### 3. Color Grade Generator & Palette Builder
Create perceptually uniform color scales (`-100` to `-900`) and draw them onto the Figma canvas.
- **3 Interpolation Methods**: Perceptual LCH, Dynamic Hue-Shift, Classic Tint/Shade.
- **Add to Figma**: Creates a styled Auto-Layout frame with 64×64px swatches, stop labels, and hex codes.

---

## 🧪 Testing Instructions for Figma Reviewers

> **No paid access, external accounts, or local setup required.**
> The plugin is fully self-contained and works with any Figma document.

### Getting Started

1. Install **MultiDes** from the Figma Community.
2. Open any Figma file (a new blank file works fine).
3. Run the plugin: **Main Menu → Plugins → MultiDes**.
4. The plugin window will open immediately — you will see three tabs: **Exporter**, **Contrast**, and **Color Grade**.

---

### Tab 1 — Exporter (Variable Export)

**Testing with an existing Figma file that has variables:**
1. Open a Figma file that has local variable collections (or create a few test variables via the Variables panel).
2. Run MultiDes. The **Exporter** tab loads all collections, groups, and modes automatically.
3. Expand a collection, check the groups and modes you want to export.
4. Select a format: **CSS** or **JSON**, and a color format: **HEX**, **RGB**, **HSL**, **LCH**, or **OKLCH**.
5. Click **Export** — the output appears in the text area below.
6. Use **Copy** to copy to clipboard, or **Download** to save the file.

**Testing with a blank file (no variables):**
1. Open a new blank Figma file and run the plugin.
2. The Exporter tab will show an empty state message: *"No local variable collections found."*
3. The plugin opens and runs correctly — no errors.

---

### Tab 2 — Contrast Checker

**Single layer test:**
1. Draw a rectangle on the canvas and give it a solid fill color.
2. Select the rectangle.
3. Switch to the **Contrast** tab in the plugin.
4. The plugin will automatically populate the **Foreground** and **Background** color fields based on your selection.
5. The WCAG contrast ratio, AA badge, and AAA badge update in real time.

**Two-layer test:**
1. Draw a background rectangle (e.g., dark blue fill).
2. Place a smaller rectangle on top (e.g., white fill).
3. Select both layers.
4. The plugin resolves layer order automatically and shows the contrast between the two colors.

**Manual color input:**
1. Click either the foreground or background color swatch.
2. Enter any hex value (e.g., `#1a1a2e`) to manually set a color.
3. The ratio updates immediately.

**Token Picker:**
1. Click the search icon next to either color swatch.
2. A searchable list of your local color variables and paint styles will appear.
3. Click any token to use it as the foreground or background color.

---

### Tab 3 — Color Grade Generator

1. Switch to the **Color Grade** tab.
2. Click the color swatch and pick or type a base color (e.g., `#3b82f6`).
3. Choose a scale name (e.g., `blue`), number of stops (e.g., 9), and interpolation method (**LCH**, **Hue-Shift**, or **Tint/Shade**).
4. Click **Generate** to preview the palette in the plugin.
5. Click **Add to Figma** to place the palette as an Auto-Layout frame directly on your canvas.

---

## 📂 File Architecture

| File | Description |
|------|-------------|
| `manifest.json` | Plugin manifest metadata |
| `code.js` | Figma sandbox backend — variables collector, layer analysis, canvas manipulation |
| `ui.html` | Self-contained plugin UI (HTML/CSS/JS, no external dependencies) |

---

## 🏷️ Tags & Search Keywords

**Tags:** Design Tokens · Variable Export · Contrast Checker · Color Palette · Accessibility

**Keywords:** CSS variables, JSON tokens, Style Dictionary, LCH color grade, OKLCH converter, WCAG contrast, a11y contrast validator, color scale generator, hue shift palette, theme exporter, variable utility, dark mode variables
