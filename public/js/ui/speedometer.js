// ui/speedometer.js
// Speedometer UI component for GATO3D

/**
 * Initialize the speedometer component
 * @returns {Object} - Interface to update the speedometer
 */
export function initSpeedometer() {
  const speedCanvas = document.getElementById('speedometer-canvas');
  if (!speedCanvas) {
    console.error("Speedometer canvas not found!");
    return null;
  }
  
  const speedCtx = speedCanvas.getContext('2d');
  
  // Draw initial speedometer with 0 speed and default max speed
  drawSpeedometer(speedCtx, speedCanvas.width / 2, speedCanvas.height / 2, 0, 300);
  
  return {
    /**
     * Update the speedometer with a new velocity value and target velocity
     * @param {number} velocity - Current velocity (0-1 range)
     * @param {number} maxSpeed - Maximum speed in knots (for graduations)
     * @param {number} targetVelocity - Target velocity (palier) in 0-1 range
     */
    update: (velocity, maxSpeed = 300, targetVelocity = null) => {
      drawSpeedometer(speedCtx, speedCanvas.width / 2, speedCanvas.height / 2, velocity, maxSpeed, targetVelocity);
    }
  };
}

let speedometerCanvas;
let ctx;

/**
 * Updates the speedometer based on velocity
 * @param {number} velocity - normalized speed value between 0 and 1
 * @param {number} maxSpeedValue - The maximum speed in knots (for speedometer graduation)
 */
function updateSpeedometer(velocity, maxSpeedValue) {
  if (!speedometerCanvas || !ctx) return;
  
  // Clear the canvas
  ctx.clearRect(0, 0, speedometerCanvas.width, speedometerCanvas.height);
  
  // Redraw the speedometer with updated velocity
  drawSpeedometer(ctx, speedometerCanvas.width / 2, speedometerCanvas.height / 2, velocity, maxSpeedValue);
}

/**
 * Draw the speedometer with the given velocity and target velocity
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} centerX - Center X of the speedometer
 * @param {number} centerY - Center Y of the speedometer
 * @param {number} velocity - normalized speed value between 0 and 1
 * @param {number} maxSpeedValue - The maximum speed in knots (for speedometer graduation)
 * @param {number} targetVelocity - Target velocity (palier) in 0-1 range
 */
function drawSpeedometer(ctx, centerX, centerY, velocity, maxSpeedValue, targetVelocity = null) {
  // Store the canvas for future reference
  speedometerCanvas = ctx.canvas;
  
  // IMPORTANT: Fully clear the entire canvas before redrawing
  ctx.clearRect(0, 0, speedometerCanvas.width, speedometerCanvas.height);
  
  // Center of the speedometer
  const radius = Math.min(centerX, centerY);
  
  // Draw the outer circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2);
  ctx.strokeStyle = '#0f0'; // Changed to match clock style
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Draw the gauge background with graduations
  const gaugeRadius = radius - 20;
  ctx.beginPath();
  ctx.arc(centerX, centerY, gaugeRadius, Math.PI * 0.75, Math.PI * 2.25);
  ctx.strokeStyle = 'rgba(0, 150, 0, 0.3)'; // Changed to match clock style
  ctx.lineWidth = 15;
  ctx.stroke();
  
  // Max speed (use provided or default to 300)
  const maxKnots = maxSpeedValue || 300;
  
  // Draw graduations
  for (let i = 0; i <= 10; i++) {
    const gradAngle = Math.PI * 0.75 + (Math.PI * 1.5) * (i / 10);
    const startX = centerX + Math.cos(gradAngle) * (gaugeRadius - 10);
    const startY = centerY + Math.sin(gradAngle) * (gaugeRadius - 10);
    const endX = centerX + Math.cos(gradAngle) * (gaugeRadius + 10);
    const endY = centerY + Math.sin(gradAngle) * (gaugeRadius + 10);
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = i % 5 === 0 ? '#0f0' : 'rgba(0, 255, 0, 0.6)'; // Changed to green
    ctx.lineWidth = i % 5 === 0 ? 3 : 1;
    ctx.stroke();
    
    // Add number labels for major graduations
    if (i % 2 === 0) {
      const labelX = centerX + Math.cos(gradAngle) * (gaugeRadius - 25);
      const labelY = centerY + Math.sin(gradAngle) * (gaugeRadius - 25);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#0f0'; // Changed to green
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Dynamic graduation based on max speed
      // Calculate label value as percentage of max speed with one decimal point
      const speedValue = ((i / 10) * maxKnots).toFixed(1);
      ctx.fillText(`${speedValue}`, labelX, labelY);
    }
  }
  
  // Draw the velocity gauge (from 0 to velocity)
  // Scale to 270 degrees (from PI*0.75 to PI*2.25)
  const angle = Math.PI * 0.75 + velocity * Math.PI * 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, gaugeRadius, Math.PI * 0.75, angle);
  
  // Gradient color from green (slow) to red (fast)
  let gaugeColor;
  if (velocity < 0.5) {
    gaugeColor = `rgba(0, ${Math.round(255 * (1 - velocity * 2))}, ${Math.round(255 * (1 - velocity))}, 0.8)`;
  } else {
    gaugeColor = `rgba(${Math.round(255 * (velocity - 0.5) * 2)}, ${Math.round(255 * (1 - velocity))}, 0, 0.8)`;
  }
  
  ctx.strokeStyle = gaugeColor;
  ctx.lineWidth = 15;
  ctx.stroke();
  
  // Draw the needle with shadow for better visibility
  const needleLength = radius - 25;
  const needleAngle = Math.PI * 0.75 + velocity * Math.PI * 1.5;
  const needleX = centerX + Math.cos(needleAngle) * needleLength;
  const needleY = centerY + Math.sin(needleAngle) * needleLength;
  
  // Shadow
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(needleX, needleY);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Actual needle
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(needleX, needleY);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw target velocity needle (palier) if provided
  if (targetVelocity !== null) {
    const targetNeedleLength = radius - 35; // Slightly shorter than main needle
    const targetNeedleAngle = Math.PI * 0.75 + targetVelocity * Math.PI * 1.5;
    const targetNeedleX = centerX + Math.cos(targetNeedleAngle) * targetNeedleLength;
    const targetNeedleY = centerY + Math.sin(targetNeedleAngle) * targetNeedleLength;
    
    // Shadow for target needle
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(targetNeedleX, targetNeedleY);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Target needle (orange)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(targetNeedleX, targetNeedleY);
    ctx.strokeStyle = '#ff7700'; // Orange for target velocity
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Small dot at the end of target needle
    ctx.beginPath();
    ctx.arc(targetNeedleX, targetNeedleY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ff7700';
    ctx.fill();
  }
  
  // Draw the center cap
  ctx.beginPath();
  ctx.arc(centerX, centerY, 12, 0, Math.PI * 2); // Larger center cap
  ctx.fillStyle = '#0f0'; // Changed to green to match clock
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Draw the velocity text - taille réduite pour mieux s'harmoniser avec l'horloge
  ctx.font = 'bold 18px monospace'; // Taille réduite (24 → 18)
  ctx.fillStyle = '#0f0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  
  // Display as absolute value (knots) with one decimal point
  // Convert normalized velocity (0-1) to nautical speed
  const velocityKnots = (velocity * maxKnots).toFixed(1);
  ctx.fillText(`${velocityKnots} kn`, centerX, centerY + 30); // Position ajustée pour la nouvelle taille
  
  // Display target velocity if provided
  if (targetVelocity !== null) {
    const targetKnots = (targetVelocity * maxKnots).toFixed(1);
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#ff7700'; // Orange to match target needle
    ctx.fillText(`Cible: ${targetKnots} kn`, centerX, centerY + 50);
  }
  
  // Draw smaller unit label
  ctx.font = '14px monospace'; // Taille réduite 
  ctx.fillStyle = '#0f0';
  ctx.fillText('SPEED', centerX, centerY + 70); // Position ajustée pour la nouvelle taille
}
