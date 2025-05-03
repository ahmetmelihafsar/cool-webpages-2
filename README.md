# STEM Tactical Interface

A modern, interactive web platform for STEM education and tactical simulation. This project features advanced 3D visualizations, interactive controls, and a neon-themed UI inspired by Watch Dogs, built with HTML, CSS, JavaScript, and Three.js/WebGL.

---

## Table of Contents

- [STEM Tactical Interface](#stem-tactical-interface)
  - [Table of Contents](#table-of-contents)
  - [Key Features](#key-features)
  - [Main Pages](#main-pages)
    - [1. **Dashboard (index.html)**](#1-dashboard-indexhtml)
    - [2. **Global Threat Map (global\_threat\_map.html)**](#2-global-threat-map-global_threat_maphtml)
    - [3. **Terrain \& Drone Control (terrain\_control.html)**](#3-terrain--drone-control-terrain_controlhtml)
    - [4. **Challenge Selector (challenge\_selector.html)**](#4-challenge-selector-challenge_selectorhtml)
    - [5. **Medical Triage (medical\_triage.html)**](#5-medical-triage-medical_triagehtml)
  - [Visual Style \& Technology Stack](#visual-style--technology-stack)
  - [Mobile Responsiveness \& Accessibility](#mobile-responsiveness--accessibility)
  - [Setup Instructions](#setup-instructions)
  - [File/Folder Structure](#filefolder-structure)
  - [Customization Options](#customization-options)
  - [Credits](#credits)
  - [License](#license)

---

## Key Features

- **Interactive 3D Visualizations:** Real-time graphics powered by Three.js/WebGL.
- **Modular Multi-Page UI:** Each page serves a distinct STEM/tactical function.
- **Mobile-First Responsive Design:** Optimized for all devices and orientations.
- **Accessibility:** Keyboard navigation, ARIA labels, and high-contrast support.
- **Customizable Theme:** Neon amber/cyan palette, monospaced fonts, and CSS variables.
- **Touch & Drag Support:** Mobile-friendly controls and drag-and-drop UI elements.

---

## Main Pages

### 1. **Dashboard (index.html)**

- Central navigation hub linking to all modules.
- Clean, accessible layout with neon accent navigation.

### 2. **Global Threat Map (global_threat_map.html)**

- 3D globe visualization with interactive overlays.
- Explosion/current coordinate display, axes and shading toggles.
- Sidebar for coordinate input and solution panel.

### 3. **Terrain & Drone Control (terrain_control.html)**

- Procedural 3D terrain with thermal/spectral modes.
- Drag-and-drop waypoint icons (triangle, square, circle).
- Scan info, thumbnail preview, and terrain regeneration.
- Fully interactive with mobile touch and desktop controls.

### 4. **Challenge Selector (challenge_selector.html)**

- Carousel of geometric STEM challenges with animated previews.
- Timeline scrubber for challenge progression.
- Unlock status, glowing highlight, and smooth transitions.

### 5. **Medical Triage (medical_triage.html)**

- 3D patient visualization with vitals HUD and injury/treatment panels.
- Interactive treatment actions (irrigate, debris removal, pain med, suture, bandage).
- Event log, animated effects, and lore-based patient data.

---

## Visual Style & Technology Stack

- **HTML5**: Semantic, accessible structure.
- **CSS3**: Neon/amber theme, responsive grid/flex layouts, custom properties.
- **JavaScript (ES6+)**: Modular page scripts, event-driven UI.
- **Three.js/WebGL**: Advanced 3D graphics and animation.
- **Fonts**: 'Roboto Mono', monospace for a technical look.

---

## Mobile Responsiveness & Accessibility

- **Responsive Layouts:** CSS grid/flex, media queries for all breakpoints.
- **Touch Targets:** Large, accessible buttons and controls.
- **Accessibility:** ARIA labels, keyboard navigation, high-contrast and reduced-motion support.
- **Performance:** Optimized for smooth rendering on mobile and desktop.

---

## Setup Instructions

1. **Clone the repository:**

   ```sh
   git clone https://github.com/ahmetmelihafsar/cool-webpages-2
   cd cool-webpages-2
   ```

2. **Open any `.html` file in your browser** (no build step required).
3. **For full 3D features, ensure internet access for Three.js CDN or run:**

   ```sh
   npm install three
   ```

4. **Optional:** Use a local server for best results (e.g., VSCode Live Server).

---

## File/Folder Structure

```
.
├── index.html
├── global_threat_map.html
├── terrain_control.html
├── challenge_selector.html
├── medical_triage.html
├── js/
│   ├── main.js
│   ├── global_threat_map.js
│   ├── terrain_control.js
│   ├── challenge_selector.js
│   ├── medical_triage.js
│   └── three.min.js
├── styles/
│   ├── main.css
│   ├── global_threat_map.css
│   ├── terrain_control.css
│   ├── challenge_selector.css
│   ├── medical_triage.css
├── assets/
│   └── mock_scan_thumb.png
└── README.md
```

---

## Customization Options

- **Theme:** Edit `styles/main.css` and page CSS for colors, fonts, and spacing.
- **3D Density/Quality:** Adjust point cloud/geometry parameters in JS files.
- **Page Modules:** Add new HTML/JS/CSS files for additional STEM tools.
- **Controls:** Toggle axes, shading, and modes via UI overlays.
- **Accessibility:** Tweak font sizes, contrast, and ARIA attributes in CSS/HTML.

---

## Credits

- **Project Lead & Code:** Roo
- **3D Graphics:** [Three.js](https://threejs.org/)
- **UI Inspiration:** Watch Dogs, STEM/medical simulation UIs

---

## License

MIT License. See [LICENSE](LICENSE) for details.
