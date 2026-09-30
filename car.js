// Car Kinematics and Physics Entity

class Car {
    constructor(preset) {
        this.updatePreset(preset);
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.speed = 0;
        this.steeringAngle = 0;
        this.reverseGear = false;
        this.collisionsCount = 0;
        this.currentHealth = 100;

        // Control inputs state
        this.inputs = {
            up: false,
            down: false,
            left: false,
            right: false,
            brake: false
        };
    }

    updatePreset(preset) {
        this.preset = preset;
        this.width = preset.width;
        this.length = preset.length;
        this.maxSpeed = preset.maxSpeed;
        this.accel = preset.accel;
        this.turnSpeed = preset.turnSpeed;
        this.durability = preset.durability;
        this.color = preset.color;
        this.currentHealth = preset.durability;
    }

    reset(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 0;
        this.steeringAngle = 0;
        this.reverseGear = false;
        this.collisionsCount = 0;
        this.currentHealth = this.durability;
        this.inputs = { up: false, down: false, left: false, right: false, brake: false };
    }

    // Returns bounding box corners of rotated car
    getCorners() {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const hw = this.width / 2;
        const hl = this.length / 2;

        return [
            { x: this.x + ( cos * hl - sin * (-hw)), y: this.y + ( sin * hl + cos * (-hw)) }, // Front-Left
            { x: this.x + ( cos * hl - sin * hw),   y: this.y + ( sin * hl + cos * hw) },   // Front-Right
            { x: this.x + (-cos * hl - sin * hw),   y: this.y + (-sin * hl + cos * hw) },   // Rear-Right
            { x: this.x + (-cos * hl - sin * (-hw)), y: this.y + (-sin * hl + cos * (-hw)) }  // Rear-Left
        ];
    }

    updatePhysics() {
        const friction = 0.04;
        const brakeDecel = 0.15;
        const maxSteer = 0.55;

        // Steering input
        if (this.inputs.left) {
            this.steeringAngle = Math.max(this.steeringAngle - 0.08, -maxSteer);
        } else if (this.inputs.right) {
            this.steeringAngle = Math.min(this.steeringAngle + 0.08, maxSteer);
        } else {
            // Return steering to center
            if (this.steeringAngle > 0) this.steeringAngle = Math.max(0, this.steeringAngle - 0.08);
            if (this.steeringAngle < 0) this.steeringAngle = Math.min(0, this.steeringAngle + 0.08);
        }

        // Acceleration / Reverse / Braking
        const direction = this.reverseGear ? -1 : 1;

        if (this.inputs.up) {
            this.speed += this.accel * direction;
        } else if (this.inputs.down) {
            this.speed -= (this.accel * 0.8) * direction;
        } else if (this.inputs.brake) {
            if (this.speed > 0) this.speed = Math.max(0, this.speed - brakeDecel);
            if (this.speed < 0) this.speed = Math.min(0, this.speed + brakeDecel);
        } else {
            // Natural friction
            if (this.speed > 0) this.speed = Math.max(0, this.speed - friction);
            if (this.speed < 0) this.speed = Math.min(0, this.speed + friction);
        }

        // Speed caps
        const topForward = this.maxSpeed;
        const topReverse = -this.maxSpeed * 0.5;

        if (this.speed > topForward) this.speed = topForward;
        if (this.speed < topReverse) this.speed = topReverse;

        // Apply turning scaled by speed
        if (Math.abs(this.speed) > 0.05) {
            const turnFactor = (this.speed / this.maxSpeed) * this.turnSpeed;
            this.angle += this.steeringAngle * turnFactor;
        }

        // Position translation
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const w = this.width;
        const l = this.length;
        const hw = w / 2;
        const hl = l / 2;

        // Shadow under car
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.roundRect(-hl - 2, -hw - 2, l + 6, w + 6, 8);
        ctx.fill();

        // Car main body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-hl, -hw, l, w, 6);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Windshield / Glass roof
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(-hl + 18, -hw + 4, l - 36, w - 8, 4);
        ctx.fill();

        // Roof top accent
        ctx.fillStyle = this.color;
        ctx.fillRect(-hl + 26, -hw + 6, l - 52, w - 12);

        // Headlights (Front is +x direction)
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(hl - 4, -hw + 3, 4, 8);
        ctx.fillRect(hl - 4, hw - 11, 4, 8);

        // Tail Lights (Rear is -x direction)
        ctx.fillStyle = this.speed < 0 || this.inputs.brake ? '#ef4444' : '#991b1b';
        ctx.fillRect(-hl, -hw + 3, 3, 7);
        ctx.fillRect(-hl, hw - 10, 3, 7);

        // Wheels
        ctx.fillStyle = '#0f172a';
        // Front wheels turn with steeringAngle
        const wheelL = 14;
        const wheelW = 6;

        // Front Left Wheel
        ctx.save();
        ctx.translate(hl - 16, -hw);
        ctx.rotate(this.steeringAngle);
        ctx.fillRect(-wheelL/2, -wheelW/2, wheelL, wheelW);
        ctx.restore();

        // Front Right Wheel
        ctx.save();
        ctx.translate(hl - 16, hw);
        ctx.rotate(this.steeringAngle);
        ctx.fillRect(-wheelL/2, -wheelW/2, wheelL, wheelW);
        ctx.restore();

        // Rear Wheels
        ctx.fillRect(-hl + 10, -hw - 2, wheelL, wheelW);
        ctx.fillRect(-hl + 10, hw - 4, wheelL, wheelW);

        ctx.restore();
    }
}
