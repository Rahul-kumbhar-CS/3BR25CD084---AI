// Apartment Complex Level Definitions & Configurations

const CAR_PRESETS = [
    {
        id: 'hatchback',
        name: 'Resident Hatchback',
        type: 'Compact',
        width: 36,
        length: 70,
        maxSpeed: 4.2,
        accel: 0.12,
        turnSpeed: 0.045,
        durability: 100,
        color: '#e74c3c'
    },
    {
        id: 'sedan',
        name: 'Executive Sedan',
        type: 'Sedan',
        width: 40,
        length: 82,
        maxSpeed: 4.8,
        accel: 0.14,
        turnSpeed: 0.04,
        durability: 120,
        color: '#3498db'
    },
    {
        id: 'suv',
        name: 'Family SUV',
        type: 'SUV',
        width: 44,
        length: 90,
        maxSpeed: 4.0,
        accel: 0.10,
        turnSpeed: 0.035,
        durability: 150,
        color: '#2ecc71'
    },
    {
        id: 'sports',
        name: 'Penthouse Supercar',
        type: 'Sports',
        width: 42,
        length: 80,
        maxSpeed: 5.8,
        accel: 0.20,
        turnSpeed: 0.05,
        durability: 80,
        color: '#f1c40f'
    }
];

const GAME_LEVELS = [
    {
        id: 1,
        title: "Ground Floor Resident Parking",
        subtitle: "A-1 Resident Bay",
        description: "Welcome to Grand Heights! Park your vehicle safely inside your designated apartment bay without hitting surrounding parked cars.",
        timeLimit: 60,
        startPos: { x: 120, y: 550, angle: -Math.PI / 2 },
        targetBay: { x: 750, y: 150, width: 60, height: 110, angle: 0, label: 'BAY A-1' },
        walls: [
            // Outer complex boundaries
            { x: 10, y: 10, width: 980, height: 20 },
            { x: 10, y: 10, width: 20, height: 630 },
            { x: 970, y: 10, width: 20, height: 630 },
            { x: 10, y: 620, width: 980, height: 20 },
            // Security gate booth
            { x: 250, y: 400, width: 120, height: 20 }
        ],
        pillars: [
            { x: 400, y: 250, radius: 18 },
            { x: 600, y: 250, radius: 18 }
        ],
        parkedCars: [
            { x: 630, y: 150, width: 40, height: 80, color: '#95a5a6', angle: 0 },
            { x: 870, y: 150, width: 40, height: 80, color: '#d35400', angle: 0 },
            { x: 630, y: 380, width: 40, height: 80, color: '#8e44ad', angle: 0 }
        ],
        speedBumps: [
            { x: 300, y: 500, width: 140, height: 14 }
        ],
        decorations: [
            { type: 'text', text: 'GRAND HEIGHTS - GROUND FLOOR', x: 450, y: 50, color: '#64748b' },
            { type: 'arrow', x: 200, y: 500, angle: -Math.PI / 2 },
            { type: 'planter', x: 50, y: 50, width: 80, height: 40 }
        ]
    },
    {
        id: 2,
        title: "Basement Level B1 Concrete Maze",
        subtitle: "Pillar Challenge",
        description: "Navigate past tight concrete pillars and low ceiling supports in the basement floor to reach Bay B-12.",
        timeLimit: 55,
        startPos: { x: 100, y: 100, angle: 0 },
        targetBay: { x: 800, y: 480, width: 60, height: 110, angle: 0, label: 'BAY B-12' },
        walls: [
            { x: 10, y: 10, width: 980, height: 20 },
            { x: 10, y: 10, width: 20, height: 630 },
            { x: 970, y: 10, width: 20, height: 630 },
            { x: 10, y: 620, width: 980, height: 20 },
            // Basement elevator shaft wall
            { x: 400, y: 180, width: 200, height: 140 }
        ],
        pillars: [
            { x: 220, y: 200, radius: 22 },
            { x: 220, y: 450, radius: 22 },
            { x: 700, y: 200, radius: 22 },
            { x: 700, y: 450, radius: 22 }
        ],
        parkedCars: [
            { x: 680, y: 480, width: 40, height: 80, color: '#34495e', angle: 0 },
            { x: 920, y: 480, width: 40, height: 80, color: '#16a085', angle: 0 },
            { x: 200, y: 80, width: 80, height: 40, color: '#e67e22', angle: Math.PI / 2 }
        ],
        speedBumps: [
            { x: 120, y: 300, width: 14, height: 120 },
            { x: 820, y: 300, width: 14, height: 120 }
        ],
        decorations: [
            { type: 'text', text: 'BASEMENT B1 - CAUTION LOW CLEARANCE', x: 420, y: 150, color: '#e74c3c' },
            { type: 'planter', x: 620, y: 200, width: 40, height: 40 }
        ]
    },
    {
        id: 3,
        title: "Narrow Visitor Parking Alley",
        subtitle: "Parallel & Reverse Alley",
        description: "Strict visitor parking zone! Maneuver around delivery vehicles and reverse into the tight designated visitor spot.",
        timeLimit: 50,
        startPos: { x: 880, y: 550, angle: -Math.PI / 2 },
        targetBay: { x: 180, y: 250, width: 110, height: 60, angle: Math.PI / 2, label: 'VISITOR 04' },
        walls: [
            { x: 10, y: 10, width: 980, height: 20 },
            { x: 10, y: 10, width: 20, height: 630 },
            { x: 970, y: 10, width: 20, height: 630 },
            { x: 10, y: 620, width: 980, height: 20 },
            // Trash & Recycling Enclosure
            { x: 450, y: 420, width: 180, height: 120 }
        ],
        pillars: [
            { x: 350, y: 180, radius: 16 },
            { x: 650, y: 180, radius: 16 }
        ],
        parkedCars: [
            { x: 180, y: 130, width: 80, height: 40, color: '#c0392b', angle: Math.PI / 2 },
            { x: 180, y: 370, width: 80, height: 40, color: '#27ae60', angle: Math.PI / 2 },
            { x: 650, y: 560, width: 90, height: 44, color: '#7f8c8d', angle: 0 } // Delivery Van
        ],
        speedBumps: [
            { x: 750, y: 400, width: 120, height: 14 }
        ],
        decorations: [
            { type: 'text', text: 'VISITOR PARKING ONLY - MAX 2 HRS', x: 220, y: 50, color: '#f39c12' }
        ]
    },
    {
        id: 4,
        title: "EV Charging Station Dock",
        subtitle: "Green Mobility Zone",
        description: "Back your car accurately into the Eco-Friendly EV Supercharger bay to plug in and recharge.",
        timeLimit: 45,
        startPos: { x: 100, y: 550, angle: -Math.PI / 2 },
        targetBay: { x: 500, y: 140, width: 60, height: 100, angle: 0, label: '⚡ EV CHARGE' },
        walls: [
            { x: 10, y: 10, width: 980, height: 20 },
            { x: 10, y: 10, width: 20, height: 630 },
            { x: 970, y: 10, width: 20, height: 630 },
            { x: 10, y: 620, width: 980, height: 20 },
            // EV Power Transformer Unit
            { x: 470, y: 40, width: 120, height: 35 }
        ],
        pillars: [
            { x: 300, y: 320, radius: 20 },
            { x: 700, y: 320, radius: 20 }
        ],
        evChargers: [
            { x: 380, y: 80, width: 24, height: 30 },
            { x: 500, y: 80, width: 24, height: 30 }, // Active Charger
            { x: 620, y: 80, width: 24, height: 30 }
        ],
        parkedCars: [
            { x: 380, y: 140, width: 40, height: 80, color: '#2980b9', angle: 0 },
            { x: 620, y: 140, width: 40, height: 80, color: '#2196f3', angle: 0 }
        ],
        speedBumps: [
            { x: 500, y: 380, width: 150, height: 14 }
        ],
        decorations: [
            { type: 'text', text: '⚡ FAST EV CHARGING STATION', x: 500, y: 260, color: '#10b981' }
        ]
    },
    {
        id: 5,
        title: "Penthouse Rooftop VIP Ramp & Bay",
        subtitle: "Luxury Penthouse Suite",
        description: "Ultimate parking test! Drive up the tight penthouse ramp, avoid luxury sports cars, and park in the VIP Covered Suite.",
        timeLimit: 50,
        startPos: { x: 80, y: 550, angle: 0 },
        targetBay: { x: 820, y: 150, width: 65, height: 115, angle: 0, label: '👑 VIP PENTHOUSE' },
        walls: [
            { x: 10, y: 10, width: 980, height: 20 },
            { x: 10, y: 10, width: 20, height: 630 },
            { x: 970, y: 10, width: 20, height: 630 },
            { x: 10, y: 620, width: 980, height: 20 },
            // Helipad boundary / Roof wall
            { x: 250, y: 150, width: 350, height: 250 }
        ],
        pillars: [
            { x: 150, y: 350, radius: 25 },
            { x: 720, y: 350, radius: 25 }
        ],
        parkedCars: [
            { x: 700, y: 150, width: 42, height: 85, color: '#f39c12', angle: 0 },
            { x: 940, y: 150, width: 42, height: 85, color: '#e74c3c', angle: 0 }
        ],
        speedBumps: [
            { x: 180, y: 480, width: 120, height: 14 },
            { x: 750, y: 480, width: 120, height: 14 }
        ],
        decorations: [
            { type: 'text', text: '👑 PENTHOUSE VIP SUITES', x: 425, y: 100, color: '#f59e0b' },
            { type: 'helipad', x: 425, y: 275, radius: 80 }
        ]
    }
];
