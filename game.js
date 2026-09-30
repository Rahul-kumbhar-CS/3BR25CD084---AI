// Main Game Engine & Controller for Grand Heights Apartment Parking Simulator

class GameApp {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.previewCanvas = document.getElementById('garage-preview-canvas');
        this.previewCtx = this.previewCanvas ? this.previewCanvas.getContext('2d') : null;

        this.currentLevelIndex = 0;
        this.selectedCarIndex = 0;
        this.car = new Car(CAR_PRESETS[this.selectedCarIndex]);

        this.gameTimeLeft = 60;
        this.timerInterval = null;
        this.isGameOver = false;
        this.isLevelWon = false;
        this.score = 0;

        this.initUI();
        this.initControls();
        this.loadLevel(0);
        this.startGameLoop();
    }

    initUI() {
        // Modal toggles & triggers
        document.getElementById('btn-garage').addEventListener('click', () => this.openGarageModal());
        document.getElementById('btn-levels').addEventListener('click', () => this.openLevelsModal());
        document.getElementById('btn-audio').addEventListener('click', () => {
            const muted = soundManager.toggleMute();
            document.getElementById('audio-icon').textContent = muted ? '🔇' : '🔊';
        });
        document.getElementById('btn-restart').addEventListener('click', () => this.restartCurrentLevel());

        // Modal Close Buttons
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.getAttribute('data-close');
                document.getElementById(targetId).classList.add('hidden');
            });
        });

        // Gear toggle UI
        const btnDrive = document.getElementById('gear-drive');
        const btnReverse = document.getElementById('gear-reverse');

        btnDrive.addEventListener('click', () => {
            this.car.reverseGear = false;
            btnDrive.classList.add('active');
            btnReverse.classList.remove('active');
        });

        btnReverse.addEventListener('click', () => {
            this.car.reverseGear = true;
            btnReverse.classList.add('active');
            btnDrive.classList.remove('active');
        });

        // Result Modal Buttons
        document.getElementById('btn-result-retry').addEventListener('click', () => {
            document.getElementById('modal-result').classList.add('hidden');
            this.restartCurrentLevel();
        });

        document.getElementById('btn-result-next').addEventListener('click', () => {
            document.getElementById('modal-result').classList.add('hidden');
            if (this.currentLevelIndex < GAME_LEVELS.length - 1) {
                this.loadLevel(this.currentLevelIndex + 1);
            } else {
                this.loadLevel(0);
            }
        });

        // Garage Modal Interactions
        document.getElementById('btn-select-car').addEventListener('click', () => {
            this.car.updatePreset(CAR_PRESETS[this.selectedCarIndex]);
            document.getElementById('modal-garage').classList.add('hidden');
            this.restartCurrentLevel();
        });

        // Color Dots
        document.querySelectorAll('.color-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                const color = dot.getAttribute('data-color');
                CAR_PRESETS[this.selectedCarIndex].color = color;
                this.renderGaragePreview();
            });
        });

        this.renderLevelsList();
        this.renderCarList();
    }

    initControls() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            soundManager.init(); // Activate WebAudio context on user key
            switch (e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.car.inputs.up = true;
                    break;
                case 's':
                case 'arrowdown':
                    this.car.inputs.down = true;
                    break;
                case 'a':
                case 'arrowleft':
                    this.car.inputs.left = true;
                    break;
                case 'd':
                case 'arrowright':
                    this.car.inputs.right = true;
                    break;
                case ' ':
                    this.car.inputs.brake = true;
                    break;
                case 'r':
                    this.car.reverseGear = !this.car.reverseGear;
                    document.getElementById('gear-drive').classList.toggle('active', !this.car.reverseGear);
                    document.getElementById('gear-reverse').classList.toggle('active', this.car.reverseGear);
                    break;
                case 'h':
                    soundManager.playHorn();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.car.inputs.up = false;
                    break;
                case 's':
                case 'arrowdown':
                    this.car.inputs.down = false;
                    break;
                case 'a':
                case 'arrowleft':
                    this.car.inputs.left = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.car.inputs.right = false;
                    break;
                case ' ':
                    this.car.inputs.brake = false;
                    break;
            }
        });
    }

    loadLevel(index) {
        this.currentLevelIndex = index;
        const level = GAME_LEVELS[this.currentLevelIndex];

        this.car.reset(level.startPos.x, level.startPos.y, level.startPos.angle);

        this.isGameOver = false;
        this.isLevelWon = false;
        this.gameTimeLeft = level.timeLimit;

        document.getElementById('level-display-num').textContent = level.id;
        this.updateTimerDisplay();

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (!this.isGameOver && !this.isLevelWon) {
                this.gameTimeLeft--;
                this.updateTimerDisplay();

                if (this.gameTimeLeft <= 0) {
                    this.triggerGameOver('Time Out! Level Failed.');
                }
            }
        }, 1000);

        soundManager.startEngine();
    }

    restartCurrentLevel() {
        this.loadLevel(this.currentLevelIndex);
    }

    updateTimerDisplay() {
        const mins = Math.floor(this.gameTimeLeft / 60);
        const secs = this.gameTimeLeft % 60;
        document.getElementById('timer-display').textContent =
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Geometry & Collision Detection Algorithms
    checkCollisions() {
        const level = GAME_LEVELS[this.currentLevelIndex];
        const carCorners = this.car.getCorners();

        // 1. Wall Collisions (Axis Aligned Bounding Boxes vs Car Corners)
        for (let wall of level.walls) {
            for (let pt of carCorners) {
                if (pt.x >= wall.x && pt.x <= wall.x + wall.width &&
                    pt.y >= wall.y && pt.y <= wall.y + wall.height) {
                    this.handleCollisionHit();
                    return;
                }
            }
        }

        // 2. Concrete Pillar Collisions (Circle vs Car Corners / Point)
        for (let pillar of level.pillars) {
            const dist = Math.hypot(this.car.x - pillar.x, this.car.y - pillar.y);
            if (dist < pillar.radius + (this.car.width / 2)) {
                this.handleCollisionHit();
                return;
            }
        }

        // 3. Parked Vehicles Collisions
        for (let parked of level.parkedCars) {
            // Simplified box distance check
            const dist = Math.hypot(this.car.x - parked.x, this.car.y - parked.y);
            if (dist < 45) {
                this.handleCollisionHit();
                return;
            }
        }
    }

    handleCollisionHit() {
        this.car.collisionsCount++;
        this.car.currentHealth = Math.max(0, this.car.currentHealth - 25);
        soundManager.playCrash();

        // Bounce back car physics
        this.car.speed = -this.car.speed * 0.6;

        if (this.car.currentHealth <= 0) {
            this.triggerGameOver('Vehicle Totaled! Too Much Damage.');
        }
    }

    checkParkingAlignment() {
        const level = GAME_LEVELS[this.currentLevelIndex];
        const target = level.targetBay;

        const dist = Math.hypot(this.car.x - target.x, this.car.y - target.y);
        const alignmentPointer = document.getElementById('alignment-pointer');
        const alignmentText = document.getElementById('alignment-text');

        if (dist > 250) {
            alignmentPointer.style.left = '0%';
            alignmentText.textContent = 'Far From Bay';
            alignmentText.style.color = '#94a3b8';
            return;
        }

        // Measure angle discrepancy
        let angleDiff = Math.abs(this.car.angle - target.angle) % Math.PI;
        if (angleDiff > Math.PI / 2) angleDiff = Math.PI - angleDiff;

        // Alignment percentage calculation (0 to 100%)
        const distAccuracy = Math.max(0, 100 - (dist * 2.5));
        const angleAccuracy = Math.max(0, 100 - (angleDiff * 180 / Math.PI) * 4);
        const overallAlignment = Math.floor((distAccuracy * 0.6) + (angleAccuracy * 0.4));

        alignmentPointer.style.left = `${Math.min(100, Math.max(0, overallAlignment))}%`;

        if (overallAlignment > 85) {
            alignmentText.textContent = 'PERFECT ALIGNMENT!';
            alignmentText.style.color = '#10b981';
        } else if (overallAlignment > 50) {
            alignmentText.textContent = 'ALIGNING...';
            alignmentText.style.color = '#f59e0b';
        } else {
            alignmentText.textContent = 'OUT OF BAY';
            alignmentText.style.color = '#ef4444';
        }

        // Victory Condition Check: Very close, low speed, aligned
        if (dist < 28 && angleDiff < 0.25 && Math.abs(this.car.speed) < 0.2) {
            this.triggerLevelSuccess(overallAlignment);
        }
    }

    triggerGameOver(reason) {
        this.isGameOver = true;
        soundManager.playFail();

        const resultModal = document.getElementById('modal-result');
        const statusBadge = document.getElementById('result-status-badge');

        statusBadge.textContent = 'FAILED!';
        statusBadge.className = 'result-badge failed';

        document.getElementById('result-title').textContent = reason;
        document.getElementById('star-1').className = 'star';
        document.getElementById('star-2').className = 'star';
        document.getElementById('star-3').className = 'star';

        document.getElementById('result-time').textContent = `${GAME_LEVELS[this.currentLevelIndex].timeLimit - this.gameTimeLeft}s`;
        document.getElementById('result-collisions').textContent = this.car.collisionsCount;
        document.getElementById('result-accuracy').textContent = '0%';
        document.getElementById('result-score').textContent = '0';

        resultModal.classList.remove('hidden');
    }

    triggerLevelSuccess(accuracy) {
        if (this.isLevelWon) return;
        this.isLevelWon = true;
        soundManager.playSuccess();

        const timeTaken = GAME_LEVELS[this.currentLevelIndex].timeLimit - this.gameTimeLeft;
        const timeBonus = Math.max(0, this.gameTimeLeft * 20);
        const accuracyBonus = accuracy * 25;
        const damagePenalty = this.car.collisionsCount * 300;

        const totalScore = Math.max(100, Math.floor(1000 + timeBonus + accuracyBonus - damagePenalty));
        this.score += totalScore;
        document.getElementById('score-display').textContent = this.score;

        // Calculate Star Rating
        let stars = 1;
        if (this.car.collisionsCount === 0 && accuracy > 75) stars = 2;
        if (this.car.collisionsCount === 0 && accuracy > 90 && timeTaken < 35) stars = 3;

        document.getElementById('star-1').className = 'star earned';
        document.getElementById('star-2').className = stars >= 2 ? 'star earned' : 'star';
        document.getElementById('star-3').className = stars >= 3 ? 'star earned' : 'star';

        const resultModal = document.getElementById('modal-result');
        const statusBadge = document.getElementById('result-status-badge');

        statusBadge.textContent = 'PARKED PERFECTLY!';
        statusBadge.className = 'result-badge success';

        document.getElementById('result-title').textContent = `Level ${GAME_LEVELS[this.currentLevelIndex].id} Completed!`;
        document.getElementById('result-time').textContent = `${timeTaken}s`;
        document.getElementById('result-collisions').textContent = this.car.collisionsCount;
        document.getElementById('result-accuracy').textContent = `${accuracy}%`;
        document.getElementById('result-score').textContent = totalScore.toLocaleString();

        resultModal.classList.remove('hidden');
    }

    updateHUD() {
        // Speedometer
        const speedKmh = Math.floor(Math.abs(this.car.speed) * 18);
        document.getElementById('speed-value').textContent = speedKmh;

        // Health Bar
        const healthFill = document.getElementById('damage-bar-fill');
        const healthPct = Math.floor((this.car.currentHealth / this.car.durability) * 100);
        healthFill.style.width = `${healthPct}%`;

        if (healthPct > 60) healthFill.className = 'progress-fill health-100';
        else if (healthPct > 30) healthFill.className = 'progress-fill health-warning';
        else healthFill.className = 'progress-fill health-critical';

        document.getElementById('damage-text').textContent = `${healthPct}% (${this.car.collisionsCount} Crashes)`;
    }

    renderGaragePreview() {
        if (!this.previewCtx) return;
        const ctx = this.previewCtx;
        ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

        // Draw parking lines in preview background
        ctx.strokeStyle = '#334155';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(40, 30, 200, 120);
        ctx.setLineDash([]);

        // Render preview car in center
        const preset = CAR_PRESETS[this.selectedCarIndex];
        const previewCar = new Car(preset);
        previewCar.x = 140;
        previewCar.y = 90;
        previewCar.angle = 0;
        previewCar.draw(ctx);
    }

    renderCarList() {
        const listContainer = document.getElementById('car-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        CAR_PRESETS.forEach((preset, idx) => {
            const item = document.createElement('div');
            item.className = `car-option ${idx === this.selectedCarIndex ? 'active' : ''}`;
            item.innerHTML = `
                <div>
                    <strong>${preset.name}</strong>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${preset.type}</div>
                </div>
                <span class="level-badge">${preset.durability} HP</span>
            `;
            item.addEventListener('click', () => {
                this.selectedCarIndex = idx;
                this.renderCarList();
                this.updateGarageStats();
                this.renderGaragePreview();
            });
            listContainer.appendChild(item);
        });

        this.updateGarageStats();
    }

    updateGarageStats() {
        const preset = CAR_PRESETS[this.selectedCarIndex];
        document.getElementById('selected-car-name').textContent = preset.name;
        document.getElementById('stat-speed').style.width = `${(preset.maxSpeed / 6.0) * 100}%`;
        document.getElementById('stat-handling').style.width = `${(preset.turnSpeed / 0.05) * 100}%`;
        document.getElementById('stat-durability').style.width = `${(preset.durability / 150) * 100}%`;
    }

    renderLevelsList() {
        const grid = document.getElementById('levels-grid');
        if (!grid) return;
        grid.innerHTML = '';

        GAME_LEVELS.forEach((level, idx) => {
            const card = document.createElement('div');
            card.className = 'level-card';
            card.innerHTML = `
                <div class="level-badge">LEVEL ${level.id}</div>
                <div class="level-title">${level.title}</div>
                <div class="level-desc">${level.description}</div>
            `;
            card.addEventListener('click', () => {
                this.loadLevel(idx);
                document.getElementById('modal-levels').classList.add('hidden');
            });
            grid.appendChild(card);
        });
    }

    openGarageModal() {
        this.renderGaragePreview();
        document.getElementById('modal-garage').classList.remove('hidden');
    }

    openLevelsModal() {
        document.getElementById('modal-levels').classList.remove('hidden');
    }

    // Main Draw Function for Apartment Parking Level
    drawLevel() {
        const level = GAME_LEVELS[this.currentLevelIndex];
        const ctx = this.ctx;

        // Ground/Asphalt texture background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Parking bay markings / Grid guidelines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        // Render Speed Bumps
        if (level.speedBumps) {
            level.speedBumps.forEach(bump => {
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(bump.x, bump.y, bump.width, bump.height);
                // Striped bump pattern
                ctx.fillStyle = '#000000';
                for (let bx = bump.x; bx < bump.x + bump.width; bx += 20) {
                    ctx.fillRect(bx, bump.y, 10, bump.height);
                }
            });
        }

        // Render Target Parking Bay
        const target = level.targetBay;
        ctx.save();
        ctx.translate(target.x, target.y);
        ctx.rotate(target.angle);

        // Pulsing target bay highlight
        const pulse = Math.sin(Date.now() * 0.005) * 0.15 + 0.85;
        ctx.fillStyle = `rgba(16, 185, 129, ${0.25 * pulse})`;
        ctx.fillRect(-target.width / 2, -target.height / 2, target.width, target.height);

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(-target.width / 2, -target.height / 2, target.width, target.height);
        ctx.setLineDash([]);

        // Target Bay Text Label
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(target.label, 0, 5);
        ctx.restore();

        // Render Walls & Structures
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        level.walls.forEach(wall => {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
        });

        // Render Concrete Pillars
        level.pillars.forEach(pillar => {
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(pillar.x, pillar.y, pillar.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.stroke();

            // Pillar hazard stripes
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(pillar.x, pillar.y, pillar.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        });

        // Render EV Chargers (Level 4)
        if (level.evChargers) {
            level.evChargers.forEach(charger => {
                ctx.fillStyle = '#10b981';
                ctx.fillRect(charger.x, charger.y, charger.width, charger.height);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px Orbitron';
                ctx.fillText('⚡', charger.x + 6, charger.y + 18);
            });
        }

        // Render Parked Vehicles
        level.parkedCars.forEach(parked => {
            ctx.save();
            ctx.translate(parked.x, parked.y);
            ctx.rotate(parked.angle);

            ctx.fillStyle = parked.color;
            ctx.fillRect(-parked.width / 2, -parked.height / 2, parked.width, parked.height);
            ctx.strokeStyle = '#0f172a';
            ctx.strokeRect(-parked.width / 2, -parked.height / 2, parked.width, parked.height);

            // Windshield
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-parked.width / 2 + 4, -parked.height / 2 + 10, parked.width - 8, 14);
            ctx.restore();
        });

        // Render Level Text / Annotations
        if (level.decorations) {
            level.decorations.forEach(dec => {
                if (dec.type === 'text') {
                    ctx.fillStyle = dec.color;
                    ctx.font = 'bold 13px Orbitron, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(dec.text, dec.x, dec.y);
                } else if (dec.type === 'helipad') {
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(dec.x, dec.y, dec.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.font = 'bold 48px Orbitron';
                    ctx.fillStyle = '#f59e0b';
                    ctx.textAlign = 'center';
                    ctx.fillText('H', dec.x, dec.y + 16);
                }
            });
        }

        // Render Player Car
        this.car.draw(ctx);
    }

    startGameLoop() {
        const loop = () => {
            if (!this.isGameOver && !this.isLevelWon) {
                this.car.updatePhysics();
                this.checkCollisions();
                this.checkParkingAlignment();
                this.updateHUD();

                // Engine audio updates
                const speedRatio = Math.abs(this.car.speed) / this.car.maxSpeed;
                soundManager.updateEngine(speedRatio, this.car.inputs.up);
            }

            this.drawLevel();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

// Instantiate game on window load
window.addEventListener('load', () => {
    window.gameApp = new GameApp();
});
