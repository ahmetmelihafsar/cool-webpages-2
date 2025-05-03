# Frontend Implementation Plan: Project Watch Dogs UI

## 1. Overall Architecture

### 1.1. File Structure

```
.
├── index.html
├── global_threat_map.html
├── terrain_control.html
├── challenge_selector.html
├── medical_triage.html
├── styles/
│   ├── main.css         # Global styles, variables, base layout
│   ├── global_threat_map.css
│   ├── terrain_control.css
│   ├── challenge_selector.css
│   └── medical_triage.css
└── js/
    ├── main.js          # Global helpers, navigation logic (if needed)
    ├── three.min.js     # Three.js library
    ├── global_threat_map.js
    ├── terrain_control.js
    ├── challenge_selector.js
    └── medical_triage.js
```

### 1.2. `index.html` - Navigation Hub

* **Purpose:** Acts as the main landing page and primary navigation point.
* **Content:**
  * Minimalist header/title reflecting the project theme.
  * A central navigation element (e.g., a list, grid, or interactive graphic) linking to the four main pages:
    * Global Threat Map (`global_threat_map.html`)
    * Terrain Control (`terrain_control.html`)
    * Challenge Selector (`challenge_selector.html`)
    * Medical Triage (`medical_triage.html`)
  * Subtle background animation or effect consistent with the Watch Dogs theme.
  * Basic footer (optional).
* **Styling:** Uses `styles/main.css` for layout and theme.

### 1.3. Navigation Mechanism

* Standard HTML anchor tags (`<a>`) will be used for navigation between `index.html` and the individual pages.
* Each page will include a consistent way to navigate back to `index.html` or potentially to other main pages (e.g., a persistent header or sidebar navigation element).

## 2. Visual Style Implementation ("Watch Dogs" Aesthetic)

* **Base Palette:** Deep black (`#000000` or near-black) background, Neon Amber (`#FFB400`) for accents, highlights, and interactive elements. Grayscale tones for secondary information.
* **CSS Variables:** Define core colors and potentially font sizes/families in `:root` within `styles/main.css` for easy management and customization.

    ```css
    /* styles/main.css */
    :root {
      --color-background: #050505;
      --color-primary-accent: #FFB400;
      --color-secondary-text: #a0a0a0;
      --color-primary-text: #f0f0f0;
      --font-primary: 'Roboto Mono', monospace; /* Example */
    }

    body {
      background-color: var(--color-background);
      color: var(--color-primary-text);
      font-family: var(--font-primary);
      margin: 0;
      padding: 0;
      overflow: hidden; /* Prevent scrollbars unless necessary within components */
    }
    ```

* **Typography:** Minimalist, monospace, or clean sans-serif fonts (e.g., Roboto Mono, Source Code Pro, Montserrat). Use varying weights and sizes sparingly for hierarchy.
* **Geometric Overlays & Wireframes:** Achieved using CSS borders, pseudo-elements (`::before`, `::after`), background gradients, and potentially SVG elements for more complex shapes. Three.js `LineBasicMaterial` or `LineSegments` will be used for 3D wireframes.
* **Point Cloud Visualizations:** Primarily handled by Three.js using `PointsMaterial` and custom shaders for effects like size attenuation, color variation based on data, and subtle animation.
* **Glitch/Grain Effects:**
  * **CSS:** Subtle background noise using CSS gradients or pseudo-elements with animated `clip-path` or `transform` properties. A repeating noise texture image can also be used as a background overlay with low opacity.
  * **Three.js:** Post-processing shader passes (e.g., FilmPass for grain, custom shaders for glitch effects) applied to the rendered scene.
* **Cinematic Framing:** Use of letterboxing (black bars top/bottom using fixed-position divs or main container padding), careful layout composition (using CSS Grid/Flexbox), and potentially subtle vignette effects (CSS radial gradients or Three.js post-processing).
* **Layout:** Primarily CSS Flexbox and Grid for structuring pages and components, ensuring responsiveness where applicable (though the aesthetic leans towards fixed-layout interfaces).

## 3. Customization Strategy

* **Color Themes:** Primarily controlled via CSS custom properties (`:root` variables in `styles/main.css`). Different themes could be applied by changing these variables (e.g., via JavaScript or separate CSS files).
* **Point Cloud Density/Appearance:** Controlled by JavaScript variables passed into the Three.js setup functions (e.g., `particleCount`, `particleSize`). Shader uniforms will control real-time appearance changes (color, animation speed).
* **Glitch/Effect Intensity:** CSS variables for animation speeds/opacities. JavaScript variables and shader uniforms for Three.js post-processing effects.
* **Data Visualization Parameters:** Thresholds, color mappings, and data ranges for heatmaps or point clouds will be configurable via JavaScript constants or potentially simple UI controls (if required by `task.md`).

## 4. Page-Specific Breakdowns

### 4.1. Global Threat Map (`global_threat_map.html`)

* **HTML Structure (`global_threat_map.html`):**
  * `<header>`: Page title ("Global Threat Map"), navigation back link.
  * `<main>`:
    * `<div id="map-container">`: Container for the Three.js canvas.
      * `<canvas id="map-canvas"></canvas>`
    * `<aside id="map-sidebar">`: UI controls, legend, data display.
      * `<div class="controls">` (e.g., zoom, rotation toggles)
      * `<div class="legend">` (Explaining point colors/sizes)
      * `<div class="data-display">` (Info on selected threat)
  * `<footer>` (Optional): Minimal status info.
* **CSS Styling (`styles/global_threat_map.css`):**
  * Layout: Use CSS Grid or Flexbox to position `#map-container` and `#map-sidebar`.
  * Theme: Apply amber accents to controls, borders, and text highlights. Style the sidebar with a semi-transparent dark background.
  * Canvas: Ensure the canvas fills its container.
* **JavaScript Logic (`js/global_threat_map.js`):**
  * DOM: Get references to canvas, sidebar elements.
  * Data: Load/manage mock threat data (e.g., `{lat, lon, severity, type}`).
  * Three.js Setup: Initialize scene, camera (PerspectiveCamera), renderer, orbit controls (or custom rotation).
  * Event Handling: Handle clicks/hovers on sidebar controls. Implement raycasting for interaction with 3D points. Update `#data-display` on selection.
* **Three.js/WebGL Integration:**
  * **Geometry:** `SphereGeometry` for the Earth globe (potentially low-poly). Custom buffer geometry for threat points, storing data attributes (like severity) per point.
  * **Materials:**
    * Globe: `MeshBasicMaterial` (wireframe: true, color: amber) or `ShaderMaterial` for a more stylized look (e.g., subtle scan lines).
    * Points: `PointsMaterial` with size attenuation enabled, or `ShaderMaterial` for custom point rendering (e.g., pulsing, color based on severity attribute).
  * **Shaders:**
    * Vertex Shader (Points): Control point size (`gl_PointSize`) based on distance and/or severity attribute.
    * Fragment Shader (Points): Control point color (`gl_FragColor`) based on severity attribute or interaction state (hover/selected). Add pulsing effect using `sin(time)`.
  * **Interaction:** Use `Raycaster` to detect intersections between mouse clicks/hovers and the threat points. Highlight selected points (change color/size via shader uniform or material property).

### 4.2. Terrain Control (`terrain_control.html`)

* **HTML Structure (`terrain_control.html`):**
  * `<header>`: Page title ("Terrain Control"), navigation back link.
  * `<main>`:
    * `<div id="terrain-container">`: Container for the Three.js canvas.
      * `<canvas id="terrain-canvas"></canvas>`
    * `<aside id="terrain-controls">`: Sliders, toggles for terrain parameters.
      * `<label for="height-scale">Height Scale:</label><input type="range" id="height-scale">`
      * `<label for="wireframe-toggle">Wireframe:</label><input type="checkbox" id="wireframe-toggle">`
      * `<div id="terrain-info">` (Displaying coordinates, height at cursor)
  * `<footer>` (Optional).
* **CSS Styling (`styles/terrain_control.css`):**
  * Layout: Position canvas and controls sidebar (Grid/Flexbox).
  * Theme: Style controls (sliders, checkboxes) with the amber/black theme.
  * Canvas: Ensure canvas fills container.
* **JavaScript Logic (`js/terrain_control.js`):**
  * DOM: Get references to canvas, controls, info display.
  * Data: Load/generate mock heightmap data (e.g., 2D array or image).
  * Three.js Setup: Scene, camera (PerspectiveCamera), renderer, orbit controls.
  * Event Handling: Listen for changes on control inputs (height scale, wireframe toggle). Update Three.js material/geometry accordingly. Use raycasting to find intersection point with terrain for displaying info.
* **Three.js/WebGL Integration:**
  * **Geometry:** `PlaneGeometry` with vertex displacement based on heightmap data. Adjust segment count for detail.
  * **Materials:**
    * `MeshStandardMaterial` or `MeshLambertMaterial` for basic shaded terrain (requires lights).
    * `MeshBasicMaterial` with `wireframe: true` for wireframe view.
    * `ShaderMaterial` for custom effects (e.g., heatmap coloring based on height, contour lines).
  * **Shaders (if using `ShaderMaterial`):**
    * Vertex Shader: Access heightmap texture or data array, displace `position.z` based on height value. Calculate normals for lighting.
    * Fragment Shader: Apply color based on height (heatmap), lighting calculations, or texture mapping. Implement contour lines based on height modulo some interval.
  * **Interaction:** Raycast from mouse onto the terrain mesh to get the 3D intersection point and corresponding height value. Update `#terrain-info`.

### 4.3. Challenge Selector (`challenge_selector.html`)

* **HTML Structure (`challenge_selector.html`):**
  * `<header>`: Page title ("Challenge Selector"), navigation back link.
  * `<main id="challenge-list-container">`:
    * `<ul id="challenge-list">`
      * `<!-- List items generated by JS -->`
      * `<li class="challenge-item" data-challenge-id="c1"><h3>Challenge Title 1</h3><p>Brief description...</p><span class="status">Locked</span></li>`
    * `</ul>`
  * `<aside id="challenge-details">`
    * `<h2>Selected Challenge Details</h2>`
    * `<div id="details-content">Select a challenge...</div>`
  * `<footer>` (Optional).
* **CSS Styling (`styles/challenge_selector.css`):**
  * Layout: Use Flexbox/Grid to arrange the list and details panel side-by-side or stacked.
  * Theme: Style list items with borders, hover effects (amber glow/highlight). Style the details panel. Use amber for status indicators or selected item highlights. Apply subtle geometric background patterns.
  * List: Style `ul` and `li` for spacing, borders, hover/active states.
* **JavaScript Logic (`js/challenge_selector.js`):**
  * DOM: Get references to list container, details panel.
  * Data: Load/manage mock challenge data (e.g., `[{id, title, description, status, details}]`).
  * Rendering: Dynamically generate `<li>` elements from mock data and append to `#challenge-list`.
  * Event Handling: Add click listeners to list items. On click, update the `#details-content` with the selected challenge's details. Highlight the selected list item.
* **Three.js/WebGL Integration:** (Minimal/Optional)
  * Could have a subtle background animation using Three.js in a background canvas (e.g., slowly rotating geometric shapes, particle field). This would be independent of the main UI logic.
  * Setup would involve a simple scene in `js/challenge_selector.js` targeting a background canvas element.

### 4.4. Medical Triage (`medical_triage.html`)

* **HTML Structure (`medical_triage.html`):**
  * `<header>`: Page title ("Medical Triage"), navigation back link.
  * `<main id="triage-dashboard">`:
    * `<div id="patient-list-container">`
      * `<h2>Patient Queue</h2>`
      * `<ul id="patient-list">`
        * `<!-- Populated by JS -->`
        * `<li class="patient-item priority-high" data-patient-id="p1">ID: P1 | Status: Critical | Vitals: ...</li>`
      * `</ul>`
    * `<div id="patient-details-3d">`
      * `<canvas id="vitals-canvas"></canvas>`
    * `<div id="patient-info-panel">`
      * `<h2>Patient Details (ID: <span id="patient-id-display"></span>)</h2>`
      * `<div id="vitals-text"></div>`
      * `<div id="logs"></div>`
  * `<footer>` (Optional).
* **CSS Styling (`styles/medical_triage.css`):**
  * Layout: Use CSS Grid to create dashboard layout (e.g., list on left, 3D view center, info panel right).
  * Theme: Use amber/red/yellow for priority indicators in the list. Style panels with dark backgrounds and amber borders. Ensure text is clear and readable.
  * Canvas: Position canvas within its grid area.
* **JavaScript Logic (`js/medical_triage.js`):**
  * DOM: Get references to list, canvas, info panel elements.
  * Data: Load/manage mock patient data (e.g., `[{id, name, status, priority, vitals: {hr, bp, spo2}, logs}]`). Simulate updates to vitals over time.
  * Rendering: Populate `#patient-list`. Update list item styles based on priority/status.
  * Event Handling: Handle clicks on patient list items. Update info panel (`#patient-id-display`, `#vitals-text`, `#logs`) and potentially the 3D visualization based on the selected patient.
  * Three.js Setup: Initialize scene, camera, renderer for `#vitals-canvas`.
* **Three.js/WebGL Integration:**
  * **Purpose:** Visualize patient vitals abstractly (not a realistic body scan).
  * **Geometry:** Custom geometries representing vital signs (e.g., simple pulsating shapes, line graphs using `LineSegments`, particle systems where density/color represents a vital sign). Could use `TextGeometry` for displaying key values in 3D space.
  * **Materials:** `MeshBasicMaterial`, `LineBasicMaterial`, `PointsMaterial`, potentially `ShaderMaterial` for dynamic effects based on vital data. Colors should reflect status (e.g., stable=green/blue, warning=amber, critical=red - adjust palette to fit theme).
  * **Shaders (if using `ShaderMaterial`):** Animate geometries based on vital sign values (e.g., scale pulsation speed with heart rate, change color intensity with SpO2).
  * **Interaction:** Primarily driven by selecting a patient from the 2D list. The 3D view updates to reflect the selected patient's data. Minimal direct 3D interaction needed, perhaps camera controls.

## 5. Mock Data Strategy

* All dynamic data (threats, terrain heightmaps, challenges, patient info, vitals) will be represented by static JavaScript objects or arrays defined directly within the respective `.js` files (e.g., `js/global_threat_map.js`).
* For time-based data (like patient vitals), `setInterval` or `requestAnimationFrame` will be used to simulate updates to the mock data structures and trigger UI/3D view refreshes.
* No actual API calls will be made. Functions intended for API interaction will simply return mock data immediately.
