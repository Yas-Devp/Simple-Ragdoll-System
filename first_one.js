// Set up Canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
canvas.width = 800 * dpr;
canvas.height = 600 * dpr;
canvas.style.width = '800px';
canvas.style.height = '600px';
ctx.scale(dpr, dpr);

// Define Point class
class Point {
    constructor(x, y, isPinned = false) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.isPinned = isPinned;
    }
}

// Define Stick class (rigid joint)
class Stick {
    constructor(pointA, pointB, type) {
        this.pointA = pointA;
        this.pointB = pointB;
        this.type = type;
        this.length = Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
    }
}

// Initialize 6 points (1 pinned + 5 free)
const points = [
    new Point(400, 100, false), // Point 0 (pinned, red)
    new Point(400, 150, false), // Point 1 (blue, original)
    new Point(400, 250, false), // Point 2
    //new Point(400, 250, false), // Point 3
    new Point(400, 300, false), // Point 4
    new Point(400, 350, false) // Point 5
];

// Create 5 sticks to form a chain
const sticks = [
    new Stick(points[0], points[1], "circle"), // Connect 0-1
    new Stick(points[1], points[2], "rec"), // Connect 1-2
    new Stick(points[2], points[3], "rec"), // Connect 2-3
    new Stick(points[3], points[4], "rec"), // Connect 3-4
    //new Stick(points[4], points[5])  // Connect 4-5
];
//add arms
//right arm
points.push(new Point(450, 150, false));
sticks.push(new Stick(points[1], points[points.length - 1], "rec"));

points.push(new Point(450, 200, false));
sticks.push(new Stick(points[5], points[points.length - 1], "rec"));

//left arm
points.push(new Point(450, 150, false));
sticks.push(new Stick(points[1], points[points.length - 1], "rec"));

points.push(new Point(450, 200, false));
sticks.push(new Stick(points[7], points[points.length - 1], "rec"));

//other foot :>
points.push(new Point(450, 250, false));
sticks.push(new Stick(points[2], points[points.length - 1], "rec"));

points.push(new Point(450, 300, false));
sticks.push(new Stick(points[9], points[points.length - 1], "rec"));

// Physics parameters
const gravity = 1000; // Pixels per second^2
const dt = 0.016; // Time step (60 FPS)
const iterations = 5; // Constraint iterations
const damping = 0.99; // Reduce jitter

// Update points with Verlet integration
function updatePoints() {
    points.forEach(p => {
        if (p.isPinned) return;
        let vx = (p.x - p.prevX) * damping;
        let vy = (p.y - p.prevY) * damping;
        p.prevX = p.x;
        p.prevY = p.y;
        p.x += vx;
        p.y += vy + gravity * dt * dt;
        // Floor collision
        if (p.y > 600) {
            p.y = 600;
            p.prevY = p.y - vy * dt;
        }
    });
}

// Enforce stick constraints
function enforceConstraints() {
    for (let i = 0; i < iterations; i++) {
        sticks.forEach(s => {
            let dx = s.pointB.x - s.pointA.x;
            let dy = s.pointB.y - s.pointA.y;
            let currentLength = Math.hypot(dx, dy);
            let delta = (currentLength - s.length) / currentLength;
            let offsetX = dx * 0.5 * delta;
            let offsetY = dy * 0.5 * delta;
            if (!s.pointA.isPinned) {
                s.pointA.x += offsetX;
                s.pointA.y += offsetY;
            }
            if (!s.pointB.isPinned) {
                s.pointB.x -= offsetX;
                s.pointB.y -= offsetY;
            }
        });
    }
}

// Render points and sticks
/*
function render() {
    ctx.clearRect(0, 0, 800, 600);
    // Draw sticks
    ctx.beginPath();
    sticks.forEach(s => {
        ctx.moveTo(s.pointA.x, s.pointA.y);
        ctx.lineTo(s.pointB.x, s.pointB.y);
    });
    ctx.strokeStyle = 'black';
    ctx.stroke();
    // Draw points (balls)
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = p.isPinned ? 'red' : 'blue';
        ctx.fill();
    });
}
*/

// Render points and rectangles
function render() {
    ctx.clearRect(0, 0, 800, 600);
    // Draw rectangles for sticks
    sticks.forEach(s => {
        let dx = s.pointB.x - s.pointA.x;
        let dy = s.pointB.y - s.pointA.y;
        let length = Math.hypot(dx, dy);
        let angle = Math.atan2(dy, dx); // Angle from pointA to pointB

        // Rectangle dimensions (width = 10, height = target length)
        let width = 20; // Thickness of the rectangle
        let height = s.length; // Use target length for consistency

        // Center the rectangle at the midpoint
        let midX = (s.pointA.x + s.pointB.x) / 2;
        let midY = (s.pointA.y + s.pointB.y) / 2;

        // Save context, translate, rotate, and draw rectangle
        if (s.type == "rec") {
            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(angle - Math.PI / 2); // Adjust rotation by 90 degrees
            ctx.beginPath();
            ctx.rect(-width / 2, -height / 2, width, height); // Centered rectangle
            ctx.fillStyle = 'black';
            ctx.fill();
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.arc(midX, midY, width, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();
        }
    });

    // Draw points (balls)
    /*
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = p.isPinned ? 'red' : 'blue';
        ctx.fill();
    });
    */
}

// Touch interaction
let selectedPoint = null;
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = (touch.clientX - rect.left) * (800 / rect.width);
    const touchY = (touch.clientY - rect.top) * (600 / rect.height);
    points.forEach(p => {
        if (!p.isPinned && Math.hypot(p.x - touchX, p.y - touchY) < 20) {
            selectedPoint = p;
            p.x = touchX;
            p.y = touchY;
            p.prevX = p.x;
            p.prevY = p.y;
        }
    });
});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (selectedPoint) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const touchX = (touch.clientX - rect.left) * (800 / rect.width);
        const touchY = (touch.clientY - rect.top) * (600 / rect.height);
        selectedPoint.x = touchX;
        selectedPoint.y = touchY;
        selectedPoint.prevX = touchX;
        selectedPoint.prevY = touchY;
    }
});

canvas.addEventListener('touchend', () => {
    selectedPoint = null;
});

// Game loop
function gameLoop() {
    updatePoints();
    enforceConstraints();
    render();
    requestAnimationFrame(gameLoop);
}

// Start simulation
gameLoop();   