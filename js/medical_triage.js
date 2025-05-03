// js/medical_triage.js

/**
 * Medical Triage Page Logic
 * - Handles patient queue, vitals visualization, and info panel updates.
 * - Initializes Three.js scene for abstract vitals display.
 * - Simulates patient data and vitals updates.
 * - Stubs for injury labels and treatment actions.
 * Author: Project Watch Dogs UI
 */

/// --- Mock Data ---

/**
 * Array of mock patients for triage simulation.
 * Each patient has id, name, status, priority, vitals, and logs.
 * Priority: high | medium | low
 */
const mockPatients = [
    {
        id: "P1",
        name: "Alex Mercer",
        status: "Critical",
        priority: "high",
        vitals: { hr: 132, spo2: 88, life: 42 },
        logs: ["Severe laceration (left arm)", "Low SpO₂", "Unresponsive to pain"],
    },
    {
        id: "P2",
        name: "Dana Walsh",
        status: "Stable",
        priority: "medium",
        vitals: { hr: 98, spo2: 97, life: 87 },
        logs: ["Minor burns (right hand)", "Responsive", "Vitals within normal range"],
    },
    {
        id: "P3",
        name: "James Heller",
        status: "Observation",
        priority: "low",
        vitals: { hr: 76, spo2: 99, life: 98 },
        logs: ["No visible injuries", "Vitals optimal", "Monitoring for shock"],
    }
];

let selectedPatientIndex = 0;
let vitalsInterval = null;

/// --- DOM Elements ---
const dom = {};

document.addEventListener("DOMContentLoaded", () => {
    dom.patientList = document.getElementById("patient-list");
    dom.infoPanel = document.getElementById("patient-info-panel");
    dom.vitalsText = document.getElementById("vitals-text");
    dom.logs = document.getElementById("logs");
    dom.patientIdDisplay = document.getElementById("patient-id-display");
    dom.vitalsCanvas = document.getElementById("vitals-canvas");

    renderPatientList();
    selectPatient(0);

    // Simulate vitals updates every 2 seconds
    vitalsInterval = setInterval(simulateVitals, 2000);

    // Initialize Three.js visualization
    initVitals3D();
});

/**
 * Render the patient queue list and attach click handlers.
 */
function renderPatientList() {
    dom.patientList.innerHTML = "";
    mockPatients.forEach((patient, idx) => {
        const li = document.createElement("li");
        li.className = `patient-item priority-${patient.priority}` + (idx === selectedPatientIndex ? " selected" : "");
        li.dataset.patientId = patient.id;
        li.textContent = `ID: ${patient.id} | Status: ${patient.status} | HR: ${patient.vitals.hr} | SpO₂: ${patient.vitals.spo2}% | Life: ${patient.vitals.life}%`;
        li.addEventListener("click", () => selectPatient(idx));
        dom.patientList.appendChild(li);
    });
}

/**
 * Select a patient by index, update info panel and 3D view.
 * @param {number} idx 
 */
function selectPatient(idx) {
    selectedPatientIndex = idx;
    renderPatientList();
    const patient = mockPatients[idx];
    dom.patientIdDisplay.textContent = patient.id;
    dom.vitalsText.innerHTML = `
        <strong>Name:</strong> ${patient.name}<br>
        <strong>Status:</strong> ${patient.status}<br>
        <strong>Heart Rate:</strong> ${patient.vitals.hr} bpm<br>
        <strong>SpO₂:</strong> ${patient.vitals.spo2}%<br>
        <strong>Life:</strong> ${patient.vitals.life}%
    `;
    dom.logs.innerHTML = patient.logs.map(log => `<div>&#8226; ${log}</div>`).join("");
    updateVitals3D(patient.vitals);
}

/**
 * Simulate vitals changes for demo purposes.
 * Randomly varies HR, SpO₂, and Life for each patient.
 */
function simulateVitals() {
    mockPatients.forEach((p, i) => {
        // Random walk for vitals
        p.vitals.hr = Math.max(50, Math.min(160, p.vitals.hr + Math.round((Math.random() - 0.5) * 6)));
        p.vitals.spo2 = Math.max(80, Math.min(100, p.vitals.spo2 + Math.round((Math.random() - 0.5) * 2)));
        p.vitals.life = Math.max(0, Math.min(100, p.vitals.life + Math.round((Math.random() - 0.5) * 3)));
    });
    // Refresh UI for selected patient
    selectPatient(selectedPatientIndex);
}

/// --- Three.js Visualization ---

let scene, camera, renderer, mesh, pulseMaterial, animationId;

/**
 * Initialize Three.js scene for vitals visualization.
 * Renders an abstract wireframe/point-cloud human mesh (stub: animated sphere).
 */
function initVitals3D() {
    // Ensure Three.js is available
    if (typeof THREE === "undefined") {
        dom.vitalsCanvas.getContext("2d").font = "20px monospace";
        dom.vitalsCanvas.getContext("2d").fillStyle = "#FFB400";
        dom.vitalsCanvas.getContext("2d").fillText("Three.js not loaded", 20, 60);
        return;
    }

    // Set up renderer
    renderer = new THREE.WebGLRenderer({ canvas: dom.vitalsCanvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0); // transparent background
    renderer.setSize(dom.vitalsCanvas.clientWidth || 400, dom.vitalsCanvas.clientHeight || 420);

    // Scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, (dom.vitalsCanvas.clientWidth || 400) / (dom.vitalsCanvas.clientHeight || 420), 0.1, 1000);
    camera.position.set(0, 0, 7);

    // Lighting (minimal for wireframe)
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    // Geometry: stub as a wireframe sphere (replace with human mesh for full implementation)
    const geometry = new THREE.SphereGeometry(2, 32, 24);
    pulseMaterial = new THREE.MeshBasicMaterial({ color: 0xFFB400, wireframe: true, transparent: true, opacity: 0.7 });
    mesh = new THREE.Mesh(geometry, pulseMaterial);
    scene.add(mesh);

    // Particle effect: stub as random points (replace with human point cloud)
    const particles = new THREE.BufferGeometry();
    const particleCount = 400;
    const positions = [];
    for (let i = 0; i < particleCount; i++) {
        const phi = Math.random() * Math.PI;
        const theta = Math.random() * 2 * Math.PI;
        const r = 2 + Math.random() * 0.2;
        positions.push(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    }
    particles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: 0xFFB400, size: 0.08, opacity: 0.8, transparent: true });
    const pointCloud = new THREE.Points(particles, particleMaterial);
    scene.add(pointCloud);

    // Stub: Injury labels and connector lines (not implemented)
    // TODO: Add injury label sprites and lines to mesh

    animateVitals();
}

/**
 * Animate the 3D mesh to pulse with heart rate.
 */
function animateVitals() {
    cancelAnimationFrame(animationId);
    let t0 = performance.now();
    function animate() {
        const patient = mockPatients[selectedPatientIndex];
        // Pulse scale with HR
        const pulse = 1 + 0.08 * Math.sin((performance.now() - t0) * 0.008 * (patient.vitals.hr / 60));
        mesh.scale.set(pulse, pulse, pulse);
        mesh.material.opacity = 0.5 + 0.3 * Math.abs(Math.sin((performance.now() - t0) * 0.008));
        mesh.rotation.y += 0.003;
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(animate);
    }
    animate();
}

/**
 * Update the 3D visualization based on new vitals.
 * @param {object} vitals 
 */
function updateVitals3D(vitals) {
    // Change color based on SpO2 and Life %
    if (!mesh) return;
    if (vitals.spo2 < 90 || vitals.life < 50) {
        mesh.material.color.set(0xFF3B3B); // red for critical
    } else if (vitals.spo2 < 95 || vitals.life < 80) {
        mesh.material.color.set(0xFFB400); // amber for warning
    } else {
        mesh.material.color.set(0x00FFC6); // cyan for stable
    }
    // Optionally update particle color similarly
}

/// --- Treatment Grid & UI Controls (Stub) ---

// TODO: Implement treatment grid with paginated action buttons (Irrigate, Debris Removal, Pain Medicine, etc.)
// TODO: Add event handling for treatment actions and update logs accordingly

// End of js/medical_triage.js