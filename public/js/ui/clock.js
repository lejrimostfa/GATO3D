// ui/clock.js
// Module horloge pour GATO3D

/**
 * Dessine le cadran de l'horloge sur le canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} radius
 */
export function drawClockFace(ctx, radius) {
    ctx.beginPath();
    ctx.arc(radius, radius, radius * 0.95, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent black background
    ctx.fill();
    ctx.strokeStyle = '#0f0'; // Green border
    ctx.lineWidth = radius * 0.05;
    ctx.stroke();

    // Draw hour numbers (1 to 12, 12 at top)
    ctx.font = `${radius * 0.22}px monospace`; // Taille réduite (0.32 → 0.22)
    ctx.fillStyle = '#0f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let n = 1; n <= 12; n++) {
        const angle = (n - 3) * (Math.PI / 6); // -3 to put 12 at top
        const numRadius = radius * 0.75;
        const x = radius + numRadius * Math.cos(angle);
        const y = radius + numRadius * Math.sin(angle);
        ctx.fillText(n.toString(), x, y);
    }
}

/**
 * Dessine l'aiguille de l'heure (2 tours pour 24h)
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} radius
 * @param {number} hour (0-24)
 */
export function drawTime(ctx, radius, hour) {
    // 2 tours pour 24h : angle = hour/12*2PI - PI/2 (minuit en haut)
    const hourAngle = ((hour / 12) * 2 * Math.PI) - Math.PI/2;
    const hourHandLength = radius * 0.6;
    const hourHandWidth = radius * 0.07;
    drawHand(ctx, radius, hourAngle, hourHandLength, hourHandWidth, '#0f0');
}

/**
 * Dessine une aiguille
 */
function drawHand(ctx, radius, angle, length, width, color) {
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.moveTo(radius, radius);
    ctx.lineTo(
        radius + length * Math.cos(angle),
        radius + length * Math.sin(angle)
    );
    ctx.stroke();
    ctx.restore();
}
