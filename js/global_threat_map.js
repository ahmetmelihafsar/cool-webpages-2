/**
 * /js/global_threat_map.js
 *
 * Mobile-responsive and touch-friendly Three.js globe for the Global Threat Map.
 * - Uses THREE.OrbitControls for full touch/pinch/drag support
 * - Responsive canvas sizing and orientation handling
 * - Mobile device detection and adaptation
 * - Docstrings and inline comments for clarity
 */

(function() {
  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById('globe-canvas');

  /**
   * Utility: Detect if running on a mobile device.
   * @returns {boolean}
   */
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Responsive canvas resizing for all devices and orientation changes.
   */
  function resizeCanvas() {
    // Use parent size for fluid scaling
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    } else {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
  }
  resizeCanvas();

  /** @type {THREE.WebGLRenderer} */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x050505, 1);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.width, canvas.height, false);

  /** @type {THREE.Scene} */
  const scene = new THREE.Scene();

  /** @type {THREE.PerspectiveCamera} */
  const camera = new THREE.PerspectiveCamera(
    45,
    canvas.width / canvas.height,
    0.1,
    1000
  );
  camera.position.set(0, 0, 180);

  /**
   * Use THREE.OrbitControls for full mouse/touch/pinch support.
   * On mobile, increase touch sensitivity and enable damping for smoother gestures.
   */
  let controls;
  if (typeof THREE.OrbitControls !== "undefined") {
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = isMobile();
    controls.dampingFactor = isMobile() ? 0.12 : 0.05;
    controls.enablePan = false;
    controls.minDistance = 80;
    controls.maxDistance = 400;
    controls.rotateSpeed = isMobile() ? 0.7 : 1.0;
    controls.zoomSpeed = isMobile() ? 0.7 : 1.0;
    controls.enableZoom = true;
    controls.screenSpacePanning = false;
    // Touch-action CSS for smoother gestures
    canvas.style.touchAction = "pan-x pan-y";
  } else {
    // Fallback: minimal controls (desktop only)
    let isDragging = false, lastX = 0, lastY = 0, phi = 0, theta = 0;
    let distance = camera.position.length();
    canvas.addEventListener('mousedown', (e) => {
      isDragging = true; lastX = e.clientX; lastY = e.clientY;
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      theta -= dx * 0.01;
      phi += dy * 0.01;
      phi = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, phi));
      update();
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('wheel', (e) => {
      distance *= (1 + e.deltaY * 0.001);
      distance = Math.max(80, Math.min(400, distance));
      update();
    });
    function update() {
      camera.position.x = distance * Math.cos(phi) * Math.sin(theta);
      camera.position.y = distance * Math.sin(phi);
      camera.position.z = distance * Math.cos(phi) * Math.cos(theta);
      camera.lookAt(0, 0, 0);
    }
    update();
  }

  // Overlay controls (add glow, trail, bold meridians)
  const overlayControls = document.getElementById('overlay-controls');
  function addOptionCheckbox(id, label, checked) {
    const lbl = document.createElement('label');
    lbl.style.marginLeft = "18px";
    lbl.style.color = "#FFB400";
    lbl.style.fontFamily = "var(--font-primary)";
    lbl.style.fontSize = "15px";
    lbl.style.cursor = "pointer";
    lbl.innerHTML = `<input type="checkbox" id="${id}" ${checked ? "checked" : ""} style="margin-right:6px;transform:scale(1.2);accent-color:#FFB400;">${label}`;
    overlayControls.appendChild(lbl);
  }
  addOptionCheckbox("toggle-glow", "Glow", false);
  addOptionCheckbox("toggle-trail", "Trail", false);
  addOptionCheckbox("toggle-bold-meridians", "Bold Meridians", true);

  // Neon grid overlay (latitude/longitude lines)
  function createGridLines(radius, segments, color, boldMeridians) {
    const group = new THREE.Group();
    // Latitude circles (parallels, always bold)
    for (let i = 1; i < segments; i++) {
      const lat = (i / segments) * Math.PI;
      const points = [];
      for (let j = 0; j <= 128; j++) {
        const theta = (j / 128) * 2 * Math.PI;
        points.push(
          new THREE.Vector3(
            radius * Math.sin(lat) * Math.cos(theta),
            radius * Math.cos(lat),
            radius * Math.sin(lat) * Math.sin(theta)
          )
        );
      }
      const latGeom = new THREE.BufferGeometry().setFromPoints(points);
      const latMat = new THREE.LineBasicMaterial({ color, linewidth: 3, opacity: 0.7, transparent: true });
      const latLine = new THREE.Line(latGeom, latMat);
      group.add(latLine);
    }
    // Longitude lines (meridians)
    for (let i = 0; i < segments; i++) {
      const lon = (i / segments) * 2 * Math.PI;
      const points = [];
      for (let j = 0; j <= 128; j++) {
        const phi = (j / 128) * Math.PI;
        points.push(
          new THREE.Vector3(
            radius * Math.sin(phi) * Math.cos(lon),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(lon)
          )
        );
      }
      const lonGeom = new THREE.BufferGeometry().setFromPoints(points);
      const isBold = boldMeridians && (i % (segments / 4) === 0);
      const lonMat = new THREE.LineBasicMaterial({
        color,
        linewidth: isBold ? 4 : 1,
        opacity: isBold ? 0.9 : 0.2,
        transparent: true
      });
      const lonLine = new THREE.Line(lonGeom, lonMat);
      group.add(lonLine);
    }
    return group;
  }
  let gridLines = createGridLines(50, 16, 0xFFB400, true);
  scene.add(gridLines);

  // Point cloud globe (BufferGeometry, random jitter for "cool" look)
  const particleCount = 2500;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    const r = 50 + Math.random() * 0.8; // slight jitter
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const globeGeo = new THREE.BufferGeometry();
  globeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Shading toggle: PointsMaterial (no shading) vs MeshPhongMaterial (shaded sphere)
  let shadingEnabled = true;
  let globePoints = null;
  let globeMesh = null;

  // Glow effect toggle
  let glowEnabled = false;
  let trailEnabled = false;
  let prevPositions = [];

  function addGlobePoints() {
    if (globeMesh) {
      scene.remove(globeMesh);
      globeMesh = null;
    }
    // Glow: use larger, more transparent points
    const globeMat = new THREE.PointsMaterial({
      color: 0xFFB400,
      size: glowEnabled ? 3.2 : 1.6,
      sizeAttenuation: true,
      transparent: true,
      opacity: glowEnabled ? 0.45 : 0.85
    });
    globePoints = new THREE.Points(globeGeo, globeMat);
    scene.add(globePoints);
  }

  function addGlobeMesh() {
    if (globePoints) {
      scene.remove(globePoints);
      globePoints = null;
    }
    const meshGeo = new THREE.SphereGeometry(50, 32, 32);
    const meshMat = new THREE.MeshPhongMaterial({
      color: 0xFFB400,
      shininess: 80,
      specular: 0xFFF8E1,
      emissive: 0x2a1a00,
      flatShading: false
    });
    globeMesh = new THREE.Mesh(meshGeo, meshMat);
    scene.add(globeMesh);
    // Add a subtle light for shading
    if (!scene.getObjectByName('globeLight')) {
      const light = new THREE.PointLight(0xffffff, 1.2, 600);
      light.position.set(120, 120, 180);
      light.name = 'globeLight';
      scene.add(light);
    }
  }

  function updateGlobe() {
    if (shadingEnabled) {
      addGlobeMesh();
    } else {
      addGlobePoints();
    }
  }
  updateGlobe();

  // Vignette effect (CSS fallback)
  canvas.style.boxShadow = "0 0 80px 20px #FFB40055, 0 0 0 1000px #050505 inset";

  // Axes helper
  let axesHelper = new THREE.AxesHelper(70);
  axesHelper.visible = true;
  scene.add(axesHelper);

  // Overlay controls logic
  const axesCheckbox = document.getElementById('toggle-axes');
  const shadingCheckbox = document.getElementById('toggle-shading');
  const glowCheckbox = document.getElementById('toggle-glow');
  const trailCheckbox = document.getElementById('toggle-trail');
  const boldMeridiansCheckbox = document.getElementById('toggle-bold-meridians');
  axesCheckbox.addEventListener('change', () => {
    axesHelper.visible = axesCheckbox.checked;
  });
  shadingCheckbox.addEventListener('change', () => {
    shadingEnabled = shadingCheckbox.checked;
    updateGlobe();
  });
  glowCheckbox.addEventListener('change', () => {
    glowEnabled = glowCheckbox.checked;
    if (!shadingEnabled) updateGlobe();
  });
  trailCheckbox.addEventListener('change', () => {
    trailEnabled = trailCheckbox.checked;
    if (!trailEnabled) prevPositions = [];
  });
  boldMeridiansCheckbox.addEventListener('change', () => {
    scene.remove(gridLines);
    gridLines = createGridLines(50, 16, 0xFFB400, boldMeridiansCheckbox.checked);
    scene.add(gridLines);
  });

  // Raycaster for interaction
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Sidebar elements
  const explosionXEl = document.getElementById('explosion-x');
  const explosionYEl = document.getElementById('explosion-y');
  const explosionZEl = document.getElementById('explosion-z');
  const currentXEl   = document.getElementById('current-x');
  const currentYEl   = document.getElementById('current-y');
  const currentZEl   = document.getElementById('current-z');

  // Input controls
  const inputX   = document.getElementById('input-x');
  const inputY   = document.getElementById('input-y');
  const inputZ   = document.getElementById('input-z');
  const solveBtn = document.getElementById('solve-button');

  // Handle mouse move to update current coordinates
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    let intersectObj = shadingEnabled ? globeMesh : globePoints;
    if (!intersectObj) return;
    const intersects = raycaster.intersectObject(intersectObj);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      currentXEl.textContent = point.x.toFixed(2);
      currentYEl.textContent = point.y.toFixed(2);
      currentZEl.textContent = point.z.toFixed(2);
      if (trailEnabled && !shadingEnabled) {
        prevPositions.push(point.clone());
        if (prevPositions.length > 40) prevPositions.shift();
      }
    }
  });

  // Handle Solve button click
  solveBtn.addEventListener('click', () => {
    const x = parseFloat(inputX.value);
    const y = parseFloat(inputY.value);
    const z = parseFloat(inputZ.value);
    explosionXEl.textContent = isNaN(x) ? '-' : x.toFixed(2);
    explosionYEl.textContent = isNaN(y) ? '-' : y.toFixed(2);
    explosionZEl.textContent = isNaN(z) ? '-' : z.toFixed(2);
    // Pulse effect stub: animate globePoints or globeMesh scale
    let target = shadingEnabled ? globeMesh : globePoints;
    if (!target) return;
    let pulse = 0;
    function pulseAnim() {
      pulse += 0.08;
      if (target.material && target.material.size !== undefined) {
        target.material.size = glowEnabled ? 3.2 + Math.sin(pulse) * 1.2 : 1.6 + Math.sin(pulse) * 0.7;
      } else {
        target.scale.setScalar(1 + Math.sin(pulse) * 0.07);
      }
      if (pulse < Math.PI * 2) {
        requestAnimationFrame(pulseAnim);
      } else {
        if (target.material && target.material.size !== undefined) {
          target.material.size = glowEnabled ? 3.2 : 1.6;
        } else {
          target.scale.setScalar(1);
        }
      }
    }
    pulseAnim();
    console.log(`Solve clicked with coordinates: X=${x}, Y=${y}, Z=${z}`);
  });

  // --- Secret Menu for Spin Speed ---
  let spinSpeed = 0.0015;
  let secretMenuVisible = false;
  let secretMenuDiv = null;
  let keyBuffer = [];
  const SECRET_COMBO = ['KeyS', 'KeyP', 'KeyI', 'KeyN']; // S P I N

  window.addEventListener('keydown', (e) => {
    keyBuffer.push(e.code);
    if (keyBuffer.length > 4) keyBuffer.shift();
    if (keyBuffer.join(',') === SECRET_COMBO.join(',')) {
      toggleSecretMenu();
      keyBuffer = [];
    }
  });

  function toggleSecretMenu() {
    if (secretMenuVisible) {
      secretMenuDiv.remove();
      secretMenuVisible = false;
      return;
    }
    secretMenuDiv = document.createElement('div');
    secretMenuDiv.style.position = 'fixed';
    secretMenuDiv.style.top = '30px';
    secretMenuDiv.style.right = '30px';
    secretMenuDiv.style.background = 'rgba(10,10,10,0.98)';
    secretMenuDiv.style.border = '2px solid #FFB400';
    secretMenuDiv.style.padding = '18px 24px';
    secretMenuDiv.style.zIndex = 9999;
    secretMenuDiv.style.fontFamily = 'monospace';
    secretMenuDiv.style.color = '#FFB400';
    secretMenuDiv.style.textTransform = 'uppercase';
    secretMenuDiv.innerHTML = `
      <label for="spin-speed" style="display:block;margin-bottom:8px;">Spin Speed</label>
      <input id="spin-speed" type="range" min="0" max="0.02" step="0.0001" value="${spinSpeed}" style="width:180px;">
      <span id="spin-speed-value">${spinSpeed.toFixed(4)}</span>
      <button id="close-secret-menu" style="margin-left:16px;background:none;border:1px solid #FFB400;color:#FFB400;cursor:pointer;">Close</button>
    `;
    document.body.appendChild(secretMenuDiv);
    document.getElementById('spin-speed').addEventListener('input', (e) => {
      spinSpeed = parseFloat(e.target.value);
      document.getElementById('spin-speed-value').textContent = spinSpeed.toFixed(4);
    });
    document.getElementById('close-secret-menu').addEventListener('click', () => {
      secretMenuDiv.remove();
      secretMenuVisible = false;
    });
    secretMenuVisible = true;
  }

  // Responsive resize
  window.addEventListener('resize', () => {
    resizeCanvas();
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    if (globePoints) globePoints.rotation.y += spinSpeed;
    if (globeMesh) globeMesh.rotation.y += spinSpeed;

    // Draw trail if enabled and context is 2d
    if (trailEnabled && prevPositions.length > 1 && !shadingEnabled) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = "#FFB400";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < prevPositions.length; i++) {
          const vector = prevPositions[i].clone().project(camera);
          const x = (vector.x * 0.5 + 0.5) * canvas.width;
          const y = (-vector.y * 0.5 + 0.5) * canvas.height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    renderer.render(scene, camera);
  }
  animate();
})();