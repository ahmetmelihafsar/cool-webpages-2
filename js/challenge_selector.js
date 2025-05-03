// js/challenge_selector.js

/**
 * Challenge Selector Page Logic
 * - Initializes Three.js scene for geometric icons.
 * - Handles carousel navigation, highlight animation (stub).
 * - Manages challenge label fade-in and timeline scrubber (stub).
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
let canvas, carouselItemsDiv, labelSpan, timelineScrubber;

// ---- Three.js Scene ----
let renderer, scene, camera, iconMeshes = [];

/**
 * Initialize Three.js scene and render geometric icons as glowing line-loops.
 */
function initThree() {
    canvas = document.getElementById('challenge-canvas');
    // Set up renderer
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0); // transparent background
    renderer.setSize(canvas.width, canvas.height, false);

    // Set up camera
    camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 100);
    camera.position.set(0, 0, 8);

    // Set up scene
    scene = new THREE.Scene();

    // Create geometric icons (glowing line-loops)
    iconMeshes = CHALLENGES.map((challenge, idx) => {
        let geometry, material, mesh;
        // Different geometry per challenge for visual variety
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
        mesh.position.x = 0;
        mesh.position.y = 0;
        mesh.position.z = 0;
        // Add glow effect via custom material or postprocessing (stub)
        return mesh;
    });
}

/**
 * Render the currently selected icon in the center of the canvas.
 */
function renderIcon() {
    // Remove previous mesh
    scene.clear();
    // Add current mesh
    const mesh = iconMeshes[currentIndex];
    scene.add(mesh);
    // Animate rotation for effect
    mesh.rotation.z += 0.01;
    renderer.render(scene, camera);
}

/**
 * Animate the glowing highlight frame (stub).
 */
function animateHighlight() {
    // Could animate #carousel-highlight border or box-shadow here
    // (Stub for future animation)
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
 * Update carousel UI and Three.js icon.
 */
function updateCarousel() {
    // Update carousel items
    carouselItemsDiv.innerHTML = '';
    CHALLENGES.forEach((challenge, idx) => {
        const div = document.createElement('div');
        div.className = 'carousel-item' + (idx === currentIndex ? ' selected' : '');
        div.tabIndex = 0;
        div.setAttribute('data-idx', idx);
        div.title = challenge.name;
        // Icon placeholder (could be replaced with SVG or canvas preview)
        div.innerHTML = `<span style="color:${challenge.unlocked ? '#FFB400' : '#555'};font-size:2rem;">&#9679;</span>`;
        carouselItemsDiv.appendChild(div);
    });
    // Show label
    showChallengeLabel(CHALLENGES[currentIndex].name);
    // Update timeline scrubber max
    timelineScrubber.max = CHALLENGES[currentIndex].timelineMax;
    timelineScrubber.value = 0;
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
 * Handle timeline scrubber change (stub).
 */
function onScrubTimeline(e) {
    // Stub: Implement timeline logic here
    // e.target.value gives the current scrubber value
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
}

/**
 * Initialize the Challenge Selector page.
 */
function initChallengeSelector() {
    // Get DOM elements
    carouselItemsDiv = document.getElementById('carousel-items');
    labelSpan = document.getElementById('challenge-label');
    timelineScrubber = document.getElementById('timeline-scrubber');
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