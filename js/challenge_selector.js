// js/challenge_selector.js

/**
 * Challenge Selector Page Logic (Advanced, WebGL context fix)
 * - Renders live geometric icon previews in carousel (WebGL context reuse).
 * - Smooth carousel transitions and highlight animation.
 * - Shows challenge description and unlock status.
 * - Timeline scrubber updates value display.
 * - Watch Dogs neon theme.
 * Author: Roo
 */

/* global THREE (assumes js/three.min.js is loaded globally) */

// ---- Mock Challenge Data ----
/**
 * @typedef {Object} Challenge
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {boolean} unlocked
 * @property {number} timelineMax
 */
const CHALLENGES = [
    { id: 'c1', name: 'Hex Grid', description: 'Solve the hexagonal puzzle.', unlocked: true, timelineMax: 100 },
    { id: 'c2', name: 'Wireframe Maze', description: 'Navigate the neon maze.', unlocked: false, timelineMax: 80 },
    { id: 'c3', name: 'Data Prism', description: 'Decrypt the data prism.', unlocked: false, timelineMax: 120 },
    { id: 'c4', name: 'Pulse Node', description: 'Sync the pulse nodes.', unlocked: false, timelineMax: 60 }
];

// ---- Carousel State ----
let currentIndex = 0;

// ---- DOM Elements ----
let canvas, carouselItemsDiv, labelSpan, descDiv, timelineScrubber, timelineValueSpan;

// ---- Three.js Scene for Main Canvas ----
let renderer, scene, camera, iconMeshes = [];

// ---- Carousel Preview Cache ----
/**
 * Caches preview canvases for each challenge to avoid WebGL context exhaustion.
 * @type {HTMLCanvasElement[]}
 */
const previewCanvasCache = [];

/**
 * Create a geometric icon mesh for a challenge.
 * @param {number} idx
 * @returns {THREE.LineLoop}
 */
function createIconMesh(idx, highQuality = false) {
    let geometry, material, mesh;
    switch (idx) {
        case 0: // Hex Grid: 7 hexagons in a honeycomb
            geometry = new THREE.BufferGeometry();
            {
                const hex = (cx, cy, r, segs) => {
                    const pts = [];
                    for (let i = 0; i < segs; i++) {
                        const a = (i / segs) * Math.PI * 2;
                        pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0));
                    }
                    pts.push(pts[0]);
                    return pts;
                };
                const segs = highQuality ? 48 : 6;
                const r = 0.32;
                const centers = [
                    [0, 0],
                    [r * Math.sqrt(3), 0],
                    [-r * Math.sqrt(3), 0],
                    [r * Math.sqrt(3) / 2, r * 1.5],
                    [-r * Math.sqrt(3) / 2, r * 1.5],
                    [r * Math.sqrt(3) / 2, -r * 1.5],
                    [-r * Math.sqrt(3) / 2, -r * 1.5]
                ];
                let pts = [];
                for (const [cx, cy] of centers) {
                    pts = pts.concat(hex(cx, cy, r, segs));
                }
                geometry.setFromPoints(pts);
            }
            break;
        case 1: // Wireframe Maze: grid with a zigzag path
            geometry = new THREE.BufferGeometry();
            {
                const size = 1.6;
                const gridN = highQuality ? 7 : 4;
                const pts = [];
                // Draw grid
                for (let i = 0; i <= gridN; i++) {
                    const t = -size / 2 + (size * i) / gridN;
                    pts.push(new THREE.Vector3(t, -size / 2, 0));
                    pts.push(new THREE.Vector3(t, size / 2, 0));
                    pts.push(new THREE.Vector3(-size / 2, t, 0));
                    pts.push(new THREE.Vector3(size / 2, t, 0));
                }
                // Draw zigzag path
                let x = -size / 2, y = -size / 2;
                pts.push(new THREE.Vector3(x, y, 0));
                for (let i = 0; i < gridN; i++) {
                    x = (i % 2 === 0) ? size / 2 : -size / 2;
                    y += size / gridN;
                    pts.push(new THREE.Vector3(x, y, 0));
                }
                geometry.setFromPoints(pts);
            }
            break;
        case 2: // Data Prism: 3D prism wireframe projected to 2D
            geometry = new THREE.BufferGeometry();
            {
                // Prism base
                const sides = highQuality ? 8 : 6;
                const r = 0.9;
                const h = 1.1;
                const pts = [];
                // Bottom face
                for (let i = 0; i < sides; i++) {
                    const a = (i / sides) * Math.PI * 2;
                    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, -h / 2));
                }
                // Top face
                for (let i = 0; i < sides; i++) {
                    const a = (i / sides) * Math.PI * 2;
                    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, h / 2));
                }
                // Connect sides
                for (let i = 0; i < sides; i++) {
                    pts.push(new THREE.Vector3(Math.cos(i / sides * Math.PI * 2) * r, Math.sin(i / sides * Math.PI * 2) * r, -h / 2));
                    pts.push(new THREE.Vector3(Math.cos(i / sides * Math.PI * 2) * r, Math.sin(i / sides * Math.PI * 2) * r, h / 2));
                }
                geometry.setFromPoints(pts);
            }
            break;
        case 3: // Pulse Node: central node with radiating lines and orbiting nodes
            geometry = new THREE.BufferGeometry();
            {
                const rays = highQuality ? 12 : 6;
                const pts = [];
                // Central node
                for (let i = 0; i < rays; i++) {
                    const a = (i / rays) * Math.PI * 2;
                    pts.push(new THREE.Vector3(0, 0, 0));
                    pts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
                }
                // Orbiting nodes (small circles)
                const segs = highQuality ? 24 : 8;
                for (let i = 0; i < rays; i++) {
                    const a = (i / rays) * Math.PI * 2;
                    const cx = Math.cos(a);
                    const cy = Math.sin(a);
                    for (let j = 0; j <= segs; j++) {
                        const b = (j / segs) * Math.PI * 2;
                        pts.push(new THREE.Vector3(cx + 0.18 * Math.cos(b), cy + 0.18 * Math.sin(b), 0));
                    }
                }
                geometry.setFromPoints(pts);
            }
            break;
        default:
            geometry = new THREE.CircleGeometry(1, highQuality ? 48 : 5);
    }
    material = new THREE.LineBasicMaterial({
        color: 0xFFB400,
        linewidth: 2,
        transparent: true,
        opacity: 0.85
    });
    mesh = new THREE.LineSegments(geometry, material);
    mesh.position.set(0, 0, 0);
    return mesh;
}

/**
 * Initialize Three.js scene and render geometric icons as glowing line-loops.
 */
function initThree() {
    canvas = document.getElementById('challenge-canvas');
    const dpr = window.devicePixelRatio || 1;
    // Set canvas size for HiDPI
    const width = 600, height = 220;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);

    scene = new THREE.Scene();

    iconMeshes = CHALLENGES.map((_, idx) => createIconMesh(idx, true)); // highQuality for main view
}

/**
 * Render the currently selected icon in the center of the canvas.
 */
function renderIcon() {
    scene.clear();
    const mesh = iconMeshes[currentIndex];
    mesh.rotation.z += 0.01;
    scene.add(mesh);
    renderer.render(scene, camera);
}

/**
 * Render a geometric icon preview to a canvas for the carousel.
 * Caches the result to avoid creating too many WebGL contexts.
 * @param {number} idx
 * @returns {HTMLCanvasElement}
 */
function renderIconPreview(idx) {
    if (previewCanvasCache[idx]) {
        return previewCanvasCache[idx];
    }
    // High-DPI, high-fidelity preview
    const dpr = window.devicePixelRatio || 1;
    const size = 96;
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = size * dpr;
    previewCanvas.height = size * dpr;
    previewCanvas.style.width = size + 'px';
    previewCanvas.style.height = size + 'px';

    // Create a renderer for this canvas
    const previewRenderer = new THREE.WebGLRenderer({
        canvas: previewCanvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
    });
    previewRenderer.setClearColor(0x000000, 0);
    previewRenderer.setPixelRatio(dpr);
    previewRenderer.setSize(size, size, false);

    const previewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    previewCamera.position.set(0, 0, 6);

    const previewScene = new THREE.Scene();
    const mesh = createIconMesh(idx, true); // pass highQuality=true
    mesh.rotation.z = Math.PI / 8;
    previewScene.add(mesh);
    previewRenderer.render(previewScene, previewCamera);

    previewCanvas.style.filter = CHALLENGES[idx].unlocked ? 'drop-shadow(0 0 8px #FFB400)' : 'grayscale(1) opacity(0.5)';
    previewCanvasCache[idx] = previewCanvas;
    return previewCanvas;
}

/**
 * Animate the glowing highlight frame.
 */
function animateHighlight() {
    const highlight = document.getElementById('carousel-highlight');
    highlight.classList.remove('pulse');
    void highlight.offsetWidth; // force reflow
    highlight.classList.add('pulse');
}

/**
 * Fade in the challenge label.
 * @param {string} text
 */
function showChallengeLabel(text) {
    labelSpan.textContent = text;
    labelSpan.classList.remove('visible');
    setTimeout(() => {
        labelSpan.classList.add('visible');
    }, 50);
}

/**
 * Show challenge description and unlock status.
 * @param {Challenge} challenge
 */
function showChallengeDesc(challenge) {
    descDiv.innerHTML = `
        <span class="desc-text">${challenge.description}</span>
        <span class="status ${challenge.unlocked ? 'unlocked' : 'locked'}">
            ${challenge.unlocked ? 'Unlocked' : 'Locked'}
        </span>
    `;
}

/**
 * Update carousel UI and Three.js icon.
 */
function updateCarousel() {
    // Animate carousel fade
    carouselItemsDiv.classList.remove('fade');
    void carouselItemsDiv.offsetWidth;
    carouselItemsDiv.classList.add('fade');

    // Update carousel items with cached icon previews
    carouselItemsDiv.innerHTML = '';
    CHALLENGES.forEach((challenge, idx) => {
        const div = document.createElement('div');
        div.className = 'carousel-item' + (idx === currentIndex ? ' selected' : '');
        div.tabIndex = 0;
        div.setAttribute('data-idx', idx);
        div.title = challenge.name;
        // Use cached icon preview
        const iconCanvas = renderIconPreview(idx);
        // Apply matching glow for selected item
        if (idx === currentIndex) {
            iconCanvas.style.filter = 'drop-shadow(0 0 16px #FFB400) drop-shadow(0 0 32px #FFB400)';
            div.classList.add('selected');
        } else {
            iconCanvas.style.filter = challenge.unlocked ? 'drop-shadow(0 0 8px #FFB400)' : 'grayscale(1) opacity(0.5)';
            div.classList.remove('selected');
        }
        div.appendChild(iconCanvas);
        carouselItemsDiv.appendChild(div);
    });

    // Remove highlight frame entirely for perfect overlap

    // Show label and description
    showChallengeLabel(CHALLENGES[currentIndex].name);
    showChallengeDesc(CHALLENGES[currentIndex]);
    // Update timeline scrubber max
    timelineScrubber.max = CHALLENGES[currentIndex].timelineMax;
    timelineScrubber.value = 0;
    timelineValueSpan.textContent = '0';
    // Render Three.js icon
    renderIcon();
}

/**
 * Handle carousel navigation.
 * @param {number} dir -1 for left, +1 for right
 */
function navigateCarousel(dir) {
    currentIndex = (currentIndex + dir + CHALLENGES.length) % CHALLENGES.length;
    updateCarousel();
    animateHighlight();
}

/**
 * Handle timeline scrubber change.
 */
function onScrubTimeline(e) {
    timelineValueSpan.textContent = e.target.value;
    // Optionally, animate something on the main icon based on timeline value
}

/**
 * Handle carousel item click.
 */
function onCarouselItemClick(e) {
    const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
    if (!isNaN(idx)) {
        currentIndex = idx;
        updateCarousel();
        animateHighlight();
    }
}

/**
 * Set up event listeners for navigation and scrubbing.
 */
function setupEventHandlers() {
    document.getElementById('carousel-left').addEventListener('click', () => navigateCarousel(-1));
    document.getElementById('carousel-right').addEventListener('click', () => navigateCarousel(1));
    carouselItemsDiv.addEventListener('click', function (e) {
        if (e.target.closest('.carousel-item')) {
            onCarouselItemClick({ currentTarget: e.target.closest('.carousel-item') });
        }
    });
    timelineScrubber.addEventListener('input', onScrubTimeline);

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') {
            navigateCarousel(-1);
        } else if (e.key === 'ArrowRight') {
            navigateCarousel(1);
        }
    });
}

/**
 * Initialize the Challenge Selector page.
 */
function initChallengeSelector() {
    // Get DOM elements
    carouselItemsDiv = document.getElementById('carousel-items');
    labelSpan = document.getElementById('challenge-label');
    descDiv = document.getElementById('challenge-desc');
    timelineScrubber = document.getElementById('timeline-scrubber');
    timelineValueSpan = document.getElementById('timeline-value');
    // Three.js setup
    initThree();
    // Initial render
    updateCarousel();
    // Event handlers
    setupEventHandlers();
    // Animate label on load
    showChallengeLabel(CHALLENGES[currentIndex].name);
    // Animation loop for Three.js icon
    function animate() {
        renderIcon();
        requestAnimationFrame(animate);
    }
    animate();
}

// ---- Initialize on DOMContentLoaded ----
document.addEventListener('DOMContentLoaded', initChallengeSelector);

/* --- Carousel fade and highlight animation CSS (injected for pulse/fade) --- */
(function injectCarouselCSS() {
    const style = document.createElement('style');
    style.textContent = `
    #carousel-items.fade { transition: opacity 0.3s; opacity: 0.5; }
    #carousel-items.fade.selected { opacity: 1; }
    #carousel-highlight.pulse { animation: highlight-glow 0.7s; }
    #challenge-desc { margin-top: 0.5em; font-size: 1.1rem; color: #FFB400; }
    #challenge-desc .status { margin-left: 1em; font-weight: bold; }
    #challenge-desc .locked { color: #a00; text-shadow: 0 0 8px #a00; }
    #challenge-desc .unlocked { color: #0fa; text-shadow: 0 0 8px #0fa; }
    `;
    document.head.appendChild(style);
})();