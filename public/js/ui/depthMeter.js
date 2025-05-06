// ui/depthMeter.js
// Depth meter UI component for GATO3D

// Pressure warning system variables
let timeBelow400 = 0;           // Time (in seconds) submarine has been below 400 units
let warningActive = false;      // Is pressure warning currently active
let blinkState = false;         // Current state of blinking (on/off)
let blinkInterval = null;       // Interval for blinking effect
let lastUpdateTime = 0;         // Last time the depth was updated (for time tracking)

// Constants
const PRESSURE_DEPTH_THRESHOLD = 400;  // Depth at which pressure warnings begin
const PRESSURE_TIME_THRESHOLD = 10;    // Time (seconds) before warnings activate

/**
 * Initialize the depth meter component
 * @returns {Object} - Interface to update the depth meter
 */
export function initDepthMeter() {
  const depthCanvas = document.getElementById('depth-meter-canvas');
  if (!depthCanvas) {
    console.error("[UI:DepthMeter] Depth meter canvas not found!");
    return null;
  }
  
  const depthCtx = depthCanvas.getContext('2d');
  
  // Initialize time tracking
  lastUpdateTime = Date.now();
  
  // Draw initial depth meter with 0 depth and max depth of 200m
  drawDepthMeter(depthCtx, depthCanvas.width / 2, depthCanvas.height / 2, 0, 200);
  
  return {
    /**
     * Update the depth meter with a new depth value
     * @param {number} depth - Current depth in meters
     * @param {number} maxDepth - Maximum depth in meters (for graduations)
     */
    update: (depth, maxDepth = 1000) => {
      // Update pressure warning system
      updatePressureWarning(depth);
      
      // Draw the depth meter
      drawDepthMeter(depthCtx, depthCanvas.width / 2, depthCanvas.height / 2, depth, maxDepth);
    }
  };
}

/**
 * Update the pressure warning system based on current depth
 * @param {number} depth - Current depth in meters
 */
function updatePressureWarning(depth) {
  const now = Date.now();
  const deltaTime = (now - lastUpdateTime) / 1000; // Convert to seconds
  lastUpdateTime = now;
  
  // Check if submarine is below the pressure threshold
  if (depth > PRESSURE_DEPTH_THRESHOLD) {
    // Accumulate time spent below threshold
    timeBelow400 += deltaTime;
    
    // Activate warning if threshold time exceeded
    if (timeBelow400 >= PRESSURE_TIME_THRESHOLD && !warningActive) {
      activatePressureWarning();
    }
  } else {
    // Reset the timer when above the threshold depth
    timeBelow400 = 0;
    
    // Deactivate warning if it was active
    if (warningActive) {
      deactivatePressureWarning();
    }
  }
}

/**
 * Activate the pressure warning system
 */
function activatePressureWarning() {
  warningActive = true;
  
  // Start blinking effect if not already active
  if (!blinkInterval) {
    blinkInterval = setInterval(() => {
      blinkState = !blinkState; // Toggle blink state
    }, 500); // Toggle every 500ms (twice per second)
  }
}

/**
 * Deactivate the pressure warning system
 */
function deactivatePressureWarning() {
  warningActive = false;
  blinkState = false;
  
  // Stop blinking effect
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }
}

// Global references
let depthMeterCanvas;
let ctx;

/**
 * Updates the depth meter based on current depth
 * @param {number} depth - Current depth in meters
 * @param {number} maxDepthValue - The maximum depth in meters (for depth meter graduation)
 */
function updateDepthMeter(depth, maxDepthValue) {
  if (!depthMeterCanvas || !ctx) return;
  
  // Clear the canvas
  ctx.clearRect(0, 0, depthMeterCanvas.width, depthMeterCanvas.height);
  
  // Redraw the depth meter with updated depth
  drawDepthMeter(ctx, depthMeterCanvas.width / 2, depthMeterCanvas.height / 2, depth, maxDepthValue);
}

/**
 * Draw the depth meter with the given depth
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} centerX - Center X of the depth meter
 * @param {number} centerY - Center Y of the depth meter
 * @param {number} depth - Current depth in meters
 * @param {number} maxDepthValue - The maximum depth in meters (for depth meter graduation)
 */
function drawDepthMeter(ctx, centerX, centerY, depth, maxDepthValue) {
  // Store the canvas for future reference
  depthMeterCanvas = ctx.canvas;
  
  // IMPORTANT: Fully clear the entire canvas before redrawing
  ctx.clearRect(0, 0, depthMeterCanvas.width, depthMeterCanvas.height);
  
  // Center of the depth meter
  const radius = Math.min(centerX, centerY);
  
  // Draw the outer circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2);
  ctx.strokeStyle = '#0ff'; // Couleur cyan pour distinction du speedometer
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Draw the gauge background with graduations
  const gaugeRadius = radius - 20;
  ctx.beginPath();
  ctx.arc(centerX, centerY, gaugeRadius, Math.PI * 0.75, Math.PI * 2.25);
  ctx.strokeStyle = 'rgba(0, 150, 255, 0.3)'; // Couleur cyan plus transparente
  ctx.lineWidth = 15;
  ctx.stroke();
  
  // Max depth (use provided or default to 200)
  const maxMeters = maxDepthValue || 200;
  
  // Calculate normalized depth (between 0 and 1)
  let normalizedDepth = Math.min(1, Math.max(0, depth / maxMeters));
  
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
    ctx.strokeStyle = i % 5 === 0 ? '#0ff' : 'rgba(0, 255, 255, 0.6)';
    ctx.lineWidth = i % 5 === 0 ? 3 : 1;
    ctx.stroke();
    
    // Add number labels for major graduations
    if (i % 2 === 0) {
      const labelX = centerX + Math.cos(gradAngle) * (gaugeRadius - 25);
      const labelY = centerY + Math.sin(gradAngle) * (gaugeRadius - 25);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#0ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Calculate label value based on percentage of max depth
      const depthValue = Math.round((i / 10) * maxMeters);
      ctx.fillText(`${depthValue}`, labelX, labelY);
    }
  }
  
  // Draw the depth gauge (from 0 to current depth)
  // Scale to 270 degrees (from PI*0.75 to PI*2.25)
  const angle = Math.PI * 0.75 + normalizedDepth * Math.PI * 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, gaugeRadius, Math.PI * 0.75, angle);
  
  // Gradient color from shallow (cyan) to deep (dark blue)
  let gaugeColor;
  if (normalizedDepth < 0.5) {
    // De cyan à bleu
    gaugeColor = `rgba(0, ${Math.round(255 * (1 - normalizedDepth * 2))}, 255, 0.8)`;
  } else {
    // De bleu à bleu foncé
    gaugeColor = `rgba(0, 0, ${Math.round(255 * (1 - (normalizedDepth - 0.5) * 0.8))}, 0.8)`;
  }
  
  ctx.strokeStyle = gaugeColor;
  ctx.lineWidth = 15;
  ctx.stroke();
  
  // Draw the needle
  const needleLength = radius - 25;
  const needleAngle = Math.PI * 0.75 + normalizedDepth * Math.PI * 1.5;
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
  
  // Draw the center cap
  ctx.beginPath();
  ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#0ff';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Draw the depth text
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#0ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  
  // Display the current depth in meters
  const depthText = Math.round(depth * 10) / 10; // Arrondi à 1 décimale
  ctx.fillText(`${depthText} m`, centerX, centerY + 30);
  
  // Draw smaller unit label
  ctx.font = '14px monospace';
  ctx.fillText('DEPTH', centerX, centerY + 55);
  
  // Draw pressure warning if active and in 'on' state of blinking
  if (warningActive && blinkState) {
    // Create red border around the depth meter
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 5;
    ctx.stroke();
    
    // Create a translucent floating panel above the depth meter
    const warningText = 'PRESSION CRITIQUE';
    ctx.font = 'bold 16px monospace';
    const textMetrics = ctx.measureText(warningText);
    const textWidth = textMetrics.width;
    const textHeight = 20; // Approximation
    
    // Position the panel above the depth meter
    const panelX = centerX - textWidth/2 - 10;
    const panelY = centerY - radius - 30; // Au-dessus de la jauge
    const panelWidth = textWidth + 20;
    const panelHeight = textHeight + 10;
    
    // Draw floating panel with 3D-like effect
    // Shadow first
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(panelX + 3, panelY + 3, panelWidth, panelHeight);
    
    // Main panel
    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Panel border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Add warning text with glow effect
    // Text shadow for glow
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(warningText, centerX, panelY + panelHeight/2);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
}
