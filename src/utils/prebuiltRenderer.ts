// Prebuilt Animations Procedural Renderer
// All coordinates are scaled appropriately based on the 'scale' parameter.

export const TINY_FONT: Record<string, number[]> = {
  ' ': [0x00, 0x00, 0x00],
  '!': [0x00, 0x1d, 0x00],
  '"': [0x03, 0x00, 0x03],
  '#': [0x0a, 0x1f, 0x0a],
  '$': [0x12, 0x1f, 0x09],
  '%': [0x13, 0x08, 0x19],
  '&': [0x0a, 0x15, 0x0a],
  '\'': [0x00, 0x03, 0x00],
  '(': [0x00, 0x0e, 0x11],
  ')': [0x11, 0x0e, 0x00],
  '*': [0x0a, 0x04, 0x0a],
  '+': [0x04, 0x0e, 0x04],
  ',': [0x00, 0x10, 0x08],
  '-': [0x04, 0x04, 0x04],
  '.': [0x00, 0x10, 0x00],
  '/': [0x10, 0x08, 0x04],
  '0': [0x1f, 0x11, 0x1f],
  '1': [0x00, 0x1f, 0x00],
  '2': [0x1d, 0x15, 0x17],
  '3': [0x15, 0x15, 0x1f],
  '4': [0x07, 0x04, 0x1f],
  '5': [0x17, 0x15, 0x1d],
  '6': [0x1f, 0x15, 0x1d],
  '7': [0x01, 0x01, 0x1f],
  '8': [0x1f, 0x15, 0x1f],
  '9': [0x17, 0x15, 0x1f],
  ':': [0x00, 0x0a, 0x00],
  ';': [0x00, 0x1a, 0x08],
  '<': [0x04, 0x0a, 0x11],
  '=': [0x0a, 0x0a, 0x0a],
  '>': [0x11, 0x0a, 0x04],
  '?': [0x01, 0x15, 0x02],
  '@': [0x0e, 0x15, 0x0d],
  'A': [0x1e, 0x05, 0x1e],
  'B': [0x1f, 0x15, 0x0a],
  'C': [0x0e, 0x11, 0x11],
  'D': [0x1f, 0x11, 0x0e],
  'E': [0x1f, 0x15, 0x11],
  'F': [0x1f, 0x05, 0x01],
  'G': [0x0e, 0x15, 0x1d],
  'H': [0x1f, 0x04, 0x1f],
  'I': [0x11, 0x1f, 0x11],
  'J': [0x08, 0x10, 0x0f],
  'K': [0x1f, 0x04, 0x1b],
  'L': [0x1f, 0x10, 0x10],
  'M': [0x1f, 0x02, 0x1f],
  'N': [0x1f, 0x06, 0x1f],
  'O': [0x0e, 0x11, 0x0e],
  'P': [0x1f, 0x05, 0x02],
  'Q': [0x0e, 0x11, 0x1e],
  'R': [0x1f, 0x05, 0x1a],
  'S': [0x12, 0x15, 0x09],
  'T': [0x01, 0x1f, 0x01],
  'U': [0x0f, 0x10, 0x0f],
  'V': [0x07, 0x18, 0x07],
  'W': [0x1f, 0x08, 0x1f],
  'X': [0x1b, 0x04, 0x1b],
  'Y': [0x03, 0x1c, 0x03],
  'Z': [0x19, 0x15, 0x13],
  '°': [0x03, 0x03, 0x00]
};

export const drawPrebuiltEffect = (
  effectId: string,
  ctx: CanvasRenderingContext2D,
  x: number, // Bounding box x (unscaled coordinates)
  y: number, // Bounding box y (unscaled coordinates)
  width: number, // Widget width (unscaled)
  height: number, // Widget height (unscaled)
  scale: number, // Scale factor (1 for low-res, 10 for preview)
  tick: number, // Animation frame counter
  stateCache: Record<string, any>
) => {
  // Setup persistent states if not initialized
  if (!stateCache[effectId]) {
    stateCache[effectId] = {};
  }
  const state = stateCache[effectId];

  // Helper function to plot a single virtual pixel of size scale x scale
  const plotPixel = (px: number, py: number, fillStyle: string) => {
    if (px >= 0 && px < width && py >= 0 && py < height) {
      ctx.fillStyle = fillStyle;
      ctx.fillRect((x + px) * scale, (y + py) * scale, scale, scale);
    }
  };

  // ==================== 1. Cosmic & Space ====================
  if (effectId === 'supernova') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    const cx = width / 2;
    const cy = height / 2;
    const cycle = tick % 120;

    if (cycle < 40) {
      const starSize = 1.5 + Math.sin(cycle * 0.2) * 1.0;
      for (let px = 0; px < width; px++) {
        for (let py = 0; py < height; py++) {
          const dx = px - cx;
          const dy = py - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < starSize) {
            plotPixel(px, py, '#ffffff');
          } else if (dist < starSize * 2.0) {
            const opacity = 1.0 - (dist - starSize) / starSize;
            ctx.globalAlpha = opacity * 0.6;
            plotPixel(px, py, '#f97316');
            ctx.globalAlpha = 1.0;
          }
        }
      }
    } else if (cycle < 90) {
      const expTime = cycle - 40;
      const radius = expTime * 0.8;
      const opacity = Math.max(0, 1.0 - expTime / 50.0);
      ctx.globalAlpha = opacity;

      for (let theta = 0; theta < Math.PI * 2.0; theta += 0.1) {
        const px = Math.round(cx + Math.cos(theta) * radius);
        const py = Math.round(cy + Math.sin(theta) * radius);
        const hue = (expTime * 4 + theta * 10) % 360;
        plotPixel(px, py, `hsl(${hue}, 100%, 60%)`);
      }

      if (radius > 5.0) {
        const rad2 = radius - 5.0;
        for (let theta = 0; theta < Math.PI * 2.0; theta += 0.2) {
          const px = Math.round(cx + Math.cos(theta) * rad2);
          const py = Math.round(cy + Math.sin(theta) * rad2);
          plotPixel(px, py, '#ef4444');
        }
      }
      ctx.globalAlpha = 1.0;
    } else {
      const impTime = cycle - 90;
      const strength = (30.0 - impTime) / 30.0;
      
      for (let px = 0; px < width; px++) {
        for (let py = 0; py < height; py++) {
          const dx = px - cx;
          const dy = py - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1.0) {
            const ringVal = Math.sin(dist * 0.8 - tick * 0.2);
            if (Math.abs(ringVal) > 0.85) {
              ctx.globalAlpha = strength * 0.5;
              plotPixel(px, py, `rgba(99, 102, 241, ${strength})`);
              ctx.globalAlpha = 1.0;
            }
          } else {
            plotPixel(px, py, '#000000');
          }
        }
      }
    }
  }

  else if (effectId === 'pulsar') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    const cx = width / 2;
    const cy = height / 2;
    const angle = tick * 0.05;

    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pAngle = Math.atan2(dy, dx);

        let jetIntensity = 0;
        const diff1 = Math.abs((pAngle - angle) % Math.PI);
        const diff2 = Math.abs((pAngle - angle - Math.PI) % Math.PI);
        const minDiff = Math.min(diff1, diff2);

        if (minDiff < 0.12) {
          jetIntensity = (1.0 - minDiff / 0.12) * (1.0 - dist / 50.0);
        }

        const loopRad = Math.sin(dist * 0.6 - tick * 0.15);
        let loopGlow = 0;
        if (Math.abs(loopRad) > 0.9) {
          loopGlow = (1.0 - dist / 30.0) * 0.4;
        }

        if (jetIntensity > 0.05) {
          const jetVal = Math.floor(jetIntensity * 255);
          plotPixel(px, py, `rgb(${jetVal}, ${Math.floor(jetVal * 0.9)}, 255)`);
        } else if (loopGlow > 0.05) {
          ctx.globalAlpha = loopGlow;
          plotPixel(px, py, '#3b82f6');
          ctx.globalAlpha = 1.0;
        }

        if (dist < 2.0) {
          plotPixel(px, py, '#ffffff');
        }
      }
    }
  }

  // ==================== 2. Nature, Weather & Landscapes ====================
  else if (effectId === 'sunrise') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    const bgX = state.bgX !== undefined ? state.bgX : 10;
    const bgY = state.bgY !== undefined ? state.bgY : 8;
    const cx = bgX;
    const cy = (height + 5) - ((tick * 0.15) % (height + 10)) + (bgY - 8);
    const r = 5;

    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < r) {
          plotPixel(px, py, '#facc15'); // Golden yellow sun
        } else if (dist < r + 6) {
          const intensity = 1.0 - (dist - r) / 6.0;
          ctx.globalAlpha = intensity * 0.8;
          const red = 255;
          const green = Math.floor(100 + intensity * 100);
          plotPixel(px, py, `rgb(${red}, ${green}, 0)`);
          ctx.globalAlpha = 1.0;
        }
      }
    }
  }

  else if (effectId === 'sunset') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    const bgX = state.bgX !== undefined ? state.bgX : 10;
    const bgY = state.bgY !== undefined ? state.bgY : 8;
    const cx = bgX;
    const cy = ((tick * 0.15) % (height + 10)) - 5 + (bgY - 8);
    const r = 5;

    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < r) {
          plotPixel(px, py, '#ea580c'); // Deep orange sun
        } else if (dist < r + 7) {
          const intensity = 1.0 - (dist - r) / 7.0;
          ctx.globalAlpha = intensity * 0.75;
          const red = Math.floor(180 + intensity * 75);
          const blue = Math.floor(50 + intensity * 100);
          plotPixel(px, py, `rgb(${red}, 0, ${blue})`);
          ctx.globalAlpha = 1.0;
        }
      }
    }
  }

  else if (effectId === 'afternoon') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    const bgX = state.bgX !== undefined ? state.bgX : 10;
    const bgY = state.bgY !== undefined ? state.bgY : 8;
    const cx = bgX;
    const cy = bgY;
    const pulse = Math.sin(tick * 0.1) * 0.5;
    const r = 5 + pulse;

    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < r) {
          plotPixel(px, py, '#facc15'); // Golden yellow sun
        } else if (dist < r + 6) {
          const intensity = 1.0 - (dist - r) / 6.0;
          ctx.globalAlpha = intensity * 0.8;
          const red = 255;
          const green = Math.floor(100 + intensity * 100);
          plotPixel(px, py, `rgb(${red}, ${green}, 0)`);
          ctx.globalAlpha = 1.0;
        }
      }
    }
  }

  else if (effectId === 'night') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    const bgX = state.bgX !== undefined ? state.bgX : 10;
    const bgY = state.bgY !== undefined ? state.bgY : 8;
    const cx = bgX;
    const cy = (height + 5) - ((tick * 0.15) % (height + 10)) + (bgY - 8);
    const r = 5;

    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < r) {
          plotPixel(px, py, '#ffffff'); // White moon
        } else if (dist < r + 6) {
          const intensity = 1.0 - (dist - r) / 6.0;
          ctx.globalAlpha = intensity * 0.8;
          const red = Math.floor(50 + intensity * 100);
          const green = Math.floor(100 + intensity * 100);
          plotPixel(px, py, `rgb(${red}, ${green}, 255)`);
          ctx.globalAlpha = 1.0;
        }
      }
    }
  }

  else if (effectId === 'beach') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    const sandY = height - 2;

    for (let px = 0; px < width; px++) {
      const waveY = (height - 3) + Math.sin(px * 0.12 + tick * 0.08) * 2.0 + Math.cos(tick * 0.04) * 1.5;

      for (let py = 0; py < height; py++) {
        if (py >= waveY) {
          if (Math.abs(py - waveY) < 1.0) {
            plotPixel(px, py, '#ffffff'); // Foam
          } else {
            plotPixel(px, py, '#0284c7'); // Blue water
          }
        } else if (py >= sandY) {
          plotPixel(px, py, '#d97706'); // Sand
        }
      }
    }
  }

  else if (effectId === 'tsunami') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    const waveX = (tick * 0.6) % (width + 30) - 15;

    for (let px = 0; px < width; px++) {
      const dx = px - waveX;
      const crest = Math.max(0, 13 * Math.exp(-(dx * dx) / 64));
      const waveY = height - crest;

      for (let py = 0; py < height; py++) {
        if (py >= waveY) {
          if (py < waveY + 1.2) {
            plotPixel(px, py, '#ffffff'); // Foam crest
          } else {
            const depth = py - waveY;
            const green = Math.min(150, Math.floor(50 + depth * 15));
            plotPixel(px, py, `rgb(15, ${green}, 140)`);
          }
        }
      }
    }
  }

  else if (effectId === 'drippingrain') {
    if (!state.drops) {
      state.drops = Array.from({ length: 20 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height - height,
        speed: 0.7 + Math.random() * 0.7
      }));
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    state.drops.forEach((d: any) => {
      d.y += d.speed;
      if (d.y >= height) {
        d.y = -Math.random() * 6;
        d.x = Math.random() * width;
        d.speed = 0.7 + Math.random() * 0.7;
      }

      const dx = Math.floor(d.x);
      const dy = Math.floor(d.y);

      if (dy >= 0 && dy < height) {
        plotPixel(dx, dy, '#38bdf8');
        if (dy > 0) {
          ctx.globalAlpha = 0.4;
          plotPixel(dx, dy - 1, '#38bdf8');
          ctx.globalAlpha = 1.0;
        }

        if (dy >= height - 1) {
          ctx.globalAlpha = 0.6;
          plotPixel(dx - 1, height - 1, '#7dd3fc');
          plotPixel(dx + 1, height - 1, '#7dd3fc');
          ctx.globalAlpha = 1.0;
        }
      }
    });
  }

  else if (effectId === 'tornado') {
    if (!state.debris) {
      state.debris = Array.from({ length: 10 }, () => ({
        angle: Math.random() * Math.PI * 2,
        r: 2 + Math.random() * 7
      }));
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    const centerX = width / 2 + Math.sin(tick * 0.04) * 15;

    for (let py = 0; py < height; py++) {
      const funnelX = centerX + Math.sin(tick * 0.1 + py * 0.2) * 2.0;
      const radius = 1.0 + (1.0 - py / height) * 4.5;

      for (let a = 0; a < 3; a++) {
        const angle = tick * 0.2 + py * 0.35 + (a * Math.PI * 2) / 3;
        const px = Math.round(funnelX + Math.cos(angle) * radius);
        const depth = Math.sin(angle);

        if (depth > -0.3) {
          const color = depth > 0.4 ? '#ffffff' : '#6b7280';
          plotPixel(px, py, color);
        }
      }
    }

    state.debris.forEach((d: any) => {
      d.angle += 0.18;
      d.r += 0.08;
      if (d.r > 10) {
        d.r = 2;
        d.angle = Math.random() * Math.PI * 2;
      }
      const px = Math.round(centerX + Math.cos(d.angle) * d.r);
      const py = Math.round(height - 1 - (Math.random() * 2));
      plotPixel(px, py, '#d97706');
    });
  }

  // ==================== 3. Fluid & Plasma Waves ====================
  else if (effectId === 'plasma') {
    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const v1 = Math.sin(px * 0.12 + tick * 0.08);
        const v2 = Math.sin(py * 0.18 + tick * 0.06);
        const v3 = Math.sin((px + py) * 0.1 + tick * 0.05);
        const r = Math.sqrt((px - width / 2) ** 2 + (py - height / 2) ** 2);
        const v4 = Math.sin(r * 0.12 - tick * 0.04);
        const waveSum = (v1 + v2 + v3 + v4) / 4;
        const hue = Math.floor(((waveSum + 1.0) * 180 + tick * 1.5) % 360);
        plotPixel(px, py, `hsl(${hue}, 100%, 45%)`);
      }
    }
  }

  else if (effectId === 'aurora') {
    if (!state.stars) {
      state.stars = Array.from({ length: 12 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        brightness: Math.random()
      }));
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    state.stars.forEach((star: any) => {
      const alpha = 0.2 + 0.8 * Math.abs(Math.sin(tick * 0.03 + star.brightness * 10));
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect((x + star.x) * scale, (y + star.y) * scale, scale, scale);
    });

    for (let px = 0; px < width; px++) {
      const waveVal1 = Math.sin(px * 0.08 + tick * 0.035) * 3.5;
      const waveVal2 = Math.cos(px * 0.14 - tick * 0.015) * 1.5;
      const waveY = (height / 2) + waveVal1 + waveVal2;

      for (let py = 0; py < height; py++) {
        const dist = Math.abs(py - waveY);
        if (dist < 6) {
          const intensity = 1.0 - (dist / 6);
          const hue = py < waveY 
            ? Math.floor((120 + dist * 15) % 360) 
            : Math.floor((270 - dist * 10) % 360);

          ctx.globalAlpha = intensity * 0.8;
          plotPixel(px, py, `hsl(${hue}, 100%, 50%)`);
          ctx.globalAlpha = 1.0;
        }
      }
    }
  }

  else if (effectId === 'rainbowwaves') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const wave = Math.sin(px * 0.15 + tick * 0.08) * Math.cos(py * 0.25 - tick * 0.05);
        const hue = Math.floor((wave * 180 + tick * 2) % 360);
        plotPixel(px, py, `hsl(${hue}, 100%, 50%)`);
      }
    }
  }

  else if (effectId === 'wavefront') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    const time = tick * 0.04;
    const x1 = width/2 + Math.sin(time) * 16;
    const y1 = height/2 + Math.cos(time * 0.8) * 5;
    const x2 = width/2 + Math.cos(time * 1.2) * 20;
    const y2 = height/2 + Math.sin(time * 0.5) * 4;
    
    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const d1 = Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        const d2 = Math.sqrt((px - x2) * (px - x2) + (py - y2) * (py - y2));
        
        const val1 = Math.sin(d1 * 0.8 - tick * 0.12);
        const val2 = Math.sin(d2 * 0.6 - tick * 0.08);
        const intensity = (val1 + val2) / 2;
        
        if (intensity > 0.4) {
          const hue = Math.floor(((px + py) * 2 + tick) % 360);
          plotPixel(px, py, `hsl(${hue}, 100%, ${Math.floor(intensity * 100)}%)`);
        }
      }
    }
  }

  else if (effectId === 'watercells') {
    if (!state.cells) {
      state.cells = [
        { x: 15, y: 5, vx: 0.15, vy: 0.1 },
        { x: 45, y: 10, vx: -0.1, vy: 0.12 },
        { x: 65, y: 6, vx: 0.12, vy: -0.08 }
      ];
    }
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    
    state.cells.forEach((c: any) => {
      c.x += c.vx;
      c.y += c.vy;
      if (c.x < 5 || c.x >= width - 5) c.vx *= -1;
      if (c.y < 2 || c.y >= height - 2) c.vy *= -1;
    });
    
    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        let minDist = 9999;
        state.cells.forEach((c: any) => {
          const dist = (px - c.x) * (px - c.x) + (py - c.y) * (py - c.y);
          if (dist < minDist) {
            minDist = dist;
          }
        });
        const cellVal = Math.sin(Math.sqrt(minDist) * 1.5 - tick * 0.15);
        if (cellVal > 0.6) {
          plotPixel(px, py, '#06b6d4');
        }
      }
    }
  }

  else if (effectId === 'waterfall') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const flow = Math.sin(py * 0.35 - tick * 0.18) * Math.cos(px * 0.12 + tick * 0.04);
        if (flow > 0.65) {
          const opacity = (flow - 0.65) / 0.35;
          ctx.globalAlpha = opacity * 0.5;
          plotPixel(px, py, '#0284c7');
          ctx.globalAlpha = 1.0;
        }
      }
    }

    for (let px = 0; px < width; px++) {
      const splashHeight = Math.abs(Math.sin(px * 0.3 + tick * 0.25)) * 3.5;
      for (let sy = 0; sy < splashHeight; sy++) {
        const py = height - 1 - sy;
        const opacity = 1.0 - sy / 4.0;
        ctx.globalAlpha = opacity;
        plotPixel(px, py, '#e0f2fe');
        ctx.globalAlpha = 1.0;
      }
    }
  }

  // ==================== 4. Fractals & Math Curves ====================
  else if (effectId === 'attractor3d') {
    if (!state.pt) {
      state.pt = { x: 0.1, y: 0.1, z: 0.1 };
      state.history = [];
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    const dt = 0.06;
    const a = 0.2;
    const b = 0.2;
    const c = 5.7;

    const dx = (-state.pt.y - state.pt.z) * dt;
    const dy = (state.pt.x + a * state.pt.y) * dt;
    const dz = (b + state.pt.z * (state.pt.x - c)) * dt;

    state.pt.x += dx;
    state.pt.y += dy;
    state.pt.z += dz;

    const projX = Math.round(width / 2 + state.pt.x * 2.2);
    const projY = Math.round(height / 2 + (state.pt.y) * 0.4);

    state.history.unshift({ x: projX, y: projY });
    if (state.history.length > 30) {
      state.history.pop();
    }

    if (Math.abs(state.pt.x) > 40 || Math.abs(state.pt.y) > 40) {
      state.pt = { x: 0.1, y: 0.1, z: 0.1 };
      state.history = [];
    }

    state.history.forEach((h: any, i: number) => {
      const opacity = 1.0 - i / 30.0;
      const hue = Math.floor((tick + i * 5) % 360);
      ctx.globalAlpha = opacity;
      plotPixel(h.x, h.y, `hsl(${hue}, 100%, 55%)`);
    });
    ctx.globalAlpha = 1.0;
  }

  else if (effectId === 'lissajous3d') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    const cx = width / 2;
    const cy = height / 2;
    const thetaY = tick * 0.02;
    const thetaZ = tick * 0.03;

    const step = 0.08;
    for (let t = 0; t < 80; t++) {
      const x3d = Math.sin(2.0 * t * step) * 26;
      const y3d = Math.cos(3.0 * t * step) * 6;
      const z3d = Math.sin(5.0 * t * step) * 10;

      const cosY = Math.cos(thetaY);
      const sinY = Math.sin(thetaY);
      let rx = x3d * cosY + z3d * sinY;
      let rz = -x3d * sinY + z3d * cosY;

      const cosZ = Math.cos(thetaZ);
      const sinZ = Math.sin(thetaZ);
      const ry = y3d * cosZ - rx * sinZ;
      rx = y3d * sinZ + rx * cosZ;

      const px = Math.round(cx + rx);
      const py = Math.round(cy + ry);

      const intensity = 0.4 + ((rz + 10) / 20.0) * 0.6;
      const hue = (t * 4 + tick) % 360;
      ctx.globalAlpha = intensity;
      plotPixel(px, py, `hsl(${hue}, 100%, 55%)`);
      ctx.globalAlpha = 1.0;
    }
  }

  else if (effectId === 'kaleidoscope') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    const cx = width / 2;
    const cy = height / 2;
    
    const time = tick * 0.05;
    const targetX = cx + Math.sin(time) * 12;
    const targetY = cy + Math.cos(time * 0.7) * 4;
    
    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        let dx = Math.abs(px - cx);
        let dy = Math.abs(py - cy);
        if (dx < dy) {
          const tmp = dx;
          dx = dy;
          dy = tmp;
        }
        const tx = Math.abs(targetX - cx);
        const ty = Math.abs(targetY - cy);
        const dist = Math.sqrt((dx - tx) * (dx - tx) + (dy - ty) * (dy - ty));
        const val = Math.sin(dist * 0.6 - tick * 0.1);
        if (val > 0.5) {
          const hue = Math.floor((dist * 10 + tick * 2) % 360);
          plotPixel(px, py, `hsl(${hue}, 100%, 50%)`);
        }
      }
    }
  }

  else if (effectId === 'vortex') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    const cx = width / 2;
    const cy = height / 2;
    
    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const dx = px - cx;
        const dy = py - cy;
        const r = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const vortexVal = Math.sin(angle * 4.0 - r * 0.6 + tick * 0.15);
        if (vortexVal > 0.25) {
          const intensity = Math.max(0, 1.0 - r / 30.0);
          const hue = Math.floor((r * 12 - tick * 1.5) % 360);
          plotPixel(px, py, `hsla(${hue}, 100%, 50%, ${intensity})`);
        }
      }
    }
  }

  else if (effectId === 'spiral') {
    const cx = width / 2;
    const cy = height / 2;
    const numArms = 3;

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const dx = px - cx;
        const dy = py - cy;
        const r = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const spiralVal = Math.sin(numArms * angle - r * 0.35 + tick * 0.12);
        
        if (spiralVal > 0) {
          const hue = Math.floor(((angle + Math.PI) * (180 / Math.PI) + tick * 3.5) % 360);
          const intensity = Math.floor(spiralVal * 50) + 50;
          plotPixel(px, py, `hsl(${hue}, 100%, ${intensity}%)`);
        }
      }
    }
  }

  // ==================== 5. Particles & Physics ====================
  else if (effectId === 'particles') {
    if (!state.particles) {
      state.particles = Array.from({ length: 30 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        hue: Math.floor(Math.random() * 360)
      }));
    }
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    
    const time = tick * 0.04;
    const gx = width/2 + Math.sin(time) * 20;
    const gy = height/2 + Math.cos(time * 1.5) * 5;
    
    plotPixel(Math.round(gx), Math.round(gy), '#ffffff');
    
    state.particles.forEach((p: any) => {
      const dx = gx - p.x;
      const dy = gy - p.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      
      if (dist > 1.0) {
        p.vx += (dx / dist) * (0.85 / distSq);
        p.vy += (dy / dist) * (0.85 / distSq);
      }
      
      p.x += p.vx;
      p.y += p.vy;
      
      p.vx *= 0.98;
      p.vy *= 0.98;
      
      if (p.x < 0) { p.x = 0; p.vx *= -1; }
      if (p.x >= width) { p.x = width - 1; p.vx *= -1; }
      if (p.y < 0) { p.y = 0; p.vy *= -1; }
      if (p.y >= height) { p.y = height - 1; p.vy *= -1; }
      
      plotPixel(Math.floor(p.x), Math.floor(p.y), `hsl(${p.hue}, 100%, 55%)`);
    });
  }

  else if (effectId === 'noiseflow') {
    if (!state.particles) {
      state.particles = Array.from({ length: 45 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.4 + Math.random() * 0.4,
        hue: Math.floor(Math.random() * 360)
      }));
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    
    state.particles.forEach((p: any) => {
      const angle = Math.sin(p.x * 0.08) * Math.cos(p.y * 0.15) * Math.PI * 2 + tick * 0.03;
      p.x += Math.cos(angle) * p.speed;
      p.y += Math.sin(angle) * p.speed;
      
      if (p.x < 0 || p.x >= width || p.y < 0 || p.y >= height) {
        p.x = Math.random() * width;
        p.y = Math.random() * height;
      }
      plotPixel(Math.floor(p.x), Math.floor(p.y), `hsl(${p.hue}, 100%, 55%)`);
    });
  }

  else if (effectId === 'stars') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    for (let i = 0; i < 15; i++) {
      const seed = i * 73 + 19;
      const px = seed % width;
      const py = Math.floor(seed / width) % height;
      const twinkle = Math.abs(Math.sin(tick * 0.1 + i));
      if (twinkle > 0.4) {
        plotPixel(px, py, `rgba(253, 224, 71, ${twinkle})`);
      }
    }
  }

  else if (effectId === 'hyperspace') {
    if (!state.stars) {
      state.stars = Array.from({ length: 32 }, () => ({
        x: (Math.random() - 0.5) * 40,
        y: (Math.random() - 0.5) * 16,
        z: 1.0 + Math.random() * 15,
        hue: Math.floor(Math.random() * 360)
      }));
    }
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    
    const cx = width / 2;
    const cy = height / 2;
    
    state.stars.forEach((s: any) => {
      s.z -= 0.18;
      if (s.z <= 0.1) {
        s.x = (Math.random() - 0.5) * 40;
        s.y = (Math.random() - 0.5) * 16;
        s.z = 15.0;
      }
      
      const k = 15.0 / s.z;
      const px = Math.round(cx + s.x * k);
      const py = Math.round(cy + s.y * k);
      
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const brightness = Math.min(255, Math.floor((1.0 - s.z / 15.0) * 255));
        plotPixel(px, py, `rgb(${brightness}, ${brightness}, 255)`);
      }
    });
  }

  else if (effectId === 'fireflies') {
    if (!state.flies) {
      state.flies = Array.from({ length: 12 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        angle: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2
      }));
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    state.flies.forEach((f: any) => {
      f.x += Math.cos(f.angle) * f.speed;
      f.y += Math.sin(f.angle) * f.speed;
      f.angle += (Math.random() - 0.5) * 0.35;

      if (f.x < 0) { f.x = 0; f.angle = Math.PI - f.angle; }
      if (f.x >= width) { f.x = width - 1; f.angle = Math.PI - f.angle; }
      if (f.y < 0) { f.y = 0; f.angle = -f.angle; }
      if (f.y >= height) { f.y = height - 1; f.angle = -f.angle; }

      const glow = Math.abs(Math.sin(tick * 0.05 + f.phase));
      const flyX = Math.floor(f.x);
      const flyY = Math.floor(f.y);

      ctx.globalAlpha = glow * 0.4;
      plotPixel(flyX - 1, flyY, '#a3e635');
      plotPixel(flyX + 1, flyY, '#a3e635');
      plotPixel(flyX, flyY - 1, '#a3e635');
      plotPixel(flyX, flyY + 1, '#a3e635');
      
      ctx.globalAlpha = 1.0;
      plotPixel(flyX, flyY, '#ffffff');
    });
  }

  else if (effectId === 'bounceballs') {
    if (!state.balls) {
      state.balls = [
        { x: 10, y: 4, vx: 0.45, vy: 0.35, color: '#f43f5e', radius: 1.2, trail: [] },
        { x: 30, y: 8, vx: -0.35, vy: 0.55, color: '#06b6d4', radius: 1.5, trail: [] },
        { x: 60, y: 5, vx: 0.55, vy: -0.45, color: '#10b981', radius: 1.0, trail: [] }
      ];
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    state.balls.forEach((b: any) => {
      b.trail.unshift({ x: b.x, y: b.y });
      if (b.trail.length > 6) b.trail.pop();

      b.x += b.vx;
      b.y += b.vy;

      if (b.x - b.radius < 0) { b.x = b.radius; b.vx *= -1; }
      if (b.x + b.radius >= width) { b.x = width - b.radius; b.vx *= -1; }
      if (b.y - b.radius < 0) { b.y = b.radius; b.vy *= -1; }
      if (b.y + b.radius >= height) { b.y = height - b.radius; b.vy *= -1; }

      b.trail.forEach((t: any, index: number) => {
        const opacity = (1 - (index / b.trail.length)) * 0.45;
        const trailR = b.radius * (1 - (index / b.trail.length) * 0.5);
        ctx.globalAlpha = opacity;
        const tx = Math.floor(t.x);
        const ty = Math.floor(t.y);
        for (let sx = -2; sx <= 2; sx++) {
          for (let sy = -2; sy <= 2; sy++) {
            if (sx * sx + sy * sy <= trailR * trailR) {
              plotPixel(tx + sx, ty + sy, b.color);
            }
          }
        }
        ctx.globalAlpha = 1.0;
      });

      const bx = Math.floor(b.x);
      const by = Math.floor(b.y);
      for (let sx = -2; sx <= 2; sx++) {
        for (let sy = -2; sy <= 2; sy++) {
          if (sx * sx + sy * sy <= b.radius * b.radius) {
            plotPixel(bx + sx, by + sy, '#ffffff');
          }
        }
      }
      for (let sx = -2; sx <= 2; sx++) {
        for (let sy = -2; sy <= 2; sy++) {
          const distSq = sx * sx + sy * sy;
          if (distSq <= b.radius * b.radius && distSq > (b.radius - 0.7) * (b.radius - 0.7)) {
            plotPixel(bx + sx, by + sy, b.color);
          }
        }
      }
    });
  }

  else if (effectId === 'sparks') {
    if (!state.sparks) {
      state.sparks = Array.from({ length: 25 }, () => ({
        x: width / 2,
        y: height / 2,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.4,
        life: Math.random() * 20 + 5,
        maxLife: 25,
        hue: Math.floor(Math.random() * 360)
      }));
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    const cx = width / 2;
    const cy = height / 2;

    state.sparks.forEach((p: any) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.life--;

      if (p.life <= 0 || p.x < 0 || p.x >= width || p.y < 0 || p.y >= height) {
        p.x = cx;
        p.y = cy;
        p.vx = (Math.random() - 0.5) * 1.5;
        p.vy = (Math.random() - 0.5) * 1.5 - 0.4;
        p.life = Math.random() * 20 + 5;
        p.maxLife = 25;
        p.hue = Math.floor(Math.random() * 360);
      }

      const opacity = p.life / p.maxLife;
      ctx.globalAlpha = opacity;
      plotPixel(Math.floor(p.x), Math.floor(p.y), `hsl(${p.hue}, 100%, 65%)`);
      ctx.globalAlpha = 1.0;
    });
  }

  // ==================== 6. Helixes & 3D Structures ====================
  else if (effectId === 'dnahelix') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    for (let px = 2; px < width - 2; px += 3) {
      const offset = px * 0.16 + tick * 0.08;
      const waveA = Math.sin(offset) * 5.0;
      const waveB = -Math.sin(offset) * 5.0;

      const yA = Math.round(height/2 + waveA);
      const yB = Math.round(height/2 + waveB);

      const cosVal = Math.cos(offset);
      if (cosVal > -0.2) {
        const startY = Math.min(yA, yB);
        const endY = Math.max(yA, yB);
        for (let py = startY; py <= endY; py++) {
          plotPixel(px, py, '#4b5563');
        }
      }

      if (cosVal >= 0) {
        plotPixel(px, yA, '#06b6d4');
        plotPixel(px, yB, '#b91c1c');
      } else {
        plotPixel(px, yA, '#0891b2');
        plotPixel(px, yB, '#f43f5e');
      }
    }
  }

  else if (effectId === 'dna3d') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    const cy = height / 2;
    
    for (let px = 4; px < width - 4; px += 2) {
      const angle = px * 0.18 + tick * 0.1;
      const cosVal = Math.cos(angle);
      const sinVal = Math.sin(angle);
      
      const yA = Math.round(cy + sinVal * 6);
      const yB = Math.round(cy - sinVal * 6);
      
      if (cosVal > -0.3) {
        const startY = Math.min(yA, yB);
        const endY = Math.max(yA, yB);
        for (let py = startY; py <= endY; py++) {
          plotPixel(px, py, '#374151');
        }
      }
      
      if (cosVal >= 0) {
        plotPixel(px, yA, '#06b6d4');
        plotPixel(px, yB, '#991b1b');
      } else {
        plotPixel(px, yA, '#0891b2');
        plotPixel(px, yB, '#ef4444');
      }
    }
  }

  else if (effectId === 'tunnel') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    const cx = width / 2;
    const cy = height / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);
    
    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const tunnelVal = Math.sin(dist * 0.4 - tick * 0.15);
        if (tunnelVal > 0.6) {
          const opacity = (dist / maxDist);
          const hue = Math.floor((dist * 8 + tick) % 360);
          plotPixel(px, py, `hsla(${hue}, 100%, 50%, ${opacity})`);
        }
      }
    }
  }

  // ==================== 7. Fire, Heat & Explosions ====================
  else if (effectId === 'firefastled') {
    if (!state.heat || state.heat.length !== width * height) {
      state.heat = new Uint8Array(width * height);
    }

    const heat = state.heat;
    const COOLING = 55;
    const SPARKING = 120;

    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const idx = i * height + j;
        const cooldown = Math.floor(Math.random() * (((COOLING * 10) / height) + 2));
        heat[idx] = Math.max(0, heat[idx] - cooldown);
      }
    }

    for (let i = 0; i < width; i++) {
      for (let j = height - 1; j >= 2; j--) {
        const idx = i * height + j;
        heat[idx] = Math.floor((heat[idx - 1] + heat[idx - 2] + heat[idx - 2]) / 3);
      }
    }

    for (let i = 0; i < width; i++) {
      if (Math.random() * 255 < SPARKING) {
        const sy = Math.floor(Math.random() * Math.min(3, height));
        const idx = i * height + sy;
        heat[idx] = Math.min(255, heat[idx] + (160 + Math.floor(Math.random() * 95)));
      }
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const hVal = heat[px * height + py];
        if (hVal > 15) {
          let color = '#000000';
          if (hVal < 85) {
            color = `rgb(${hVal * 3}, 0, 0)`;
          } else if (hVal < 170) {
            color = `rgb(255, ${(hVal - 85) * 3}, 0)`;
          } else {
            color = `rgb(255, 255, ${(hVal - 170) * 3})`;
          }
          plotPixel(px, height - 1 - py, color);
        }
      }
    }
  }

  else if (effectId === 'combustion') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    
    for (let px = 0; px < width; px++) {
      const wave = Math.sin(px * 0.25 + tick * 0.15) * 3.5 + Math.cos(px * 0.45 - tick * 0.25) * 1.5;
      const flameHeight = 11 + Math.round(wave);
      
      for (let py = height - 1; py >= height - flameHeight; py--) {
        const depthRatio = (height - 1 - py) / flameHeight;
        const heat = 255 - Math.floor(depthRatio * 255);
        
        let color = '#000000';
        if (heat > 160) {
          color = `rgb(255, 230, ${Math.floor((heat - 160) * 2.5)})`;
        } else if (heat > 80) {
          color = `rgb(255, ${Math.floor((heat - 80) * 3)}, 0)`;
        } else {
          color = `rgb(${heat * 3}, 0, 0)`;
        }
        plotPixel(px, py, color);
      }
    }
  }

  else if (effectId === 'firecracker') {
    if (!state.rockets) {
      state.rockets = [];
      state.particles = [];
    }

    if (state.rockets.length < 2 && Math.random() < 0.08) {
      state.rockets.push({
        x: 10 + Math.random() * (width - 20),
        y: height - 1,
        vy: -0.8 - Math.random() * 0.6,
        color: `hsl(${Math.floor(Math.random() * 360)}, 100%, 65%)`
      });
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    for (let i = state.rockets.length - 1; i >= 0; i--) {
      const r = state.rockets[i];
      r.y += r.vy;

      plotPixel(Math.floor(r.x), Math.floor(r.y), '#ffffff');
      if (r.y < height - 1) {
        plotPixel(Math.floor(r.x), Math.floor(r.y) + 1, '#ff8800');
      }

      if (r.y < 3 + Math.random() * 4 || Math.random() < 0.05) {
        const numParticles = 12 + Math.floor(Math.random() * 8);
        for (let p = 0; p < numParticles; p++) {
          const angle = (p / numParticles) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
          const speed = 0.6 + Math.random() * 0.8;
          state.particles.push({
            x: r.x,
            y: r.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.2,
            color: r.color,
            life: 15 + Math.floor(Math.random() * 12),
            maxLife: 27
          });
        }
        state.rockets.splice(i, 1);
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.035;
      p.life--;

      if (p.life <= 0 || p.x < 0 || p.x >= width || p.y >= height) {
        state.particles.splice(i, 1);
        continue;
      }

      const opacity = Math.max(0.1, p.life / p.maxLife);
      ctx.globalAlpha = opacity;
      plotPixel(Math.floor(p.x), Math.floor(p.y), p.color);
      ctx.globalAlpha = 1.0;
    }
  }

  else if (effectId === 'fireworks') {
    if (!state.burst) {
      state.burst = { cx: 40, cy: 8, r: 0.1, active: false, hue: 0 };
    }
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    
    if (!state.burst.active) {
      state.burst.cx = 15 + Math.random() * (width - 30);
      state.burst.cy = 3 + Math.random() * (height - 6);
      state.burst.r = 0.1;
      state.burst.active = true;
      state.burst.hue = Math.floor(Math.random() * 360);
    } else {
      state.burst.r += 0.4;
      if (state.burst.r > 12) {
        state.burst.active = false;
      } else {
        const opacity = 1.0 - state.burst.r / 12;
        ctx.globalAlpha = opacity;
        const numSparks = Math.floor(state.burst.r * 6) + 4;
        for (let i = 0; i < numSparks; i++) {
          const angle = (i / numSparks) * Math.PI * 2 + tick * 0.02;
          const sx = Math.round(state.burst.cx + Math.cos(angle) * state.burst.r);
          const sy = Math.round(state.burst.cy + Math.sin(angle) * state.burst.r + state.burst.r * state.burst.r * 0.02);
          plotPixel(sx, sy, `hsl(${state.burst.hue}, 100%, 60%)`);
        }
        ctx.globalAlpha = 1.0;
      }
    }
  }

  else if (effectId === 'starburst') {
    if (!state.bursts) {
      state.bursts = [];
    }

    if (state.bursts.length < 3 && Math.random() < 0.06) {
      state.bursts.push({
        cx: 15 + Math.random() * (width - 30),
        cy: 4 + Math.random() * (height - 8),
        r: 1.0,
        hue: Math.floor(Math.random() * 360)
      });
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    for (let i = state.bursts.length - 1; i >= 0; i--) {
      const b = state.bursts[i];
      b.r += 0.45;

      if (b.r > 20) {
        state.bursts.splice(i, 1);
        continue;
      }

      const numPoints = Math.floor(b.r * 5);
      const opacity = Math.max(0.05, 1.0 - (b.r / 20.0));
      ctx.globalAlpha = opacity;

      for (let p = 0; p < numPoints; p++) {
        const angle = (p / numPoints) * Math.PI * 2;
        const px = Math.round(b.cx + Math.cos(angle) * b.r);
        const py = Math.round(b.cy + Math.sin(angle) * b.r);
        const ringHue = (b.hue + p * 8) % 360;
        plotPixel(px, py, `hsl(${ringHue}, 100%, 55%)`);
      }
      ctx.globalAlpha = 1.0;
    }
  }

  else if (effectId === 'ripples') {
    if (!state.ripples) {
      state.ripples = [];
    }

    if (state.ripples.length < 4 && Math.random() < 0.08) {
      state.ripples.push({
        cx: Math.random() * width,
        cy: Math.random() * height,
        r: 1.0,
        maxR: 8 + Math.random() * 8
      });
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    for (let i = state.ripples.length - 1; i >= 0; i--) {
      const r = state.ripples[i];
      r.r += 0.35;

      if (r.r >= r.maxR) {
        state.ripples.splice(i, 1);
        continue;
      }

      const opacity = 1.0 - (r.r / r.maxR);
      ctx.globalAlpha = opacity;

      const step = 0.1 / r.r;
      for (let theta = 0; theta < Math.PI * 2; theta += step * 8) {
        const px = Math.round(r.cx + Math.cos(theta) * r.r);
        const py = Math.round(r.cy + Math.sin(theta) * r.r);
        plotPixel(px, py, '#06b6d4');
      }
      ctx.globalAlpha = 1.0;
    }
  }

  else if (effectId === 'metaballs') {
    if (!state.blobs) {
      state.blobs = [
        { x: 20, y: 5, vx: 0.45, vy: 0.35, r: 4.5 },
        { x: 50, y: 10, vx: -0.35, vy: 0.45, r: 5.5 },
        { x: 40, y: 8, vx: 0.55, vy: -0.25, r: 3.5 }
      ];
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    state.blobs.forEach((b: any) => {
      b.x += b.vx;
      b.y += b.vy;

      if (b.x - b.r < 0 || b.x + b.r >= width) b.vx *= -1;
      if (b.y - b.r < 0 || b.y + b.r >= height) b.vy *= -1;
    });

    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        let sum = 0;
        state.blobs.forEach((b: any) => {
          const dx = px - b.x;
          const dy = py - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            sum += b.r / dist;
          }
        });

        if (sum > 1.25) {
          const hue = Math.floor((sum * 45 + tick * 1.5) % 360);
          plotPixel(px, py, `hsl(${hue}, 100%, 50%)`);
        }
      }
    }
  }

  else if (effectId === 'lavalamp') {
    if (!state.blobs) {
      state.blobs = [
        { x: 15, y: 8, vx: 0.15, vy: 0.05, r: 6.0 },
        { x: 45, y: 5, vx: -0.1, vy: -0.07, r: 7.0 },
        { x: 60, y: 10, vx: 0.08, vy: 0.04, r: 5.5 }
      ];
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    state.blobs.forEach((b: any) => {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x - b.r < 5 || b.x + b.r >= width - 5) b.vx *= -1;
      if (b.y - b.r < 1 || b.y + b.r >= height - 1) b.vy *= -1;
    });

    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        let val = 0;
        state.blobs.forEach((b: any) => {
          const dx = px - b.x;
          const dy = py - b.y;
          const d = dx * dx + dy * dy;
          if (d > 0) {
            val += (b.r * b.r) / d;
          }
        });

        if (val > 1.2) {
          if (val > 2.2) {
            plotPixel(px, py, '#facc15');
          } else {
            plotPixel(px, py, '#f97316');
          }
        }
      }
    }
  }

  // ==================== 8. Grid, Game & Block Scenarios ====================
  else if (effectId === 'snake') {
    const initGame = () => {
      state.body = [
        { x: 7, y: 5 },
        { x: 6, y: 5 },
        { x: 5, y: 5 }
      ];
      state.dir = { x: 1, y: 0 };
      spawnFood();
      state.score = 0;
    };

    const spawnFood = () => {
      let tries = 0;
      while (tries < 100) {
        const fx = Math.floor(Math.random() * width);
        const fy = Math.floor(Math.random() * height);
        const onSnake = state.body.some((b: any) => b.x === fx && b.y === fy);
        if (!onSnake) {
          state.food = { x: fx, y: fy };
          return;
        }
        tries++;
      }
      state.food = { x: 1, y: 1 };
    };

    if (!state.body) {
      initGame();
    }

    if (tick % 2 === 0) {
      const head = state.body[0];
      const food = state.food;
      const possibleDirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
      ];

      const validDirs = possibleDirs.filter(d => {
        const nx = head.x + d.x;
        const ny = head.y + d.y;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return false;
        return !state.body.some((b: any) => b.x === nx && b.y === ny);
      });

      if (validDirs.length > 0) {
        validDirs.sort((a, b) => {
          const distA = Math.abs(head.x + a.x - food.x) + Math.abs(head.y + a.y - food.y);
          const distB = Math.abs(head.x + b.x - food.x) + Math.abs(head.y + b.y - food.y);
          return distA - distB;
        });
        state.dir = validDirs[0];
      }

      const newHead = { x: head.x + state.dir.x, y: head.y + state.dir.y };
      const selfCollision = state.body.some((b: any) => b.x === newHead.x && b.y === newHead.y);
      const wallCollision = newHead.x < 0 || newHead.x >= width || newHead.y < 0 || newHead.y >= height;

      if (selfCollision || wallCollision) {
        initGame();
      } else {
        state.body.unshift(newHead);
        if (newHead.x === food.x && newHead.y === food.y) {
          spawnFood();
        } else {
          state.body.pop();
        }
      }
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    const foodIntensity = Math.abs(Math.sin(tick * 0.2)) * 30 + 70;
    plotPixel(state.food.x, state.food.y, `hsl(45, 100%, ${foodIntensity}%)`);

    state.body.forEach((seg: any, idx: number) => {
      const hue = (idx * 15 + tick * 6) % 360;
      if (idx === 0) {
        plotPixel(seg.x, seg.y, '#ffffff');
      } else {
        plotPixel(seg.x, seg.y, `hsl(${hue}, 100%, 50%)`);
      }
    });
  }

  else if (effectId === 'sandworm') {
    if (!state.wormHistory) {
      state.wormHistory = [];
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    const wx = (tick * 0.5) % (width + 24) - 12;
    const wy = 12 + Math.sin(wx * 0.14) * 4.5;

    state.wormHistory.unshift({ x: wx, y: wy });
    if (state.wormHistory.length > 8) {
      state.wormHistory.pop();
    }

    const getDuneBackY = (cx: number) => 10 + Math.sin(cx * 0.07) * 1.5;
    const getDuneFrontY = (cx: number) => 12 + Math.cos(cx * 0.09) * 1.5;

    for (let cx = 0; cx < width; cx++) {
      const dy = Math.floor(getDuneBackY(cx));
      for (let cy = dy; cy < height; cy++) {
        plotPixel(cx, cy, '#b45309');
      }
    }

    state.wormHistory.forEach((seg: any, index: number) => {
      const sizeIndex = 8 - index;
      const radius = 1.5 + (sizeIndex / 8) * 2.5;
      
      const wxInt = Math.floor(seg.x);
      const wyInt = Math.floor(seg.y);
      const color = index % 2 === 0 ? '#1f2937' : '#d97706';

      for (let sx = -4; sx <= 4; sx++) {
        for (let sy = -4; sy <= 4; sy++) {
          if (sx * sx + sy * sy <= radius * radius) {
            const px = wxInt + sx;
            const py = wyInt + sy;
            
            if (px >= 0 && px < width) {
              const backDuneY = getDuneBackY(px);
              if (py < backDuneY + 2) {
                const frontDuneY = getDuneFrontY(px);
                if (py < frontDuneY) {
                   plotPixel(px, py, color);
                }
              }
            }
          }
        }
      }
    });

    for (let cx = 0; cx < width; cx++) {
      const dy = Math.floor(getDuneFrontY(cx));
      for (let cy = dy; cy < height; cy++) {
        plotPixel(cx, cy, '#d97706');
      }
    }
  }

  else if (effectId === 'blocks') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);
    
    for (let blockIdx = 0; blockIdx < 8; blockIdx++) {
      const bx = Math.round(blockIdx * 10 + Math.sin(tick * 0.04 + blockIdx) * 3);
      const by = Math.round((tick * 0.3 + blockIdx * 4) % (height + 6)) - 4;
      
      const hue = (blockIdx * 45 + tick) % 360;
      for (let sx = 0; sx < 3; sx++) {
        for (let sy = 0; sy < 3; sy++) {
          plotPixel(bx + sx, by + sy, `hsl(${hue}, 100%, 55%)`);
        }
      }
    }
  }

  else if (effectId === 'colorrain') {
    if (!state.columns) {
      state.columns = Array.from({ length: 40 }, (_, idx) => ({
        headY: Math.random() * -12,
        speed: 0.2 + Math.random() * 0.3,
        hue: (idx * 18) % 360
      }));
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale);

    state.columns.forEach((c: any, colIdx: number) => {
      c.headY += c.speed;
      if (c.headY >= height + 10) {
        c.headY = -5;
        c.speed = 0.2 + Math.random() * 0.3;
      }

      const colX = colIdx * 2;
      const headInt = Math.floor(c.headY);

      for (let i = 0; i < 6; i++) {
        const trailY = headInt - i;
        if (trailY >= 0 && trailY < height) {
          if (i === 0) {
            plotPixel(colX, trailY, '#ffffff');
          } else {
            const opacity = 1.0 - (i / 6);
            ctx.globalAlpha = opacity;
            plotPixel(colX, trailY, `hsl(${c.hue}, 100%, 50%)`);
            ctx.globalAlpha = 1.0;
          }
        }
      }
    });
  }
};
