// js/terrain_control.js

/**
 * Terrain & Drone Control Page Script
 * - Initializes Three.js scene on #terrain-canvas
 * - Procedural 3D heightmap with wireframe overlay
 * - Heatmap mode toggle (Thermal/Spectral, stub)
 * - Drag-and-drop waypoint icons (△, □, ◯, stub)
 * - Displays mock scanned/positive counts and scan thumbnail
 * - Handles UI controls and events
 * 
 * @author Roo
 * @date 2025-05-03
 */

/** @typedef {import('three')} THREE */

let scene, camera, renderer, terrainMesh, wireframeMesh;
let cursorMesh = null;
let axesHelper = null;
let markers = [];
let currentMode = "thermal";
const TERRAIN_SIZE = 100;
const TERRAIN_SEGMENTS = 64;
let currentHeights = null;
let raycaster = null;
let mouse = null;
let canvasBounds = null;

/**
 * Generate a procedural heightmap using Perlin-like noise.
 * @returns {number[][]} 2D array of heights
 */
function generateHeightmap() {
    const heights = [];
    for (let x = 0; x <= TERRAIN_SEGMENTS; x++) {
        heights[x] = [];
        for (let y = 0; y <= TERRAIN_SEGMENTS; y++) {
            // Simple pseudo-random height (replace with noise for realism)
            const nx = x / TERRAIN_SEGMENTS - 0.5;
            const ny = y / TERRAIN_SEGMENTS - 0.5;
            const height = Math.sin(5 * nx) * Math.cos(5 * ny) * 8 + Math.random() * 2;
            heights[x][y] = height;
        }
    }
    return heights;
}

/**
 * Create a Three.js PlaneGeometry and displace vertices by heightmap.
 * @param {number[][]} heights 
 * @returns {THREE.Mesh}
 */
function createTerrainMesh(heights) {
    const geometry = new THREE.PlaneGeometry(
        TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS
    );
    // Displace vertices
    for (let i = 0; i < geometry.attributes.position.count; i++) {
        const ix = i % (TERRAIN_SEGMENTS + 1);
        const iy = Math.floor(i / (TERRAIN_SEGMENTS + 1));
        geometry.attributes.position.setZ(i, heights[ix][iy]);
    }
    geometry.computeVertexNormals();

    // Color by height (stub: thermal/spectral)
    const colors = [];
    for (let i = 0; i < geometry.attributes.position.count; i++) {
        const z = geometry.attributes.position.getZ(i);
        let color;
        if (currentMode === "thermal") {
            // Amber gradient
            color = new THREE.Color().setHSL(0.1, 1, 0.5 - z / 40);
        } else {
            // Spectral: blue to magenta
            color = new THREE.Color().setHSL(0.7 - z / 80, 1, 0.5);
        }
        colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.MeshLambertMaterial({
        vertexColors: true,
        flatShading: true,
        side: THREE.DoubleSide
    });

    return new THREE.Mesh(geometry, material);
}

/**
 * Create a wireframe overlay for the terrain mesh.
 * @param {THREE.Geometry|THREE.BufferGeometry} geometry 
 * @returns {THREE.LineSegments}
 */
function createWireframe(geometry) {
    const wireframe = new THREE.WireframeGeometry(geometry);
    const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({
        color: 0xFFB400,
        linewidth: 1,
        opacity: 0.5,
        transparent: true
    }));
    return line;
}

/**
 * Initialize Three.js scene, camera, renderer, and terrain.
 */
function initThree() {
    const canvas = document.getElementById('terrain-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setClearColor(0x050505);
    renderer.setSize(canvas.clientWidth || 800, canvas.clientHeight || 600, false);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, (canvas.clientWidth || 800) / (canvas.clientHeight || 600), 1, 500);
    camera.position.set(0, -80, 60);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffe080, 0.8);
    directional.position.set(40, -60, 80);
    scene.add(directional);

    // Terrain
    currentHeights = generateHeightmap();
    terrainMesh = createTerrainMesh(currentHeights);
    terrainMesh.rotation.x = -Math.PI / 2;
    scene.add(terrainMesh);

    // Wireframe overlay
    wireframeMesh = createWireframe(terrainMesh.geometry);
    wireframeMesh.rotation.x = -Math.PI / 2;
    scene.add(wireframeMesh);

    // Axes Helper (optional)
    axesHelper = new THREE.AxesHelper(20);
    axesHelper.position.set(0, 0, 2);
    scene.add(axesHelper);

    // 3D Cursor
    cursorMesh = createCursorMesh();
    scene.add(cursorMesh);

    // Raycaster for cursor and drop
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Markers array
    markers = [];

    animate();
}

/**
 * Animation loop for Three.js scene.
 */
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

/**
 * Handle mode toggle (Thermal/Spectral).
 */
function setupModeToggles() {
    const radios = document.querySelectorAll('input[name="mode"]');
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentMode = e.target.value;
            // Re-color terrain mesh
            scene.remove(terrainMesh);
            const heights = generateHeightmap();
            terrainMesh = createTerrainMesh(heights);
            terrainMesh.rotation.x = -Math.PI / 2;
            scene.add(terrainMesh);

            // Update wireframe
            scene.remove(wireframeMesh);
            wireframeMesh = createWireframe(terrainMesh.geometry);
            wireframeMesh.rotation.x = -Math.PI / 2;
            scene.add(wireframeMesh);
        });
    });
}

/**
 * Stub: Drag-and-drop waypoint icons.
 */
function setupWaypointDragDrop() {
    const icons = document.querySelectorAll('.waypoint-icon');
    icons.forEach(icon => {
        icon.addEventListener('dragstart', (e) => {
            icon.classList.add('dragging');
            e.dataTransfer.setData('text/plain', icon.dataset.type);
        });
        icon.addEventListener('dragend', () => {
            icon.classList.remove('dragging');
        });
        icon.addEventListener('mouseenter', () => {
            icon.classList.add('hover');
        });
        icon.addEventListener('mouseleave', () => {
            icon.classList.remove('hover');
        });
    });

    // Canvas drag/drop
    const canvas = document.getElementById('terrain-canvas');
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('text/plain');
        // Get mouse position relative to canvas
        canvasBounds = canvas.getBoundingClientRect();
        const x = ((e.clientX - canvasBounds.left) / canvas.width) * 2 - 1;
        const y = -((e.clientY - canvasBounds.top) / canvas.height) * 2 + 1;
        mouse.set(x, y);
        raycaster.setFromCamera(mouse, camera);

        // Intersect with terrain
        const intersects = raycaster.intersectObject(terrainMesh);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const marker = createWaypointMarker(type, point);
            scene.add(marker);
            markers.push(marker);
        }
    });
}

/**
 * Display mock scanned/positive counts and scan thumbnail.
 */
function setupMockInfo() {
    document.getElementById('scanned-count').textContent = '12';
    document.getElementById('positive-count').textContent = '3';
    // Thumbnail is static in HTML
}

/**
 * Create a 3D cursor mesh (amber ring).
 * @returns {THREE.Mesh}
 */
function createCursorMesh() {
    const geometry = new THREE.TorusGeometry(1.5, 0.15, 12, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0xFFB400,
        opacity: 0.85,
        transparent: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    return mesh;
}

/**
 * Create a marker mesh for a waypoint.
 * @param {string} type - triangle, square, circle
 * @param {THREE.Vector3} position
 * @returns {THREE.Mesh}
 */
function createWaypointMarker(type, position) {
    let geometry, material;
    material = new THREE.MeshBasicMaterial({
        color: 0xFFB400,
        transparent: false
    });
    switch (type) {
        case "triangle":
            geometry = new THREE.ConeGeometry(1.2, 2.5, 3);
            break;
        case "square":
            geometry = new THREE.BoxGeometry(2, 2, 2);
            break;
        case "circle":
        default:
            geometry = new THREE.SphereGeometry(1.2, 24, 16);
            break;
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.z += 1.2;
    return mesh;
}

/**
 * Update the 3D cursor position based on mouse movement.
 */
function setupCursorSupport() {
    const canvas = document.getElementById('terrain-canvas');
    canvas.addEventListener('mousemove', (e) => {
        canvasBounds = canvas.getBoundingClientRect();
        const x = ((e.clientX - canvasBounds.left) / canvas.width) * 2 - 1;
        const y = -((e.clientY - canvasBounds.top) / canvas.height) * 2 + 1;
        mouse.set(x, y);
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(terrainMesh);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            cursorMesh.position.copy(point);
            cursorMesh.position.z += 1.1;
            cursorMesh.visible = true;
        } else {
            cursorMesh.visible = false;
        }
    });
    canvas.addEventListener('mouseleave', () => {
        cursorMesh.visible = false;
    });
}

/**
 * Regenerate terrain and update all meshes.
 */
function setupRegenerateButton() {
    const btn = document.getElementById('regenerate-terrain');
    btn.addEventListener('click', () => {
        // Remove old terrain and wireframe
        scene.remove(terrainMesh);
        scene.remove(wireframeMesh);
        // Remove all markers
        markers.forEach(m => scene.remove(m));
        markers = [];
        // Generate new heightmap and meshes
        currentHeights = generateHeightmap();
        terrainMesh = createTerrainMesh(currentHeights);
        terrainMesh.rotation.x = -Math.PI / 2;
        scene.add(terrainMesh);

        wireframeMesh = createWireframe(terrainMesh.geometry);
        wireframeMesh.rotation.x = -Math.PI / 2;
        scene.add(wireframeMesh);
    });
}

/**
 * Initialize all UI controls and Three.js scene.
 */
function init() {
    initThree();
    setupModeToggles();
    setupWaypointDragDrop();
    setupCursorSupport();
    setupRegenerateButton();
    setupMockInfo();
}

// Wait for DOM
window.addEventListener('DOMContentLoaded', init);