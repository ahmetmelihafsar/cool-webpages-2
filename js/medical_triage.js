// /js/medical_triage.js

/**
 * Medical Triage Page Logic (Rewritten)
 * - Handles 3D visualization, HUD updates, injury list, and treatment actions.
 * - Initializes Three.js scene on the triage canvas.
 * - Simulates patient data and vitals updates for the HUD.
 * - Implements interactive log updates for treatment actions.
 * Author: Roo
 */

/// --- Mock Data ---

const mockPatients = [
    {
        id: "P1",
        name: "Alex Mercer // Designation: ZEUS", // Added lore
        status: "Critical - Biohazard Containment", // Added lore
        priority: "high",
        vitals: { hr: 132, spo2: 88, life: 42 },
        injuries: [
            { id: "A", description: "Compound Fracture - Tibia (L)" }, // More specific
            { id: "B", description: "Severe Laceration - Deltoid (R)" },
            { id: "C", description: "Suspected Viral Hemorrhage" } // Lore-based
        ],
        logs: [ // Initial logs with timestamps
            "11:35:02 - Patient admitted. Unresponsive.",
            "11:35:45 - Initial vitals unstable. HR elevated.",
            "11:36:10 - Biohazard protocol initiated.",
        ],
    },
];

let selectedPatientIndex = 0;
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
    logEntries: null, // Added log container
};

/// --- Three.js Variables ---
let scene, camera, renderer, mesh, pulseMaterial, animationId;
let controls, axesHelper;
let showAxes = false;

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
    dom.logEntries = document.getElementById("log-entries"); // Get log container
    
    // Setup axes toggle
    document.getElementById('toggle-axes').addEventListener('click', toggleAxes);

    // Initial UI update
    if (mockPatients.length > 0) {
        updateUI(mockPatients[selectedPatientIndex]);
    } else {
        // Handle case with no patients (optional)
        if(dom.logEntries) dom.logEntries.innerHTML = "<p>No patient data loaded.</p>";
    }

    // Simulate vitals updates
    vitalsInterval = setInterval(simulateVitals, 2000);

    // Initialize Three.js
    initThreeScene();

    // Setup action buttons
    setupActionButtons();

    // Add resize listener
    window.addEventListener('resize', onWindowResize, false);
});

/**
 * Updates the HUD, Injury List, and Log Display based on patient data.
 * @param {object} patient - The patient data object.
 */
function updateUI(patient) {
    if (!patient) return;

    // Update Vitals HUD
    dom.hudHeartRate.textContent = `${patient.vitals.hr} bpm`;
    dom.hudSpo2.textContent = `${patient.vitals.spo2} %`;
    dom.hudLifePercent.textContent = `${patient.vitals.life} %`;

    // Update Injury List
    dom.injuryList.innerHTML = "";
    if (patient.injuries && patient.injuries.length > 0) {
        patient.injuries.forEach(injury => {
            const li = document.createElement("li");
            // Added patient ID context to injury description for lore
            li.innerHTML = `<span class="injury-marker">${injury.id}</span> ${injury.description} (Patient ${patient.id})`;
            dom.injuryList.appendChild(li);
        });
    } else {
        dom.injuryList.innerHTML = "<li>Scan complete: No significant trauma detected.</li>"; // Lore update
    }

    // Update Log Display
    updateLogDisplay(patient);

    // Update 3D scene based on vitals
    updateSceneOnVitals(patient.vitals);
}

/**
 * Updates the log display area with patient logs.
 * @param {object} patient - The patient data object.
 */
function updateLogDisplay(patient) {
    if (!dom.logEntries || !patient || !patient.logs) return;

    dom.logEntries.innerHTML = ""; // Clear previous logs

    if (patient.logs.length === 0) {
        dom.logEntries.innerHTML = "<p>Log empty. Awaiting events...</p>"; // Placeholder
        return;
    }

    // Add logs, newest first
    patient.logs.forEach(logMsg => {
        const p = document.createElement("p");
        p.textContent = logMsg;
        dom.logEntries.prepend(p); // Prepend to show newest first
    });

     // Auto-scroll to the top (most recent entry)
    dom.logEntries.scrollTop = 0;
}


/**
 * Simulate vitals changes for demo purposes.
 */
function simulateVitals() {
    const patient = mockPatients[selectedPatientIndex];
    if (!patient) return;

    // Random walk for vitals
    patient.vitals.hr = Math.max(50, Math.min(160, patient.vitals.hr + Math.round((Math.random() - 0.5) * 6)));
    patient.vitals.spo2 = Math.max(80, Math.min(100, patient.vitals.spo2 + Math.round((Math.random() - 0.5) * 2)));
    patient.vitals.life = Math.max(0, Math.min(100, patient.vitals.life + Math.round((Math.random() - 0.5) * 3)));

    // Add occasional log entry for vitals change
    if (Math.random() < 0.1) { // 10% chance each interval
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        let logMessage = `${timestamp} - Vitals fluctuation detected.`;
        if (patient.vitals.hr > 140) logMessage += " Tachycardia noted.";
        if (patient.vitals.spo2 < 90) logMessage += " Hypoxia worsening.";
        patient.logs.unshift(logMessage); // Add to beginning
        // Limit log length (optional)
        if (patient.logs.length > 50) patient.logs.pop();
    }


    // Refresh UI
    updateUI(patient);
}

/**
 * Formats the action name for display in logs.
 * @param {string} actionKey - The data-action value (e.g., "pain_med").
 * @returns {string} - Formatted action name (e.g., "Pain Medicine Administered").
 */
function formatActionForLog(actionKey) {
    switch (actionKey) {
        case 'irrigate':
            applyTreatmentEffect('irrigation');
            return 'Irrigation Applied';
        case 'debris':
            applyTreatmentEffect('debris');
            return 'Debris Removal Complete';
        case 'pain_med':
            applyTreatmentEffect('pain');
            return 'Pain Medication Administered';
        case 'suture':
            applyTreatmentEffect('suture');
            return 'Suture Applied';
        case 'bandage':
            applyTreatmentEffect('bandage');
            return 'Bandage Applied';
        default:
            return `Action [${actionKey}] performed`;
    }
}

/**
 * Applies visual effects for different treatments
 * @param {string} type - The type of treatment
 */
function applyTreatmentEffect(type) {
    const patient = mockPatients[selectedPatientIndex];
    if (!mesh || !patient) return;

    switch (type) {
        case 'irrigation':
            // Temporary blue glow effect
            const originalColor = pulseMaterial.color.clone();
            pulseMaterial.color.setHex(0x00ffff);
            setTimeout(() => pulseMaterial.color.copy(originalColor), 1000);
            // Small vitals improvement
            patient.vitals.life = Math.min(100, patient.vitals.life + 5);
            break;
            
        case 'debris':
            // Particle burst effect
            createParticleBurst();
            patient.vitals.life = Math.min(100, patient.vitals.life + 3);
            break;
            
        case 'pain':
            // Green healing pulse
            pulseMaterial.opacity = 0.9;
            setTimeout(() => pulseMaterial.opacity = 0.7, 1000);
            patient.vitals.hr = Math.max(50, patient.vitals.hr - 10);
            break;
            
        case 'suture':
            // Red healing flash
            mesh.scale.set(1.2, 1.2, 1.2);
            setTimeout(() => mesh.scale.set(1, 1, 1), 200);
            patient.vitals.life = Math.min(100, patient.vitals.life + 10);
            break;
            
        case 'bandage':
            // White pulse wave
            const origOpacity = pulseMaterial.opacity;
            pulseMaterial.opacity = 1;
            setTimeout(() => pulseMaterial.opacity = origOpacity, 500);
            patient.vitals.life = Math.min(100, patient.vitals.life + 7);
            break;
    }

    // Update UI after treatment
    updateUI(patient);
}

/**
 * Creates a burst of particles from the mesh center
 */
function createParticleBurst() {
    const burstCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < burstCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        positions.push(
            2 * Math.sin(phi) * Math.cos(theta),
            2 * Math.sin(phi) * Math.sin(theta),
            2 * Math.cos(phi)
        );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xFF3B3B,
        size: 0.1,
        opacity: 1,
        transparent: true
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Animate particles outward and fade
    const startTime = performance.now();
    function animateParticles() {
        const elapsed = performance.now() - startTime;
        if (elapsed > 1000) {
            scene.remove(particles);
            return;
        }
        
        const scale = 1 + elapsed / 200;
        particles.scale.set(scale, scale, scale);
        material.opacity = 1 - (elapsed / 1000);
        
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}

/**
 * Sets up click listeners for the treatment action buttons.
 */
function setupActionButtons() {
    const buttons = dom.actionButtonsContainer.querySelectorAll(".action-btn");
    buttons.forEach(button => {
        button.addEventListener("click", (event) => {
            const action = event.target.dataset.action;
            const patient = mockPatients[selectedPatientIndex];
            if (!patient) return;

            // Create timestamp
            const now = new Date();
            const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            // Create log message
            const formattedAction = formatActionForLog(action);
            const logMessage = `${timestamp} - ${formattedAction}. Operator: [USER]`; // Added operator context

            // Add log entry to the beginning of the array
            patient.logs.unshift(logMessage);

             // Limit log length (optional)
            if (patient.logs.length > 50) patient.logs.pop(); // Remove oldest log if > 50 entries

            console.log(`Log Entry Added: ${logMessage}`);

            // Update the log display immediately
            updateLogDisplay(patient);

            // Optional: Add visual feedback to button (e.g., temporary class)
            button.classList.add('action-btn--activated');
            setTimeout(() => button.classList.remove('action-btn--activated'), 300);
        });
    });
}


/// --- Three.js Visualization ---

function initThreeScene() {
    if (typeof THREE === "undefined") {
        console.error("Three.js library not loaded!");
        const ctx = dom.triageCanvas?.getContext("2d");
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

    renderer = new THREE.WebGLRenderer({ canvas: dom.triageCanvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(dom.canvasContainer.clientWidth, dom.canvasContainer.clientHeight);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, dom.canvasContainer.clientWidth / dom.canvasContainer.clientHeight, 0.1, 1000);
    camera.position.set(0, 1, 7); // Slightly adjusted camera position
    camera.lookAt(0, 0, 0); // Ensure camera looks at the center

    // Initialize OrbitControls
    controls = new THREE.OrbitControls(camera, dom.triageCanvas);
    controls.enableDamping = true; // Add smooth damping
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.enablePan = false; // Disable panning for medical view
    controls.minDistance = 5; // Set minimum zoom
    controls.maxDistance = 15; // Set maximum zoom

    // Initialize AxesHelper
    axesHelper = new THREE.AxesHelper(3);
    axesHelper.visible = showAxes;
    scene.add(axesHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);
    scene.add(camera);

    // Use high-resolution Icosahedron for a more detailed "tech" look
    const geometry = new THREE.IcosahedronGeometry(2, 3); // Increased detail level from 1 to 3
    pulseMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFB400,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
        shininess: 60 // Increased shininess
    });
    mesh = new THREE.Mesh(geometry, pulseMaterial);
    scene.add(mesh);

    // Particle effect
    const particles = new THREE.BufferGeometry();
    const particleCount = 600; // More particles
    const positions = [];
    const sphereRadius = 2.8; // Wider particle cloud
    for (let i = 0; i < particleCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = sphereRadius + (Math.random() - 0.5) * 0.8; // More depth
        positions.push(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    }
    particles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xFFB400,
        size: 0.05, // Slightly smaller points
        opacity: 0.5, // More subtle
        transparent: true,
        sizeAttenuation: true
    });
    const pointCloud = new THREE.Points(particles, particleMaterial);
    scene.add(pointCloud);

    animateScene();
}

function animateScene() {
    animationId = requestAnimationFrame(animateScene);

    const patient = mockPatients[selectedPatientIndex];
    if (mesh && patient) {
        mesh.scale.set(1, 1, 1); // Keep static scale
    }

    // Update controls for smooth damping
    controls.update();

    renderer.render(scene, camera);
}

function updateSceneOnVitals(vitals) {
    if (!mesh || !pulseMaterial) return;

    let targetColor;
    if (vitals.spo2 < 90 || vitals.life < 50) {
        targetColor = new THREE.Color(0xFF3B3B); // Red
    } else if (vitals.spo2 < 95 || vitals.life < 80) {
        targetColor = new THREE.Color(0xFFB400); // Amber
    } else {
        targetColor = new THREE.Color(0x00FFC6); // Cyan/Teal
    }
    pulseMaterial.color.lerp(targetColor, 0.1); // Smooth color transition

    pulseMaterial.opacity = 0.4 + (vitals.life / 100) * 0.5; // Adjusted opacity range
}

function onWindowResize() {
    if (!camera || !renderer || !dom.canvasContainer) return;
    const width = dom.canvasContainer.clientWidth;
    const height = dom.canvasContainer.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

/**
 * Toggles the visibility of the axes helper
 */
function toggleAxes() {
    showAxes = !showAxes;
    axesHelper.visible = showAxes;
    
    // Toggle active class on button
    const button = document.getElementById('toggle-axes');
    button.classList.toggle('control-btn--active');
}

// End of /js/medical_triage.js