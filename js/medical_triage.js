// /js/medical_triage.js

/**
 * Medical Triage Page Logic (Rewritten)
 * - Handles 3D visualization, HUD updates, injury list, and treatment actions.
 * - Initializes Three.js scene on the triage canvas.
 * - Simulates patient data and vitals updates for the HUD.
 * - Stubs for injury labels and treatment actions.
 * Author: Roo
 */

/// --- Mock Data ---

/**
 * Array of mock patients for triage simulation.
 * Using only the first patient for display in this version.
 */
const mockPatients = [
    {
        id: "P1",
        name: "Alex Mercer",
        status: "Critical",
        priority: "high",
        vitals: { hr: 132, spo2: 88, life: 42 },
        injuries: [ // Added injuries array
            { id: "A", description: "Head Trauma" },
            { id: "B", description: "Laceration - Left Arm" },
            { id: "C", description: "Internal Bleeding (Suspected)" }
        ],
        logs: ["Severe laceration (left arm)", "Low SpO₂", "Unresponsive to pain"],
    },
    // Add more patients here if needed for future selection logic
];

let selectedPatientIndex = 0; // Index of the patient currently displayed
let vitalsInterval = null;

/// --- DOM Elements ---
const dom = {
    triageCanvas: null,
    canvasContainer: null,
    hudHeartRate: null,
    hudSpo2: null,
    hudLifePercent: null,
    actionButtonsContainer: null,
    injuryList: null,
};

/// --- Three.js Variables ---
let scene, camera, renderer, mesh, pulseMaterial, animationId;

/// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    // Get DOM elements
    dom.triageCanvas = document.getElementById("triage-canvas");
    dom.canvasContainer = document.getElementById("canvas-container");
    dom.hudHeartRate = document.getElementById("hud-heart-rate");
    dom.hudSpo2 = document.getElementById("hud-spo2");
    dom.hudLifePercent = document.getElementById("hud-life-percent");
    dom.actionButtonsContainer = document.getElementById("action-buttons");
    dom.injuryList = document.getElementById("injury-list");

    // Initial UI update with the first patient's data
    if (mockPatients.length > 0) {
        updateUI(mockPatients[selectedPatientIndex]);
    }

    // Simulate vitals updates every 2 seconds
    vitalsInterval = setInterval(simulateVitals, 2000);

    // Initialize Three.js visualization
    initThreeScene();

    // Setup listeners for action buttons
    setupActionButtons();

    // Add resize listener for Three.js canvas
    window.addEventListener('resize', onWindowResize, false);
});

/**
 * Updates the HUD and Injury List based on patient data.
 * @param {object} patient - The patient data object.
 */
function updateUI(patient) {
    if (!patient) return;

    // Update Vitals HUD
    dom.hudHeartRate.textContent = `${patient.vitals.hr} bpm`;
    dom.hudSpo2.textContent = `${patient.vitals.spo2} %`;
    dom.hudLifePercent.textContent = `${patient.vitals.life} %`;

    // Update Injury List
    dom.injuryList.innerHTML = ""; // Clear previous list
    if (patient.injuries && patient.injuries.length > 0) {
        patient.injuries.forEach(injury => {
            const li = document.createElement("li");
            li.innerHTML = `<span class="injury-marker">${injury.id}</span> ${injury.description}`;
            dom.injuryList.appendChild(li);
        });
    } else {
        dom.injuryList.innerHTML = "<li>No injuries listed.</li>";
    }

    // Update 3D scene based on vitals
    updateSceneOnVitals(patient.vitals);
}

/**
 * Simulate vitals changes for demo purposes.
 */
function simulateVitals() {
    // Simulate changes for the selected patient
    const patient = mockPatients[selectedPatientIndex];
    if (!patient) return;

    // Random walk for vitals
    patient.vitals.hr = Math.max(50, Math.min(160, patient.vitals.hr + Math.round((Math.random() - 0.5) * 6)));
    patient.vitals.spo2 = Math.max(80, Math.min(100, patient.vitals.spo2 + Math.round((Math.random() - 0.5) * 2)));
    patient.vitals.life = Math.max(0, Math.min(100, patient.vitals.life + Math.round((Math.random() - 0.5) * 3)));

    // Refresh UI
    updateUI(patient);
}

/**
 * Sets up click listeners for the treatment action buttons.
 */
function setupActionButtons() {
    const buttons = dom.actionButtonsContainer.querySelectorAll(".action-btn");
    buttons.forEach(button => {
        button.addEventListener("click", (event) => {
            const action = event.target.dataset.action;
            console.log(`Treatment Action Clicked: ${action}`);
            // TODO: Implement actual treatment logic and update patient state/logs
            alert(`Action: ${action} (Stub)`); // Simple feedback for now
        });
    });
}


/// --- Three.js Visualization ---

/**
 * Initialize Three.js scene for vitals visualization.
 */
function initThreeScene() {
    // Ensure Three.js is available
    if (typeof THREE === "undefined") {
        console.error("Three.js library not loaded!");
        // Display error on canvas if possible
        const ctx = dom.triageCanvas.getContext("2d");
        if (ctx) {
            ctx.font = "16px monospace";
            ctx.fillStyle = "#FFB400";
            ctx.fillText("Error: Three.js not loaded", 10, 30);
        }
        return;
    }
    if (!dom.triageCanvas || !dom.canvasContainer) {
        console.error("Canvas or container element not found!");
        return;
    }

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: dom.triageCanvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0); // transparent background
    renderer.setSize(dom.canvasContainer.clientWidth, dom.canvasContainer.clientHeight);

    // Scene and Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, dom.canvasContainer.clientWidth / dom.canvasContainer.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 7); // Position camera further back

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight); // Attach light to camera
    scene.add(camera);

    // Geometry: Stub wireframe sphere
    const geometry = new THREE.SphereGeometry(2, 32, 24);
    pulseMaterial = new THREE.MeshPhongMaterial({ // Use Phong for lighting
        color: 0xFFB400,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
        shininess: 50
    });
    mesh = new THREE.Mesh(geometry, pulseMaterial);
    scene.add(mesh);

    // Particle effect: Stub random points
    const particles = new THREE.BufferGeometry();
    const particleCount = 500; // Increased count
    const positions = [];
    const sphereRadius = 2.5; // Slightly larger radius for particles
    for (let i = 0; i < particleCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = sphereRadius + (Math.random() - 0.5) * 0.5; // Add some depth variation
        positions.push(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    }
    particles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xFFB400, // Match accent
        size: 0.06,
        opacity: 0.6,
        transparent: true,
        sizeAttenuation: true // Points scale with distance
    });
    const pointCloud = new THREE.Points(particles, particleMaterial);
    scene.add(pointCloud);

    // Start animation loop
    animateScene();
}

/**
 * Animation loop for the Three.js scene.
 */
function animateScene() {
    animationId = requestAnimationFrame(animateScene); // Loop

    const patient = mockPatients[selectedPatientIndex];
    if (mesh && patient) {
        // Pulse scale with HR
        const pulseFrequency = (patient.vitals.hr / 60) * Math.PI * 2; // Hz to rad/s
        const pulse = 1 + 0.05 * Math.sin(performance.now() * 0.001 * pulseFrequency);
        mesh.scale.set(pulse, pulse, pulse);

        // Subtle rotation
        mesh.rotation.y += 0.002;
        mesh.rotation.x += 0.001;
    }

    renderer.render(scene, camera);
}

/**
 * Update the 3D visualization based on new vitals (e.g., color).
 * @param {object} vitals
 */
function updateSceneOnVitals(vitals) {
    if (!mesh || !pulseMaterial) return;

    // Change color based on SpO2 and Life %
    let targetColor;
    if (vitals.spo2 < 90 || vitals.life < 50) {
        targetColor = new THREE.Color(0xFF3B3B); // Red for critical
    } else if (vitals.spo2 < 95 || vitals.life < 80) {
        targetColor = new THREE.Color(0xFFB400); // Amber for warning
    } else {
        targetColor = new THREE.Color(0x00FFC6); // Cyan/Teal for stable
    }
    // Smoothly transition color (optional, requires tweening library or manual lerp)
    pulseMaterial.color.copy(targetColor);

    // Adjust opacity based on Life % (optional)
    pulseMaterial.opacity = 0.5 + (vitals.life / 100) * 0.4;
}

/**
 * Handle window resize events to adjust camera and renderer.
 */
function onWindowResize() {
    if (!camera || !renderer || !dom.canvasContainer) return;

    const width = dom.canvasContainer.clientWidth;
    const height = dom.canvasContainer.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// End of /js/medical_triage.js