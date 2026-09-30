# Apartment Valet: 2D Car Parking Simulator 🏢🚗

A modern, web-based 2D car parking simulation game set in a multi-level luxury apartment complex. Master realistic car physics, reverse parking, parallel parking, and navigate through tight basement corridors, structural support pillars, speed bumps, and active security patrols!

![Apartment Parking Game](screenshot.png)

## 🎮 Game Features

- **Realistic Car Kinematics**: Bicycle vehicle physics model with smooth acceleration, realistic steering angles, braking dynamics, gear shifting (Drive & Reverse), and friction.
- **5 Unique Apartment Parking Levels**:
  1. **Level 1: Basement Entrance** - Navigate past security walls to park in bay B-01.
  2. **Level 2: Pillar Labyrinth** - Weave around tight concrete support pillars to find spot P-04.
  3. **Level 3: Courtyard Alley** - Master parallel parking between resident sports cars in bay C-02.
  4. **Level 4: Speed Bump Zone** - Control your speed over speed bumps and avoid moving security patrol carts.
  5. **Level 5: Tight VIP Reverse Bay** - Precision reverse parking into narrow penthouse VIP bay.
- **OBB Collision Engine**: Accurate Oriented Bounding Box collision detection using the Separating Axis Theorem (SAT) for walls, pillars, parked vehicles, and moving obstacles.
- **Web Audio API Sound Synth**: Synthetic real-time engine sound pitch changing with speed, gear click feedback, crash sounds, and victory chimes without external audio file dependencies.
- **HUD & Touch Controls**: Complete UI HUD with real-time speedometer, timer, damage meter, gear display, and on-screen steering/pedal touch controls.

---

## ⌨️ Controls & How to Play

| Action | Keyboard Input | Touch / On-screen |
| :--- | :--- | :--- |
| **Accelerate** | `W` or `Up Arrow (▲)` | `GAS` Button |
| **Brake / Slow down** | `S` or `Down Arrow (▼)` | `BRAKE` Button |
| **Steer Left** | `A` or `Left Arrow (◄)` | `◀` Button |
| **Steer Right** | `D` or `Right Arrow (►)` | `▶` Button |
| **Toggle Gear (D / R)** | `R` Key | `Gear: Drive/Reverse` Button |
| **Handbrake** | `Spacebar` | `BRAKE` Button |

---

## 🚀 How to Run Locally

Since the game is built purely with HTML5, CSS3, and JavaScript (Canvas API & Web Audio API), no compilation or complex backend is required!

1. Clone or download the project files:
   - `index.html`
   - `style.css`
   - `game.js`
2. Open `index.html` directly in any modern web browser (Chrome, Firefox, Safari, Edge) OR run a local development server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js npx
npx http-server . -p 8000
```

3. Navigate to `http://localhost:8000` in your web browser and start parking!

---

## 🏆 Parking Rules & Star Ratings

- Drive your car inside the yellow highlighted parking bay area.
- Ensure your vehicle is aligned properly with the bay angle.
- **Stop the car completely** inside the lines for **1.5 seconds** until the holding gauge reaches 100%.
- **Stars Earned**:
  - ⭐⭐⭐ **3 Stars**: Fast completion with 0% - 20% vehicle damage.
  - ⭐⭐ **2 Stars**: Moderate completion time or minor bumper scrapes.
  - ⭐ **1 Star**: Slow completion time or heavy vehicle damage.
