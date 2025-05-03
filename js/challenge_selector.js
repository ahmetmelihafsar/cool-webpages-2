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
function createIconMesh(idx) {
    let geometry, material, mesh;
    switch (idx) {
        case 0: // Hexagon
            geometry = new THREE.CircleGeometry(1, 6);
            break;
        case 1: // Maze (square spiral)
            geometry = new THREE.BufferGeometry();
            const spiralPoints = [];
            for (let i = 0; i < 5; i++) {
                spiralPoints.push(new THREE.Vector3(i - 2, 2 - i, 0));
                spiralPoints.push(new THREE.Vector3(2 - i, 2 - i, 0));
            }
            geometry.setFromPoints(spiralPoints);
            break;
        case 2: // Prism (triangle)
            geometry = new THREE.CircleGeometry(1, 3);
            break;
        case 3: // Pulse Node (star)
            geometry = new THREE.BufferGeometry();
            const starPoints = [];
            for (let i = 0; i < 10; i++) {
                const r = i % 2 === 0 ? 1 : 0.5;
                const a = (i / 10) * Math.PI * 2;
                starPoints.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
            }
            starPoints.push(starPoints[0]);
            geometry.setFromPoints(starPoints);
            break;
        default:
            geometry = new THREE.CircleGeometry(1, 5);
    }
    material = new THREE.LineBasicMaterial({
        color: 0xFFB400,
        linewidth: 2,
        transparent: true,
        opacity: 0.85
    });
    mesh = new THREE.LineLoop(geometry, material);
    mesh.position.set(0, 0, 0);
    return mesh;
}

/**
 * Initialize Three.js scene and render geometric icons as glowing line-loops.
 */
function initThree() {
    canvas = document.getElementById('challenge-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);

    camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 100);
    camera.position.set(0, 0, 8);

    scene = new THREE.Scene();

    iconMeshes = CHALLENGES.map((_, idx) => createIconMesh(idx));
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
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = 64;
    previewCanvas.height = 64;
    // Use a single offscreen renderer for all previews
    if (!renderIconPreview._renderer) {
        renderIconPreview._renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
        renderIconPreview._renderer.setClearColor(0x000000, 0);
        renderIconPreview._renderer.setSize(64, 64, false);
    }
    const previewRenderer = renderIconPreview._renderer;
    const previewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    previewCamera.position.set(0, 0, 6);

    const previewScene = new THREE.Scene();
    const mesh = createIconMesh(idx);
    mesh.rotation.z = Math.PI / 8;
    previewScene.add(mesh);
    previewRenderer.render(previewScene, previewCamera);

    // Copy rendered pixels to the previewCanvas
    const pixels = new Uint8Array(4 * 64 * 64);
    previewRenderer.readRenderTargetPixels(
        previewRenderer.getRenderTarget() || previewRenderer.getRenderTarget(),
        0, 0, 64, 64, pixels
    );
    const ctx = previewCanvas.getContext('2d');
    const imageData = ctx.createImageData(64, 64);
    for (let i = 0; i < pixels.length; i++) {
        imageData.data[i] = pixels[i];
    }
    ctx.putImageData(imageData, 0, 0);

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
            div.style.boxShadow = '0 0 32px 8px #FFB400, 0 0 8px 2px #fff inset';
        } else {
            iconCanvas.style.filter = challenge.unlocked ? 'drop-shadow(0 0 8px #FFB400)' : 'grayscale(1) opacity(0.5)';
            div.style.boxShadow = '0 0 16px 2px #000';
        }
        div.appendChild(iconCanvas);
        carouselItemsDiv.appendChild(div);
    });

    // Move highlight frame to selected item
    const highlight = document.getElementById('carousel-highlight');
    const items = carouselItemsDiv.querySelectorAll('.carousel-item');
    if (items[currentIndex]) {
        const item = items[currentIndex];
        // Position highlight over selected item
        const left = item.offsetLeft + item.offsetWidth / 2 - 42; // 42 = highlight half width
        highlight.style.transition = 'transform 0.3s cubic-bezier(.4,2,.6,1)';
        highlight.style.transform = `translateX(${left}px)`;
        highlight.style.opacity = '1';
    } else {
        highlight.style.opacity = '0';
    }

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