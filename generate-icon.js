const { createCanvas } = require('canvas');
const fs = require('fs');

const size = 512;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');
const cx = size / 2;
const cy = size / 2;

// Clear with transparency
ctx.clearRect(0, 0, size, size);

// Rounded rectangle clip path
const radius = size * 0.18;
ctx.save();
ctx.beginPath();
ctx.moveTo(radius, 0);
ctx.lineTo(size - radius, 0);
ctx.quadraticCurveTo(size, 0, size, radius);
ctx.lineTo(size, size - radius);
ctx.quadraticCurveTo(size, size, size - radius, size);
ctx.lineTo(radius, size);
ctx.quadraticCurveTo(0, size, 0, size - radius);
ctx.lineTo(0, radius);
ctx.quadraticCurveTo(0, 0, radius, 0);
ctx.closePath();
ctx.clip();

// Dark blue gradient background
const bgGrad = ctx.createRadialGradient(cx, cy * 0.8, 0, cx, cy, size * 0.7);
bgGrad.addColorStop(0, '#1a2a5e');
bgGrad.addColorStop(1, '#0a0f2a');
ctx.fillStyle = bgGrad;
ctx.fillRect(0, 0, size, size);

// Subtle maze grid
ctx.strokeStyle = 'rgba(49, 74, 189, 0.15)';
ctx.lineWidth = size * 0.012;
const gridSize = size * 0.12;
for (let x = gridSize; x < size; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
}
for (let y = gridSize; y < size; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
}

// Dots
ctx.fillStyle = 'rgba(255, 217, 185, 0.4)';
const dotPositions = [
    [0.15, 0.25], [0.30, 0.15], [0.70, 0.15], [0.85, 0.25],
    [0.15, 0.75], [0.30, 0.85], [0.70, 0.85], [0.85, 0.75],
    [0.50, 0.12], [0.50, 0.88], [0.12, 0.50], [0.88, 0.50],
    [0.20, 0.40], [0.80, 0.40], [0.20, 0.60], [0.80, 0.60],
];
dotPositions.forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(size * dx, size * dy, size * 0.015, 0, Math.PI * 2);
    ctx.fill();
});

// Power pellets
ctx.fillStyle = 'rgba(255, 217, 185, 0.6)';
[[0.15, 0.25], [0.85, 0.75], [0.15, 0.75], [0.85, 0.25]].forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(size * px, size * py, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
});

// Ghost drawing function
function drawGhost(x, y, ghostSize, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - ghostSize * 0.15, ghostSize * 0.55, Math.PI, 0, false);
    ctx.lineTo(x + ghostSize * 0.55, y + ghostSize * 0.4);
    const waves = 3;
    const waveW = (ghostSize * 1.1) / waves;
    for (let i = 0; i < waves; i++) {
        const wx = x + ghostSize * 0.55 - waveW * i;
        ctx.quadraticCurveTo(wx - waveW * 0.25, y + ghostSize * 0.6, wx - waveW * 0.5, y + ghostSize * 0.4);
        ctx.quadraticCurveTo(wx - waveW * 0.75, y + ghostSize * 0.2, wx - waveW, y + ghostSize * 0.4);
    }
    ctx.closePath();
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    const eyeOffset = ghostSize * 0.18;
    ctx.beginPath();
    ctx.ellipse(x - eyeOffset, y - ghostSize * 0.15, ghostSize * 0.14, ghostSize * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + eyeOffset, y - ghostSize * 0.15, ghostSize * 0.14, ghostSize * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pupils
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x - eyeOffset + ghostSize * 0.04, y - ghostSize * 0.12, ghostSize * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + eyeOffset + ghostSize * 0.04, y - ghostSize * 0.12, ghostSize * 0.07, 0, Math.PI * 2);
    ctx.fill();
}

// Draw 4 ghosts in corners
const ghostColors = ['#FF0000', '#00FFDE', '#FFB8DE', '#FFB847'];
const ghostPositions = [
    [0.22, 0.28], [0.78, 0.28], [0.22, 0.72], [0.78, 0.72]
];
ghostPositions.forEach(([gx, gy], i) => {
    drawGhost(size * gx, size * gy, size * 0.075, ghostColors[i]);
});

// Main Pac-Man
const pacRadius = size * 0.22;
const pacX = cx - size * 0.02;
const pacY = cy;
const mouthAngle = Math.PI * 0.22;

// Glow
const glowGrad = ctx.createRadialGradient(pacX, pacY, pacRadius * 0.5, pacX, pacY, pacRadius * 1.6);
glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
glowGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
ctx.fillStyle = glowGrad;
ctx.beginPath();
ctx.arc(pacX, pacY, pacRadius * 1.6, 0, Math.PI * 2);
ctx.fill();

// Body
ctx.fillStyle = '#FFD700';
ctx.beginPath();
ctx.arc(pacX, pacY, pacRadius, mouthAngle, -mouthAngle + Math.PI * 2);
ctx.lineTo(pacX, pacY);
ctx.closePath();
ctx.fill();

// Highlight
ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
ctx.beginPath();
ctx.arc(pacX - pacRadius * 0.2, pacY - pacRadius * 0.3, pacRadius * 0.25, 0, Math.PI * 2);
ctx.fill();

// Eye
ctx.fillStyle = '#111';
ctx.beginPath();
ctx.arc(pacX + pacRadius * 0.15, pacY - pacRadius * 0.45, pacRadius * 0.09, 0, Math.PI * 2);
ctx.fill();

// "3D" watermark
ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
ctx.font = `bold ${size * 0.45}px sans-serif`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('3D', cx + size * 0.05, cy + size * 0.02);

ctx.restore();

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('puter-app-icon.png', buffer);
console.log('Icon saved: puter-app-icon.png (' + buffer.length + ' bytes, ' + size + 'x' + size + ')');
