/**
 * Apartment Valet: Car Parking Simulator 2D
 * Engine, Physics, Collision, Levels, Sound & UI Controller
 */

// Sound Engine using Web Audio API
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.engineOsc = null;
    this.engineGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupEngineLoop();
    } catch (e) {
      console.warn("AudioContext not supported or blocked");
    }
  }

  setupEngineLoop() {
    if (!this.ctx) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();

    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(40, this.ctx.currentTime);
    this.engineGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, this.ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();
  }

  updateEngine(speed, maxSpeed) {
    if (!this.ctx || !this.enabled || !this.engineOsc) return;
    const normSpeed = Math.abs(speed) / maxSpeed;
    const targetFreq = 40 + normSpeed * 110;
    const targetGain = 0.02 + normSpeed * 0.05;

    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
  }

  playCrash() {
    if (!this.ctx || !this.enabled) return;
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playWin() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.15, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.3);
    });
  }

  playBeep() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }
}

// Vehicle Class with 2D Bicycle Kinematic Model
class Car {
  constructor(x, y, angle = 0) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.length = 60;
    this.angle = angle; // Angle in radians

    this.speed = 0;
    this.maxSpeed = 3.5;
    this.maxReverseSpeed = -2.0;
    this.accel = 0.08;
    this.brakeForce = 0.15;
    this.friction = 0.03;
    this.steerAngle = 0;
    this.maxSteerAngle = 0.55;
    this.steerSpeed = 0.05;
    this.wheelBase = 42;

    this.gear = 'D';
    this.health = 100;
    this.isCrashed = false;
  }

  update(inputs) {
    if (this.isCrashed) return;

    let targetSteer = 0;
    if (inputs.left) targetSteer -= this.maxSteerAngle;
    if (inputs.right) targetSteer += this.maxSteerAngle;

    if (this.steerAngle < targetSteer) {
      this.steerAngle = Math.min(this.steerAngle + this.steerSpeed, targetSteer);
    } else if (this.steerAngle > targetSteer) {
      this.steerAngle = Math.max(this.steerAngle - this.steerSpeed, targetSteer);
    }

    let isBraking = inputs.brake;

    if (inputs.gas) {
      if (this.gear === 'D') {
        this.speed += this.accel;
      } else {
        this.speed -= this.accel;
      }
    } else if (!isBraking) {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.friction);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.friction);
      }
    }

    if (isBraking) {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.brakeForce);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.brakeForce);
      }
    }

    this.speed = Math.max(this.maxReverseSpeed, Math.min(this.maxSpeed, this.speed));

    if (Math.abs(this.speed) > 0.01) {
      const frontWheelX = this.x + (this.wheelBase / 2) * Math.cos(this.angle);
      const frontWheelY = this.y + (this.wheelBase / 2) * Math.sin(this.angle);
      const backWheelX = this.x - (this.wheelBase / 2) * Math.cos(this.angle);
      const backWheelY = this.y - (this.wheelBase / 2) * Math.sin(this.angle);

      const newBackX = backWheelX + this.speed * Math.cos(this.angle);
      const newBackY = backWheelY + this.speed * Math.sin(this.angle);
      const newFrontX = frontWheelX + this.speed * Math.cos(this.angle + this.steerAngle);
      const newFrontY = frontWheelY + this.speed * Math.sin(this.angle + this.steerAngle);

      this.x = (newFrontX + newBackX) / 2;
      this.y = (newFrontY + newBackY) / 2;
      this.angle = Math.atan2(newFrontY - newBackY, newFrontX - newBackX);
    } else {
      this.speed = 0;
    }
  }

  toggleGear() {
    if (Math.abs(this.speed) < 0.2) {
      this.gear = this.gear === 'D' ? 'R' : 'D';
      return true;
    }
    return false;
  }

  getOBB() {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    const hw = this.width / 2;
    const hl = this.length / 2;

    const corners = [
      { x: hl, y: -hw },
      { x: hl, y: hw },
      { x: -hl, y: hw },
      { x: -hl, y: -hw }
    ];

    return corners.map(pt => ({
      x: this.x + (pt.x * cos - pt.y * sin),
      y: this.y + (pt.x * sin + pt.y * cos)
    }));
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-this.length / 2 + 2, -this.width / 2 + 4, this.length, this.width);

    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.roundRect(-this.length / 2, -this.width / 2, this.length, this.width, 6);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-this.length / 6, -this.width / 2 + 4, this.length / 2.5, this.width - 8);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(this.length / 6, -this.width / 2 + 5);
    ctx.lineTo(this.length / 3, -this.width / 2 + 6);
    ctx.lineTo(this.length / 3, this.width / 2 - 6);
    ctx.lineTo(this.length / 6, this.width / 2 - 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(this.length / 2 - 3, -this.width / 2 + 3, 3, 6);
    ctx.fillRect(this.length / 2 - 3, this.width / 2 - 9, 3, 6);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-this.length / 2, -this.width / 2 + 3, 3, 6);
    ctx.fillRect(-this.length / 2, this.width / 2 - 9, 3, 6);

    ctx.fillStyle = '#0f172a';
    const wheelL = 12;
    const wheelW = 5;

    ctx.save();
    ctx.translate(this.wheelBase / 2, -this.width / 2 + 1);
    ctx.rotate(this.steerAngle);
    ctx.fillRect(-wheelL / 2, -wheelW / 2, wheelL, wheelW);
    ctx.restore();

    ctx.save();
    ctx.translate(this.wheelBase / 2, this.width / 2 - 1);
    ctx.rotate(this.steerAngle);
    ctx.fillRect(-wheelL / 2, -wheelW / 2, wheelL, wheelW);
    ctx.restore();

    ctx.fillRect(-this.wheelBase / 2 - wheelL / 2, -this.width / 2 - 1, wheelL, wheelW);
    ctx.fillRect(-this.wheelBase / 2 - wheelL / 2, this.width / 2 - 4, wheelL, wheelW);

    ctx.restore();
  }
}

// Collision Utilities: Separating Axis Theorem (SAT) for Convex Polygons
function satOverlap(polyA, polyB) {
  const polys = [polyA, polyB];

  for (let i = 0; i < polys.length; i++) {
    const poly = polys[i];
    for (let j = 0; j < poly.length; j++) {
      const p1 = poly[j];
      const p2 = poly[(j + 1) % poly.length];

      // Normal vector to the edge
      const axis = { x: -(p2.y - p1.y), y: p2.x - p1.x };

      // Project polyA onto axis
      let minA = Infinity, maxA = -Infinity;
      for (const p of polyA) {
        const proj = p.x * axis.x + p.y * axis.y;
        minA = Math.min(minA, proj);
        maxA = Math.max(maxA, proj);
      }

      // Project polyB onto axis
      let minB = Infinity, maxB = -Infinity;
      for (const p of polyB) {
        const proj = p.x * axis.x + p.y * axis.y;
        minB = Math.min(minB, proj);
        maxB = Math.max(maxB, proj);
      }

      if (maxA < minB || maxB < minA) {
        return false; // Separating axis found, no collision
      }
    }
  }
  return true;
}

function rectToPoly(rect) {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h }
  ];
}

function circleToPolyCollision(circle, poly) {
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];

    // Distance from point to line segment
    const l2 = (p2.x - p1.x)**2 + (p2.y - p1.y)**2;
    let t = ((circle.x - p1.x) * (p2.x - p1.x) + (circle.y - p1.y) * (p2.y - p1.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    const projX = p1.x + t * (p2.x - p1.x);
    const projY = p1.y + t * (p2.y - p1.y);

    const distSq = (circle.x - projX)**2 + (circle.y - projY)**2;
    if (distSq <= circle.radius**2) {
      return true;
    }
  }
  return false;
}

function getParkedCarOBB(car) {
  const cos = Math.cos(car.angle);
  const sin = Math.sin(car.angle);
  const hw = car.width / 2;
  const hl = car.length / 2;

  const corners = [
    { x: hl, y: -hw },
    { x: hl, y: hw },
    { x: -hl, y: hw },
    { x: -hl, y: -hw }
  ];

  return corners.map(pt => ({
    x: car.x + (pt.x * cos - pt.y * sin),
    y: car.y + (pt.x * sin + pt.y * cos)
  }));
}

// Level Configurations
const LEVELS = [
  {
    id: 1,
    title: "Basement Entrance",
    desc: "Drive past the security gate and park in Spot #B-01.",
    startPos: { x: 120, y: 450, angle: -Math.PI / 2 },
    targetSpot: { x: 750, y: 150, width: 48, length: 75, angle: Math.PI / 2, label: "B-01" },
    walls: [
      { x: 0, y: 0, w: 1000, h: 20 },
      { x: 0, y: 630, w: 1000, h: 20 },
      { x: 0, y: 0, w: 20, h: 650 },
      { x: 980, y: 0, w: 20, h: 650 },
      { x: 250, y: 200, w: 20, h: 430 },
      { x: 500, y: 20, w: 20, h: 300 }
    ],
    pillars: [
      { x: 600, y: 400, radius: 22 },
      { x: 800, y: 400, radius: 22 }
    ],
    parkedCars: [
      { x: 650, y: 150, width: 34, length: 64, angle: Math.PI / 2, color: '#3b82f6' },
      { x: 850, y: 150, width: 34, length: 64, angle: Math.PI / 2, color: '#10b981' }
    ],
    speedBumps: [],
    movingObstacles: []
  },
  {
    id: 2,
    title: "Pillar Labyrinth",
    desc: "Maneuver around structural support columns to reach Reserved Spot #P-04.",
    startPos: { x: 100, y: 100, angle: 0 },
    targetSpot: { x: 850, y: 520, width: 48, length: 75, angle: 0, label: "P-04" },
    walls: [
      { x: 0, y: 0, w: 1000, h: 20 },
      { x: 0, y: 630, w: 1000, h: 20 },
      { x: 0, y: 0, w: 20, h: 650 },
      { x: 980, y: 0, w: 20, h: 650 },
      { x: 400, y: 0, w: 20, h: 250 },
      { x: 650, y: 350, w: 20, h: 300 }
    ],
    pillars: [
      { x: 250, y: 200, radius: 26 },
      { x: 250, y: 450, radius: 26 },
      { x: 500, y: 350, radius: 26 },
      { x: 500, y: 550, radius: 26 },
      { x: 750, y: 200, radius: 26 }
    ],
    parkedCars: [
      { x: 850, y: 430, width: 34, length: 64, angle: 0, color: '#8b5cf6' },
      { x: 150, y: 300, width: 34, length: 64, angle: Math.PI / 2, color: '#f59e0b' }
    ],
    speedBumps: [],
    movingObstacles: []
  },
  {
    id: 3,
    title: "Courtyard Alley",
    desc: "Parallel park into narrow Bay #C-02 between luxury resident cars.",
    startPos: { x: 120, y: 320, angle: 0 },
    targetSpot: { x: 600, y: 130, width: 85, length: 48, angle: 0, label: "C-02" },
    walls: [
      { x: 0, y: 0, w: 1000, h: 20 },
      { x: 0, y: 630, w: 1000, h: 20 },
      { x: 0, y: 0, w: 20, h: 650 },
      { x: 980, y: 0, w: 20, h: 650 },
      { x: 200, y: 450, w: 600, h: 20 }
    ],
    pillars: [
      { x: 100, y: 130, radius: 20 },
      { x: 900, y: 130, radius: 20 }
    ],
    parkedCars: [
      { x: 430, y: 130, width: 34, length: 64, angle: 0, color: '#ec4899' },
      { x: 770, y: 130, width: 34, length: 64, angle: 0, color: '#06b6d4' },
      { x: 300, y: 550, width: 34, length: 64, angle: Math.PI / 2, color: '#64748b' },
      { x: 500, y: 550, width: 34, length: 64, angle: Math.PI / 2, color: '#84cc16' }
    ],
    speedBumps: [],
    movingObstacles: []
  },
  {
    id: 4,
    title: "Speed Bump Zone",
    desc: "Watch your speed over bumps and avoid the moving security patrol golf cart!",
    startPos: { x: 100, y: 100, angle: 0 },
    targetSpot: { x: 880, y: 530, width: 48, length: 75, angle: Math.PI / 2, label: "S-05" },
    walls: [
      { x: 0, y: 0, w: 1000, h: 20 },
      { x: 0, y: 630, w: 1000, h: 20 },
      { x: 0, y: 0, w: 20, h: 650 },
      { x: 980, y: 0, w: 20, h: 650 },
      { x: 300, y: 200, w: 400, h: 20 }
    ],
    pillars: [
      { x: 200, y: 400, radius: 22 },
      { x: 800, y: 200, radius: 22 }
    ],
    parkedCars: [
      { x: 780, y: 530, width: 34, length: 64, angle: Math.PI / 2, color: '#eab308' }
    ],
    speedBumps: [
      { x: 350, y: 80, w: 30, h: 100 },
      { x: 600, y: 80, w: 30, h: 100 },
      { x: 450, y: 320, w: 120, h: 30 }
    ],
    movingObstacles: [
      {
        x: 250, y: 280, width: 28, length: 45, color: '#e11d48',
        minX: 250, maxX: 750, speed: 2, currentX: 250, dir: 1, angle: 0
      }
    ]
  },
  {
    id: 5,
    title: "Tight VIP Reverse Bay",
    desc: "Reverse park into the narrow Penthouse Executive Bay #VIP-01.",
    startPos: { x: 150, y: 550, angle: -Math.PI / 2 },
    targetSpot: { x: 820, y: 120, width: 48, length: 75, angle: Math.PI / 2, label: "VIP-01" },
    walls: [
      { x: 0, y: 0, w: 1000, h: 20 },
      { x: 0, y: 630, w: 1000, h: 20 },
      { x: 0, y: 0, w: 20, h: 650 },
      { x: 980, y: 0, w: 20, h: 650 },
      { x: 350, y: 250, w: 300, h: 400 },
      { x: 700, y: 0, w: 20, h: 220 }
    ],
    pillars: [
      { x: 730, y: 220, radius: 18 },
      { x: 910, y: 220, radius: 18 }
    ],
    parkedCars: [
      { x: 730, y: 120, width: 34, length: 64, angle: Math.PI / 2, color: '#38bdf8' },
      { x: 910, y: 120, width: 34, length: 64, angle: Math.PI / 2, color: '#a855f7' }
    ],
    speedBumps: [
      { x: 180, y: 350, w: 120, h: 25 }
    ],
    movingObstacles: []
  }
];

// Main Game Controller
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.sound = new SoundEngine();
    this.car = null;
    this.currentLevelIndex = 0;
    this.levelData = null;

    this.timer = 0;
    this.timerInterval = null;
    this.parkingHoldTime = 0;
    this.requiredHoldTime = 1.5; // Must stop for 1.5s inside bay

    this.inputs = { gas: false, brake: false, left: false, right: false };
    this.gameRunning = false;

    this.setupEventListeners();
    this.loadLevel(0);
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  loadLevel(index) {
    this.currentLevelIndex = index;
    this.levelData = JSON.parse(JSON.stringify(LEVELS[index])); // Deep copy
    this.car = new Car(
      this.levelData.startPos.x,
      this.levelData.startPos.y,
      this.levelData.startPos.angle
    );

    this.timer = 0;
    this.parkingHoldTime = 0;
    this.gameRunning = true;

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.gameRunning && !this.car.isCrashed) {
        this.timer++;
        this.updateHUD();
      }
    }, 1000);

    this.updateHUD();
    this.hideModals();
  }

  setupEventListeners() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      this.sound.init();
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': this.inputs.gas = true; break;
        case 's': case 'arrowdown': this.inputs.brake = true; break;
        case 'a': case 'arrowleft': this.inputs.left = true; break;
        case 'd': case 'arrowright': this.inputs.right = true; break;
        case 'r':
          if (this.car && this.car.toggleGear()) {
            this.sound.playBeep();
            this.updateHUD();
          }
          break;
        case ' ':
          this.inputs.brake = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': this.inputs.gas = false; break;
        case 's': case 'arrowdown': this.inputs.brake = false; break;
        case 'a': case 'arrowleft': this.inputs.left = false; break;
        case 'd': case 'arrowright': this.inputs.right = false; break;
        case ' ': this.inputs.brake = false; break;
      }
    });

    // Touch / On-screen Buttons
    const bindBtn = (id, keyName) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const start = (e) => { e.preventDefault(); this.sound.init(); this.inputs[keyName] = true; btn.classList.add('active'); };
      const end = (e) => { e.preventDefault(); this.inputs[keyName] = false; btn.classList.remove('active'); };
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('touchstart', start);
      btn.addEventListener('touchend', end);
    };

    bindBtn('btn-gas', 'gas');
    bindBtn('btn-brake', 'brake');
    bindBtn('btn-left', 'left');
    bindBtn('btn-right', 'right');

    const gearBtn = document.getElementById('btn-gear-toggle');
    if (gearBtn) {
      gearBtn.addEventListener('click', () => {
        if (this.car && this.car.toggleGear()) {
          this.sound.playBeep();
          this.updateHUD();
        }
      });
    }

    // Header buttons
    document.getElementById('btn-menu').addEventListener('click', () => this.showMenu());
    document.getElementById('btn-restart-top').addEventListener('click', () => this.loadLevel(this.currentLevelIndex));
    document.getElementById('btn-sound').addEventListener('click', (e) => {
      this.sound.enabled = !this.sound.enabled;
      e.target.innerText = this.sound.enabled ? '🔊' : '🔇';
    });

    // Modal buttons
    document.getElementById('btn-start-game').addEventListener('click', () => this.loadLevel(0));
    document.getElementById('btn-replay').addEventListener('click', () => this.loadLevel(this.currentLevelIndex));
    document.getElementById('btn-next-level').addEventListener('click', () => {
      if (this.currentLevelIndex + 1 < LEVELS.length) {
        this.loadLevel(this.currentLevelIndex + 1);
      } else {
        this.showMenu();
      }
    });
    document.getElementById('btn-try-again').addEventListener('click', () => this.loadLevel(this.currentLevelIndex));
    document.getElementById('btn-fail-menu').addEventListener('click', () => this.showMenu());

    // Level card selection in menu
    document.querySelectorAll('.level-card').forEach(card => {
      card.addEventListener('click', () => {
        const lvl = parseInt(card.getAttribute('data-level')) - 1;
        this.loadLevel(lvl);
      });
    });
  }

  showMenu() {
    this.gameRunning = false;
    document.getElementById('modal-menu').classList.remove('hidden');
    document.getElementById('modal-victory').classList.add('hidden');
    document.getElementById('modal-gameover').classList.add('hidden');
  }

  hideModals() {
    document.getElementById('modal-menu').classList.add('hidden');
    document.getElementById('modal-victory').classList.add('hidden');
    document.getElementById('modal-gameover').classList.add('hidden');
  }

  updateHUD() {
    if (!this.car) return;

    // Time
    const mins = String(Math.floor(this.timer / 60)).padStart(2, '0');
    const secs = String(this.timer % 60).padStart(2, '0');
    document.getElementById('timer-display').innerText = `${mins}:${secs}`;

    // Health
    const hpBar = document.getElementById('health-bar');
    const hpText = document.getElementById('health-text');
    hpBar.style.width = `${this.car.health}%`;
    hpText.innerText = `${Math.round(this.car.health)}%`;

    if (this.car.health < 40) {
      hpBar.className = 'health-bar-fill danger';
    } else if (this.car.health < 75) {
      hpBar.className = 'health-bar-fill warning';
    } else {
      hpBar.className = 'health-bar-fill';
    }

    // Gear
    const gearDisp = document.getElementById('gear-display');
    const gearBtnText = document.getElementById('btn-gear-text');
    gearDisp.innerText = this.car.gear;
    gearDisp.className = `value gear-${this.car.gear.toLowerCase()}`;
    gearBtnText.innerText = this.car.gear === 'D' ? 'DRIVE (D)' : 'REVERSE (R)';

    // Level
    document.getElementById('level-display').innerText = `${this.currentLevelIndex + 1} / ${LEVELS.length}`;
  }

  checkCollisions() {
    if (!this.car || this.car.isCrashed) return;

    const carOBB = this.car.getOBB();

    // 1. Check Wall collisions
    for (const wall of this.levelData.walls) {
      const wallPoly = rectToPoly(wall);
      if (satOverlap(carOBB, wallPoly)) {
        this.handleCrash("Hit a perimeter / garage barrier wall!");
        return;
      }
    }

    // 2. Check Pillar collisions
    for (const pillar of this.levelData.pillars) {
      if (circleToPolyCollision(pillar, carOBB)) {
        this.handleCrash("Crashed into a structural support pillar!");
        return;
      }
    }

    // 3. Check Parked Cars collisions
    for (const parked of this.levelData.parkedCars) {
      const parkedOBB = getParkedCarOBB(parked);
      if (satOverlap(carOBB, parkedOBB)) {
        this.handleCrash("Crashed into a resident's parked vehicle!");
        return;
      }
    }

    // 4. Check Moving Obstacles collisions
    for (const mob of this.levelData.movingObstacles) {
      const mobOBB = getParkedCarOBB(mob);
      if (satOverlap(carOBB, mobOBB)) {
        this.handleCrash("Collided with security patrol vehicle!");
        return;
      }
    }

    // 5. Speed Bump friction / slowdown
    for (const bump of this.levelData.speedBumps) {
      const bumpPoly = rectToPoly(bump);
      if (satOverlap(carOBB, bumpPoly)) {
        if (Math.abs(this.car.speed) > 1.8) {
          this.car.health -= 0.3; // Damage for hitting bump too fast
          this.updateHUD();
        }
        this.car.speed *= 0.95; // Speed bump dampening
      }
    }
  }

  checkParking() {
    if (!this.car || this.car.isCrashed) return;

    const target = this.levelData.targetSpot;
    const guideEl = document.getElementById('parking-guide');

    // Distance between centers
    const dist = Math.hypot(this.car.x - target.x, this.car.y - target.y);

    // Angular difference (normalized)
    let angleDiff = Math.abs(this.car.angle - target.angle) % Math.PI;
    if (angleDiff > Math.PI / 2) angleDiff = Math.PI - angleDiff;

    const isPositionOk = dist < 22;
    const isAngleOk = angleDiff < 0.22; // ~12 degrees tolerance
    const isStopped = Math.abs(this.car.speed) < 0.05;

    if (isPositionOk && isAngleOk) {
      guideEl.classList.remove('hidden');

      if (isStopped) {
        this.parkingHoldTime += 1 / 60;
        const progress = Math.min(100, (this.parkingHoldTime / this.requiredHoldTime) * 100);
        document.getElementById('guide-text').innerText = `HOLDING... ${Math.round(progress)}%`;

        if (this.parkingHoldTime >= this.requiredHoldTime) {
          this.handleVictory();
        }
      } else {
        this.parkingHoldTime = 0;
        document.getElementById('guide-text').innerText = "STOP VEHICLE TO FINISH PARKING!";
      }
    } else {
      guideEl.classList.add('hidden');
      this.parkingHoldTime = 0;
    }
  }

  handleCrash(reason) {
    this.car.isCrashed = true;
    this.car.health = 0;
    this.gameRunning = false;
    this.sound.playCrash();
    this.updateHUD();

    document.getElementById('gameover-reason').innerText = reason;
    document.getElementById('modal-gameover').classList.remove('hidden');
    document.getElementById('parking-guide').classList.add('hidden');
  }

  handleVictory() {
    this.gameRunning = false;
    this.sound.playWin();

    // Score & Star calculation
    let stars = 3;
    if (this.car.health < 80 || this.timer > 45) stars = 2;
    if (this.car.health < 50 || this.timer > 80) stars = 1;

    const score = Math.max(500, Math.round(3000 - this.timer * 20 + this.car.health * 10));

    // Render stars HTML
    const starContainer = document.getElementById('victory-stars');
    starContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.className = `star ${i < stars ? 'lit' : ''}`;
      span.innerText = '★';
      starContainer.appendChild(span);
    }

    const mins = String(Math.floor(this.timer / 60)).padStart(2, '0');
    const secs = String(this.timer % 60).padStart(2, '0');
    document.getElementById('summary-time').innerText = `${mins}:${secs}`;
    document.getElementById('summary-health').innerText = `${Math.round(this.car.health)}%`;
    document.getElementById('summary-accuracy').innerText = '98%';
    document.getElementById('summary-score').innerText = `${score} pts`;

    document.getElementById('modal-victory').classList.remove('hidden');
    document.getElementById('parking-guide').classList.add('hidden');
  }

  update() {
    if (!this.gameRunning) return;

    // Update moving obstacles
    for (const mob of this.levelData.movingObstacles) {
      mob.x += mob.speed * mob.dir;
      if (mob.x > mob.maxX || mob.x < mob.minX) {
        mob.dir *= -1;
      }
    }

    this.car.update(this.inputs);
    this.sound.updateEngine(this.car.speed, this.car.maxSpeed);

    this.checkCollisions();
    this.checkParking();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw Parking Floor Tile Grid & Asphalt Texture
    this.ctx.fillStyle = '#222834';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = '#2b3342';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // 2. Draw Target Parking Spot
    const target = this.levelData.targetSpot;
    this.ctx.save();
    this.ctx.translate(target.x, target.y);
    this.ctx.rotate(target.angle);

    // Glowing Bay background
    this.ctx.fillStyle = 'rgba(255, 183, 3, 0.18)';
    this.ctx.fillRect(-target.length / 2, -target.width / 2, target.length, target.width);

    // Striped yellow border
    this.ctx.strokeStyle = '#ffb703';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([8, 6]);
    this.ctx.strokeRect(-target.length / 2, -target.width / 2, target.length, target.width);
    this.ctx.setLineDash([]);

    // Parking Spot Text Label
    this.ctx.fillStyle = '#ffb703';
    this.ctx.font = 'bold 16px Orbitron, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(target.label, 0, 0);

    this.ctx.restore();

    // 3. Draw Speed Bumps
    this.ctx.fillStyle = '#f59e0b';
    for (const bump of this.levelData.speedBumps) {
      this.ctx.fillRect(bump.x, bump.y, bump.w, bump.h);
      // Yellow/Black stripes on speed bumps
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(bump.x, bump.y, bump.w, bump.h);
    }

    // 4. Draw Walls
    this.ctx.fillStyle = '#334155';
    this.ctx.strokeStyle = '#475569';
    this.ctx.lineWidth = 2;
    for (const wall of this.levelData.walls) {
      this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    }

    // 5. Draw Pillars
    for (const pillar of this.levelData.pillars) {
      this.ctx.beginPath();
      this.ctx.arc(pillar.x, pillar.y, pillar.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#64748b';
      this.ctx.fill();
      this.ctx.strokeStyle = '#94a3b8';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Hazard stripes on pillar center
      this.ctx.beginPath();
      this.ctx.arc(pillar.x, pillar.y, pillar.radius * 0.5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffb703';
      this.ctx.fill();
    }

    // 6. Draw Parked Cars
    for (const car of this.levelData.parkedCars) {
      this.ctx.save();
      this.ctx.translate(car.x, car.y);
      this.ctx.rotate(car.angle);

      ctx.fillStyle = car.color;
      ctx.beginPath();
      ctx.roundRect(-car.length / 2, -car.width / 2, car.length, car.width, 5);
      ctx.fill();

      // Glass
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-car.length / 6, -car.width / 2 + 3, car.length / 2.5, car.width - 6);

      this.ctx.restore();
    }

    // 7. Draw Moving Obstacles (Patrol Carts)
    for (const mob of this.levelData.movingObstacles) {
      this.ctx.save();
      this.ctx.translate(mob.x, mob.y);
      this.ctx.rotate(mob.angle);

      this.ctx.fillStyle = mob.color;
      this.ctx.beginPath();
      this.ctx.roundRect(-mob.length / 2, -mob.width / 2, mob.length, mob.width, 4);
      this.ctx.fill();

      // Warning Beacon Light
      this.ctx.fillStyle = '#ef4444';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }

    // 8. Draw Player Car
    if (this.car) {
      this.car.draw(this.ctx);
    }
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new Game();
});
