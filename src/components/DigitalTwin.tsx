import React, { useRef, useEffect, useState } from 'react';
import type { Widget, Sticker } from '../types/studio';
import { drawPrebuiltEffect } from '../utils/prebuiltRenderer';

const formatYouTubeCount = (countVal: string | number, format: 'short' | 'full' = 'short'): string => {
  const count = typeof countVal === 'number' ? countVal : parseInt(countVal, 10);
  if (isNaN(count)) return countVal.toString();
  if (format === 'full') {
    return count.toString();
  }
  if (count >= 1000000) {
    return (count / 1000000).toFixed(2) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(2) + 'K';
  }
  return count.toString();
};

const GLCD_FONT: Record<string, number[]> = {
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
  '!': [0x00, 0x00, 0x4f, 0x00, 0x00],
  '"': [0x00, 0x07, 0x00, 0x07, 0x00],
  '#': [0x14, 0x7f, 0x14, 0x7f, 0x14],
  '$': [0x24, 0x2a, 0x7f, 0x2a, 0x12],
  '%': [0x23, 0x13, 0x08, 0x64, 0x62],
  '&': [0x36, 0x49, 0x55, 0x22, 0x50],
  '\'': [0x00, 0x05, 0x03, 0x00, 0x00],
  '(': [0x00, 0x1c, 0x22, 0x41, 0x00],
  ')': [0x00, 0x41, 0x22, 0x1c, 0x00],
  '*': [0x14, 0x08, 0x3e, 0x08, 0x14],
  '+': [0x08, 0x08, 0x3e, 0x08, 0x08],
  ',': [0x00, 0x50, 0x30, 0x00, 0x00],
  '-': [0x08, 0x08, 0x08, 0x08, 0x08],
  '.': [0x00, 0x60, 0x60, 0x00, 0x00],
  '/': [0x20, 0x10, 0x08, 0x04, 0x02],
  '0': [0x3e, 0x51, 0x49, 0x45, 0x3e],
  '1': [0x00, 0x42, 0x7f, 0x40, 0x00],
  '2': [0x42, 0x61, 0x51, 0x49, 0x46],
  '3': [0x21, 0x41, 0x45, 0x4b, 0x31],
  '4': [0x18, 0x14, 0x12, 0x7f, 0x10],
  '5': [0x27, 0x45, 0x45, 0x45, 0x39],
  '6': [0x3c, 0x4a, 0x49, 0x49, 0x30],
  '7': [0x01, 0x71, 0x09, 0x05, 0x03],
  '8': [0x36, 0x49, 0x49, 0x49, 0x36],
  '9': [0x06, 0x49, 0x49, 0x29, 0x1e],
  ':': [0x00, 0x36, 0x36, 0x00, 0x00],
  ';': [0x00, 0x56, 0x36, 0x00, 0x00],
  '<': [0x08, 0x14, 0x22, 0x41, 0x00],
  '=': [0x14, 0x14, 0x14, 0x14, 0x14],
  '>': [0x00, 0x41, 0x22, 0x14, 0x08],
  '?': [0x02, 0x01, 0x51, 0x09, 0x06],
  '@': [0x32, 0x49, 0x79, 0x41, 0x3e],
  'A': [0x7e, 0x11, 0x11, 0x11, 0x7e],
  'B': [0x7f, 0x49, 0x49, 0x49, 0x36],
  'C': [0x3e, 0x41, 0x41, 0x41, 0x22],
  'D': [0x7f, 0x41, 0x41, 0x22, 0x1c],
  'E': [0x7f, 0x49, 0x49, 0x49, 0x41],
  'F': [0x7f, 0x09, 0x09, 0x09, 0x01],
  'G': [0x3e, 0x41, 0x49, 0x49, 0x7a],
  'H': [0x7f, 0x08, 0x08, 0x08, 0x7f],
  'I': [0x00, 0x41, 0x7f, 0x41, 0x00],
  'J': [0x20, 0x40, 0x41, 0x3f, 0x01],
  'K': [0x7f, 0x08, 0x14, 0x22, 0x41],
  'L': [0x7f, 0x40, 0x40, 0x40, 0x40],
  'M': [0x7f, 0x02, 0x0c, 0x02, 0x7f],
  'N': [0x7f, 0x04, 0x08, 0x10, 0x7f],
  'O': [0x3e, 0x41, 0x41, 0x41, 0x3e],
  'P': [0x7f, 0x09, 0x09, 0x09, 0x06],
  'Q': [0x3e, 0x41, 0x51, 0x21, 0x5e],
  'R': [0x7f, 0x09, 0x19, 0x29, 0x46],
  'S': [0x46, 0x49, 0x49, 0x49, 0x31],
  'T': [0x01, 0x01, 0x7f, 0x01, 0x01],
  'U': [0x3f, 0x40, 0x40, 0x40, 0x3f],
  'V': [0x1f, 0x20, 0x40, 0x20, 0x1f],
  'W': [0x3f, 0x40, 0x38, 0x40, 0x3f],
  'X': [0x63, 0x14, 0x08, 0x14, 0x63],
  'Y': [0x07, 0x08, 0x70, 0x08, 0x07],
  'Z': [0x61, 0x51, 0x49, 0x45, 0x43],
  'a': [0x20, 0x54, 0x54, 0x54, 0x78],
  'b': [0x7f, 0x48, 0x44, 0x44, 0x38],
  'c': [0x38, 0x44, 0x44, 0x44, 0x20],
  'd': [0x38, 0x44, 0x44, 0x48, 0x7f],
  'e': [0x38, 0x54, 0x54, 0x54, 0x18],
  'f': [0x08, 0x7e, 0x09, 0x01, 0x02],
  'g': [0x0c, 0x52, 0x52, 0x52, 0x3e],
  'h': [0x7f, 0x08, 0x04, 0x04, 0x78],
  'i': [0x00, 0x44, 0x7d, 0x40, 0x00],
  'j': [0x20, 0x40, 0x44, 0x3d, 0x00],
  'k': [0x7f, 0x10, 0x28, 0x44, 0x00],
  'l': [0x00, 0x41, 0x7f, 0x40, 0x00],
  'm': [0x7c, 0x04, 0x18, 0x04, 0x78],
  'n': [0x7c, 0x08, 0x04, 0x04, 0x78],
  'o': [0x38, 0x44, 0x44, 0x44, 0x38],
  'p': [0x7c, 0x14, 0x14, 0x14, 0x08],
  'q': [0x08, 0x14, 0x14, 0x18, 0x7c],
  'r': [0x7c, 0x08, 0x04, 0x04, 0x08],
  's': [0x48, 0x54, 0x54, 0x54, 0x20],
  't': [0x04, 0x3f, 0x44, 0x40, 0x20],
  'u': [0x3c, 0x40, 0x40, 0x20, 0x7c],
  'v': [0x1c, 0x20, 0x40, 0x20, 0x1c],
  'w': [0x3c, 0x40, 0x30, 0x40, 0x3c],
  'x': [0x44, 0x28, 0x10, 0x28, 0x44],
  'y': [0x0c, 0x50, 0x50, 0x50, 0x3c],
  'z': [0x44, 0x64, 0x54, 0x4c, 0x44],
  '°': [0x06, 0x09, 0x09, 0x06, 0x00]
};

const TINY_FONT: Record<string, number[]> = {
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

interface DigitalTwinProps {
  widgets: Widget[];
  stickers: Sticker[];
  selectedWidgetId: string | null;
  onSelectWidget: (id: string | null) => void;
  onUpdateWidgetPosition: (id: string, x: number, y: number) => void;
  onFrameUpdate?: (rgbBuffer: Uint8Array) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  ytSubCount?: string;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({
  widgets,
  stickers,
  selectedWidgetId,
  onSelectWidget,
  onUpdateWidgetPosition,
  onFrameUpdate,
  onDragStart,
  onDragEnd,
  ytSubCount = '1.98K'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationStatesRef = useRef<Record<string, any>>({});

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);

  // Time & Animation ticks
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 50); // ~20fps simulation tick
    return () => clearInterval(interval);
  }, []);

  // Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Create Offscreen Canvas for low-res rendering
    const offscreen = document.createElement('canvas');
    offscreen.width = 80;
    offscreen.height = 16;
    const oCtx = offscreen.getContext('2d');
    if (!oCtx) return;

    const drawPixel = (px: number, py: number, color: string) => {
      if (px >= 0 && px < 80 && py >= 0 && py < 16) {
        oCtx.fillStyle = color;
        oCtx.fillRect(px, py, 1, 1);
      }
    };

    // Clear offscreen to black (for proper alpha composition & unlit pixel detection)
    oCtx.fillStyle = '#000000';
    oCtx.fillRect(0, 0, 80, 16);

    const getWeatherCondition = (): string => {
      const mainWeather = widgets.find(w => w.type === 'weather') as any;
      return mainWeather?.param || 'clear';
    };

    // Sort widgets by Z-Index
    const sortedWidgets = [...widgets].sort((a, b) => a.zIndex - b.zIndex);

    sortedWidgets.forEach(widget => {
      // 1. Draw Background
      if (widget.type === 'background') {
        const bg = widget;
        const opacity = (bg as any).opacity !== undefined ? (bg as any).opacity / 100 : 1.0;
        oCtx.globalAlpha = opacity;
        if (bg.bgType === 'solid') {
          oCtx.fillStyle = bg.colors[0] || '#000';
          oCtx.fillRect(bg.x, bg.y, bg.width, bg.height);
        } else if (bg.bgType === 'gradient' && bg.colors.length >= 2) {
          const grad = oCtx.createLinearGradient(bg.x, bg.y, bg.x + bg.width, bg.y);
          grad.addColorStop(0, bg.colors[0]);
          grad.addColorStop(1, bg.colors[1]);
          oCtx.fillStyle = grad;
          oCtx.fillRect(bg.x, bg.y, bg.width, bg.height);
        } else if (bg.bgType === 'pattern') {
          oCtx.fillStyle = bg.colors[0] || '#111';
          oCtx.fillRect(bg.x, bg.y, bg.width, bg.height);
          oCtx.strokeStyle = bg.colors[1] || '#4f46e5';
          oCtx.lineWidth = 0.2;
          for (let gx = bg.x; gx < bg.x + bg.width; gx += 4) {
            oCtx.beginPath();
            oCtx.moveTo(gx, bg.y);
            oCtx.lineTo(gx, bg.y + bg.height);
            oCtx.stroke();
          }
          for (let gy = bg.y; gy < bg.y + bg.height; gy += 4) {
            oCtx.beginPath();
            oCtx.moveTo(bg.x, gy);
            oCtx.lineTo(bg.x + bg.width, gy);
            oCtx.stroke();
          }
        } else if (bg.bgType === 'pixels' && (bg as any).pixelData) {
          const pixelData = (bg as any).pixelData;
          const w = bg.width;
          const h = bg.height;
          for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
              const color = pixelData[r * w + c];
              if (color && color !== '#00000000' && color !== 'transparent') {
                oCtx.fillStyle = color;
                oCtx.fillRect(bg.x + c, bg.y + r, 1, 1);
              }
            }
          }
        }
        oCtx.globalAlpha = 1.0; // Reset
      }

      // 2. Draw Procedural Prebuilt Animations
      if (widget.type === 'animation') {
        const anim = widget;
        const opacity = (anim as any).opacity !== undefined ? (anim as any).opacity / 100 : 1.0;
        oCtx.globalAlpha = opacity;
        if (anim.animType === 'prebuilt') {
          const pbId = anim.prebuiltId || 'stars';
          if (!animationStatesRef.current[anim.id]) {
            animationStatesRef.current[anim.id] = {};
          }
          drawPrebuiltEffect(
            pbId,
            oCtx,
            anim.x,
            anim.y,
            anim.width,
            anim.height,
            1,
            tick,
            animationStatesRef.current[anim.id]
          );
        } else if (anim.animType === 'custom' && anim.frames && anim.frames.length > 0) {
          const frameIdx = Math.floor((tick * (anim.frameRate || 8)) / 20) % anim.frames.length;
          const framePixels = anim.frames[frameIdx];
          const w = anim.width;
          const h = anim.height;
          for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
              const color = framePixels[r * w + c];
              if (color && color !== '#00000000' && color !== 'transparent') {
                oCtx.fillStyle = color;
                oCtx.fillRect(anim.x + c, anim.y + r, 1, 1);
              }
            }
          }
        }
        oCtx.globalAlpha = 1.0; // Reset
      }

      // 3. Draw Stickers
      if (widget.type === 'sticker') {
        const st = widget;
        const stickerRef = stickers.find(s => s.id === st.stickerId);
        const pixelData = stickerRef ? stickerRef.pixels : st.pixelData;
        if (pixelData) {
          const w = st.width;
          const h = st.height;
          const motion = (st as any).motion || 'none';
          const speedVal = (st as any).motionSpeed || 4;

          let startX = st.x;
          let startY = st.y;
          let isVisible = true;

          if (motion === 'wobble') {
            startX += Math.floor(Math.sin(tick * speedVal * 0.05) * 2);
            startY += Math.floor(Math.cos(tick * speedVal * 0.05) * 1);
          } else if (motion === 'wave') {
            startY += Math.floor(Math.sin(tick * speedVal * 0.05) * 2.5);
          } else if (motion === 'bounce') {
            startY += Math.floor(Math.abs(Math.sin(tick * speedVal * 0.05)) * 3);
          } else if (motion === 'orbit') {
            startX += Math.floor(Math.cos(tick * speedVal * 0.05) * 2.5);
            startY += Math.floor(Math.sin(tick * speedVal * 0.05) * 2.5);
          } else if (motion === 'blink') {
            isVisible = Math.floor(tick * speedVal * 0.05) % 2 === 0;
          } else if (motion === 'glitch') {
            if (Math.random() > 0.8) {
              startX += Math.floor((Math.random() - 0.5) * 3);
              startY += Math.floor((Math.random() - 0.5) * 3);
            }
          } else if (motion === 'scroll-left') {
            const totalRange = 80 + w;
            const offset = Math.floor(tick * speedVal * 0.4) % totalRange;
            startX = st.x - offset;
            if (startX < -w) {
              startX += totalRange;
            }
          } else if (motion === 'scroll-right') {
            const totalRange = 80 + w;
            const offset = Math.floor(tick * speedVal * 0.4) % totalRange;
            startX = st.x + offset;
            if (startX >= 80) {
              startX -= totalRange;
            }
          } else if (motion === 'scroll-up') {
            const totalRange = 16 + h;
            const offset = Math.floor(tick * speedVal * 0.4) % totalRange;
            startY = st.y - offset;
            if (startY < -h) {
              startY += totalRange;
            }
          } else if (motion === 'scroll-down') {
            const totalRange = 16 + h;
            const offset = Math.floor(tick * speedVal * 0.4) % totalRange;
            startY = st.y + offset;
            if (startY >= 16) {
              startY -= totalRange;
            }
          }

          if (isVisible) {
            if (motion === 'rotate') {
              const angle = tick * speedVal * 0.02;
              const cosA = Math.cos(angle);
              const sinA = Math.sin(angle);
              const hW = (w - 1) / 2;
              const hH = (h - 1) / 2;

              for (let r = 0; r < h; r++) {
                for (let c = 0; c < w; c++) {
                  const color = pixelData[r * w + c];
                  if (color && color !== '#00000000' && color !== 'transparent') {
                    const rx = c - hW;
                    const ry = r - hH;
                    const nx = Math.round(hW + rx * cosA - ry * sinA);
                    const ny = Math.round(hH + rx * sinA + ry * cosA);
                    const px = startX + nx;
                    const py = startY + ny;
                    if (px >= 0 && px < 80 && py >= 0 && py < 16) {
                      oCtx.fillStyle = color;
                      oCtx.fillRect(px, py, 1, 1);
                    }
                  }
                }
              }
            } else {
              // Static or other offset-based motions
              for (let r = 0; r < h; r++) {
                for (let c = 0; c < w; c++) {
                  const color = pixelData[r * w + c];
                  if (color && color !== '#00000000' && color !== 'transparent') {
                    const px = startX + c;
                    const py = startY + r;
                    if (px >= 0 && px < 80 && py >= 0 && py < 16) {
                      oCtx.fillStyle = color;
                      oCtx.fillRect(px, py, 1, 1);
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Helper to render texts with effects
      const drawTextHelper = (
        textStr: string,
        wx: number,
        wy: number,
        wWidth: number,
        wHeight: number,
        color: string,
        fontSize: number,
        shadow: boolean,
        shadowColor: string,
        effect: string,
        speed: number,
        fontFamily: string,
        rainbow?: boolean
      ) => {
        const isTiny = fontSize === 0;
        // GFX size multiplier (1, 2, etc.)
        const size = isTiny ? 1 : (fontSize <= 4 ? fontSize : Math.max(1, Math.floor(fontSize / 8)));

        const charWidth = isTiny ? 3 : 5 * size;
        let charSpacing = isTiny ? 1 : 1 * size;
        if (fontFamily === 'bold') {
          charSpacing += 1;
        }
        const charStep = charWidth + charSpacing;
        const textWidth = textStr.length * charStep - charSpacing;

        // Calculate scroll offsets (in pixels)
        let scrollX = 0;
        let scrollY = 0;

        if (effect === 'left') {
          scrollX = wWidth - ((tick * speed * 0.4) % (wWidth + textWidth));
        } else if (effect === 'right') {
          scrollX = -textWidth + ((tick * speed * 0.4) % (wWidth + textWidth));
        } else if (effect === 'bounce') {
          const range = Math.max(0, wWidth - textWidth);
          scrollX = range > 0 ? (Math.sin(tick * 0.05 * speed) + 1) * 0.5 * range : 0;
        }

        // Draw helper function to plot single pixel block
        const drawPixelBlock = (x: number, y: number, plotColor: string, alpha: number) => {
          if (x >= wx && x < wx + wWidth && y >= wy && y < wy + wHeight) {
            if (x >= 0 && x < 80 && y >= 0 && y < 16) {
              oCtx.fillStyle = plotColor;
              if (alpha < 0.95) {
                oCtx.globalAlpha = alpha;
                oCtx.fillRect(x, y, 1, 1);
                oCtx.globalAlpha = 1.0;
              } else {
                oCtx.fillRect(x, y, 1, 1);
              }
            }
          }
        };

        // Draw function for a whole character
        const drawChar = (bytes: number[], startX: number, startY: number, plotColor: string, alpha: number, isShadow: boolean) => {
          const numCols = isTiny ? 3 : 5;
          const numRows = isTiny ? 5 : 8;
          const scale = isTiny ? 1 : size;
          for (let col = 0; col < numCols; col++) {
            const b = bytes[col];
            for (let row = 0; row < numRows; row++) {
              if ((b >> row) & 1) {
                // Plot scale x scale block
                for (let sy = 0; sy < scale; sy++) {
                  for (let sx = 0; sx < scale; sx++) {
                    const px = Math.floor(startX + col * scale + sx);
                    const py = Math.floor(startY + row * scale + sy);

                    let pixelColor = plotColor;
                    if (rainbow && !isShadow) {
                      const hue = (tick * 8 + px * 4) % 360;
                      pixelColor = `hsl(${hue}, 100%, 50%)`;
                    }

                    // Draw primary pixel
                    drawPixelBlock(px, py, pixelColor, alpha);

                    // Classic Bold: 2-pixel thickness/stroke (double draw horizontally)
                    if (fontFamily === 'bold') {
                      drawPixelBlock(px + 1, py, pixelColor, alpha);
                    }
                  }
                }
              }
            }
          }
        };

        const getAutoShadowColor = (hexColor: string): string => {
          const cleaned = hexColor.replace('#', '');
          if (cleaned.length === 3) {
            const r = parseInt(cleaned[0] + cleaned[0], 16);
            const g = parseInt(cleaned[1] + cleaned[1], 16);
            const b = parseInt(cleaned[2] + cleaned[2], 16);
            return `rgb(${Math.floor(r / 4)}, ${Math.floor(g / 4)}, ${Math.floor(b / 4)})`;
          } else if (cleaned.length === 6) {
            const r = parseInt(cleaned.substring(0, 2), 16);
            const g = parseInt(cleaned.substring(2, 4), 16);
            const b = parseInt(cleaned.substring(4, 6), 16);
            return `rgb(${Math.floor(r / 4)}, ${Math.floor(g / 4)}, ${Math.floor(b / 4)})`;
          }
          return 'rgba(0,0,0,0.5)';
        };
        const actualShadowColor = (shadowColor && shadowColor !== 'auto') ? shadowColor : getAutoShadowColor(color);

        // 1. Draw Drop Shadow (offset by +1, +1) if enabled
        if (shadow) {
          for (let i = 0; i < textStr.length; i++) {
            const char = textStr[i];
            const fontDict = isTiny ? TINY_FONT : GLCD_FONT;
            const lookupChar = isTiny ? char.toUpperCase() : char;
            const bytes = fontDict[lookupChar] || fontDict['?'];

            let charScrollY = scrollY;
            if (effect === 'wave') {
              charScrollY = Math.sin(tick * 0.2 + (wx + i * 6) * 0.1) * 1.5;
            }

            const startX = wx + scrollX + i * charStep + 1; // +1 drop shadow offset
            const startY = wy + charScrollY + 1;            // +1 drop shadow offset

            let finalAlpha = 1.0;
            if (effect === 'twinkle') {
              finalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(tick * 0.1 + i * 0.5));
            } else if (effect === 'glow') {
              finalAlpha = 0.2 + 0.8 * Math.abs(Math.sin(tick * 0.15));
            }

            drawChar(bytes, startX, startY, actualShadowColor, finalAlpha, true);
          }
        }

        // 2. Draw Main Text
        for (let i = 0; i < textStr.length; i++) {
          const char = textStr[i];
          const fontDict = isTiny ? TINY_FONT : GLCD_FONT;
          const lookupChar = isTiny ? char.toUpperCase() : char;
          const bytes = fontDict[lookupChar] || fontDict['?'];

          let charScrollY = scrollY;
          if (effect === 'wave') {
            charScrollY = Math.sin(tick * 0.2 + (wx + i * 6) * 0.1) * 1.5;
          }

          const startX = wx + scrollX + i * charStep;
          const startY = wy + charScrollY;

          // Opacity effects
          let finalAlpha = 1.0;
          if (effect === 'twinkle') {
            finalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(tick * 0.1 + i * 0.5));
          } else if (effect === 'glow') {
            finalAlpha = 0.2 + 0.8 * Math.abs(Math.sin(tick * 0.15));
          }

          // Shimmer logic
          let charColor = color;
          if (effect === 'shimmer') {
            const cycle = (Math.sin(tick * 0.15 - i * 0.3) + 1) / 2;
            if (cycle > 0.7) {
              charColor = '#ffffff';
            }
          }

          drawChar(bytes, startX, startY, charColor, finalAlpha, false);
        }
      };

      // 4. Draw Text
      if (widget.type === 'text') {
        const txt = widget;
        drawTextHelper(
          txt.text,
          txt.x,
          txt.y,
          txt.width,
          txt.height,
          txt.color,
          txt.fontSize,
          txt.shadow,
          txt.shadowColorMode === 'custom' ? txt.shadowColor : 'auto',
          txt.scrollEffect,
          txt.scrollSpeed,
          txt.fontFamily,
          (txt as any).rainbow
        );
      }

      // 5. Draw Date Widget
      if (widget.type === 'date') {
        const dt = widget;
        const now = new Date();
        let formatted = '';
        const day = String(now.getDate()).padStart(2, '0');
        const monthNum = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const shortMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const monthStr = shortMonths[now.getMonth()];

        if ((dt as any).format === 'MM/DD/YYYY') {
          formatted = `${monthNum}/${day}/${year}`;
        } else if ((dt as any).format === 'YYYY-MM-DD') {
          formatted = `${year}-${monthNum}-${day}`;
        } else if ((dt as any).format === 'DD MMM') {
          formatted = `${day} ${monthStr}`;
        } else {
          // Default to DD/MM/YYYY
          formatted = `${day}/${monthNum}/${year}`;
        }
        drawTextHelper(formatted, dt.x, dt.y, dt.width, dt.height, dt.color, dt.fontSize, dt.shadow, dt.shadowColorMode === 'custom' ? dt.shadowColor : 'auto', dt.scrollEffect, 4, dt.fontFamily);
      }

      // 6. Draw Time Widget
      if (widget.type === 'time') {
        const tm = widget;
        const now = new Date();
        let formatted = '';
        const hours24 = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        if ((tm as any).format === 'HH:MM') {
          formatted = `${String(hours24).padStart(2, '0')}:${minutes}`;
        } else if ((tm as any).format === 'HH:MM AM/PM') {
          const ampm = hours24 >= 12 ? 'PM' : 'AM';
          const hours12 = hours24 % 12 || 12;
          formatted = `${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;
        } else {
          // Default to HH:MM:SS
          formatted = `${String(hours24).padStart(2, '0')}:${minutes}:${seconds}`;
        }
        drawTextHelper(formatted, tm.x, tm.y, tm.width, tm.height, tm.color, tm.fontSize, tm.shadow, tm.shadowColorMode === 'custom' ? tm.shadowColor : 'auto', tm.scrollEffect, 4, tm.fontFamily);
      }

      // 7. Draw Weather Widget
      if (widget.type === 'weather') {
        const wt = widget as any;

        // "Follow Brief" color palette per condition
        const getBriefColor = (cond: string): string => {
          if (cond === 'clear' || cond === 'sunny')           return '#facc15'; // gold
          if (cond === 'clouds' || cond === 'cloudy')         return '#94a3b8'; // slate
          if (cond === 'rain' || cond === 'rainy' || cond === 'drizzle') return '#38bdf8'; // sky blue
          if (cond === 'thunderstorm' || cond === 'thunder' || cond === 'storm') return '#a78bfa'; // violet
          if (cond === 'snow' || cond === 'snowy')            return '#e0f2fe'; // ice white
          return '#cbd5e1'; // mist/wind – cool grey
        };

        {
          const briefParam = wt.param || 'clear';
          let temp = '28.5C';
          let humi = '65%';
          let brief = 'Sunny';

          if (briefParam === 'clouds') { temp = '22.0C'; humi = '78%'; brief = 'Cloudy'; }
          else if (briefParam === 'rain') { temp = '18.5C'; humi = '92%'; brief = 'Rainy'; }
          else if (briefParam === 'thunderstorm') { temp = '20.0C'; humi = '88%'; brief = 'Stormy'; }
          else if (briefParam === 'snow') { temp = '-2.0C'; humi = '85%'; brief = 'Snowy'; }
          else if (briefParam === 'mist') { temp = '15.0C'; humi = '95%'; brief = 'Misty'; }

          // Resolve layout options
          const iconOffX = wt.iconX !== undefined ? wt.iconX : 2;
          const iconOffY = wt.iconY !== undefined ? wt.iconY : 0;
          const textOffX = wt.textX !== undefined ? wt.textX : 22;
          const textOffY = wt.textY !== undefined ? wt.textY : 0;

          const followColor = getBriefColor(briefParam);

          // Temp styles — always default to size 1 (small 8-px font)
          const tempColor    = (wt.tempColorMode  === 'followBrief') ? followColor : (wt.tempColor  || wt.color || '#facc15');
          const tempFamily   = wt.tempFontFamily  || wt.fontFamily || 'standard';
          const tempSize     = wt.tempFontSize  !== undefined ? wt.tempFontSize  : 1;
          const tempShad     = wt.tempShadow  !== undefined ? wt.tempShadow  : wt.shadow;
          const tempShadCol  = wt.tempShadowColorMode  === 'custom' ? (wt.tempShadowColor  || '#000000') : 'auto';
          // Humi styles
          const humiOffX    = wt.humiX !== undefined ? wt.humiX : 58;
          const humiOffY    = wt.humiY !== undefined ? wt.humiY : 0;
          const humiColor   = (wt.humiColorMode === 'followBrief') ? followColor : (wt.humiColor || wt.color || '#94a3b8');
          const humiFamily  = wt.humiFontFamily  || wt.fontFamily || 'standard';
          const humiSize    = wt.humiFontSize !== undefined ? wt.humiFontSize : 1;
          const humiShad    = wt.humiShadow !== undefined ? wt.humiShadow : wt.shadow;
          const humiShadCol = wt.humiShadowColorMode === 'custom' ? (wt.humiShadowColor || '#000000') : 'auto';
          // Brief styles
          const briefOffX   = wt.briefX !== undefined ? wt.briefX : 22;
          const briefOffY   = wt.briefY !== undefined ? wt.briefY : 8;
          const briefColor  = (wt.briefColorMode === 'followBrief') ? followColor : (wt.briefColor || wt.color || '#ffffff');
          const briefFamily = wt.briefFontFamily || wt.fontFamily || 'bold';
          const briefSize   = wt.briefFontSize !== undefined ? wt.briefFontSize : 1;
          const briefShad   = wt.briefShadow !== undefined ? wt.briefShadow : wt.shadow;
          const briefShadCol= wt.briefShadowColorMode === 'custom' ? (wt.briefShadowColor || '#000000') : 'auto';

          // ─── Animated Weather Icons — 16×16 ─────────────────────────────────
          const ix = wt.x + iconOffX;
          const iy = wt.y + iconOffY;

          if (briefParam === 'clear' || briefParam === 'sunny') {
            // Use the same 'afternoon' sun as the clock's Morning/Afternoon sun
            const weatherStateCache = animationStatesRef.current[wt.id] || (animationStatesRef.current[wt.id] = {});
            if (!weatherStateCache['afternoon']) weatherStateCache['afternoon'] = {};
            // Center the sun in the 16×16 icon area
            weatherStateCache['afternoon'].bgX = ix + 8;
            weatherStateCache['afternoon'].bgY = iy + 8;
            drawPrebuiltEffect('afternoon', oCtx, wt.x, wt.y, wt.width, wt.height, 1, tick, weatherStateCache);

          } else if (briefParam === 'clouds' || briefParam === 'cloudy') {
            // Wave motion (vertical up-down) at 4x speed
            const wave = Math.floor(Math.sin(tick * 0.035 * 4) * 2);
            const W1 = '#e2e8f0'; // light top
            const W2 = '#94a3b8'; // mid
            const W3 = '#64748b'; // dark bottom
            // Cloud shape as row bitmasks [startX, endX] pairs per row
            const cloudRows: [number, number, string][] = [
              [5,  9,  W1],
              [3,  11, W1],
              [1,  13, W1],
              [0,  14, W1],
              [0,  15, W2],
              [0,  15, W2],
              [1,  14, W3],
              [3,  12, W3],
            ];
            cloudRows.forEach(([x1, x2, col], r) => {
              for (let c = x1; c <= x2; c++) {
                drawPixel(ix + c, iy + 4 + r + wave, col);
              }
            });

          } else if (briefParam === 'rain' || briefParam === 'rainy' || briefParam === 'drizzle') {
            // Cloud top (upper 8px) + falling drops (lower 8px)
            const W1 = '#cbd5e1', W2 = '#94a3b8', W3 = '#64748b';
            const cloudRows2: [number, number, string][] = [
              [4,  8,  W1],
              [2,  10, W1],
              [0,  13, W1],
              [0,  14, W2],
              [0,  14, W2],
              [1,  13, W3],
              [3,  11, W3],
            ];
            cloudRows2.forEach(([x1, x2, col], r) => {
              for (let c = x1; c <= x2; c++) drawPixel(ix + c, iy + r, col);
            });
            // 5 animated rain streams
            const rainDrops = [[1,0],[3,3],[5,1],[7,4],[9,2]];
            rainDrops.forEach(([dx, ph]) => {
              const dropY = iy + 8 + ((Math.floor(tick * 0.6) + ph * 2) % 8);
              drawPixel(ix + dx, dropY,     '#38bdf8');
              if (dropY + 1 < iy + 16) drawPixel(ix + dx, dropY + 1, '#7dd3fc');
            });

          } else if (briefParam === 'thunderstorm' || briefParam === 'thunder' || briefParam === 'storm') {
            // Dark storm cloud (upper half) + large flashing bolt (lower half)
            const D1 = '#334155', D2 = '#475569', D3 = '#64748b';
            const stormRows: [number, number, string][] = [
              [4,  8,  D1],
              [2,  10, D1],
              [0,  13, D1],
              [0,  14, D2],
              [0,  14, D2],
              [1,  13, D3],
              [3,  11, D3],
            ];
            stormRows.forEach(([x1, x2, col], r) => {
              for (let c = x1; c <= x2; c++) drawPixel(ix + c, iy + r, col);
            });
            // Large flashing lightning bolt
            const boltPhase = Math.floor(tick / 4) % 5;
            const boltColor = boltPhase < 3 ? '#facc15' : boltPhase === 3 ? '#fde047' : '#fef08a';
            // Bolt shape: zig-zag down
            [[5,6],[4,5],[5,6,7],[6,7],[5,6],[6,7],[7,8]].forEach((cols, r) => {
              cols.forEach(c => drawPixel(ix + c, iy + 8 + r, boltColor));
            });

          } else if (briefParam === 'snow' || briefParam === 'snowy') {
            // Cloud top (upper 7px) + falling snowflakes (lower 9px)
            const W1 = '#e2e8f0', W2 = '#94a3b8', W3 = '#64748b';
            const snowCloud: [number, number, string][] = [
              [4,  8,  W1],
              [2,  10, W1],
              [0,  13, W1],
              [0,  14, W2],
              [0,  14, W2],
              [1,  13, W3],
              [3,  11, W3],
            ];
            snowCloud.forEach(([x1, x2, col], r) => {
              for (let c = x1; c <= x2; c++) drawPixel(ix + c, iy + r, col);
            });
            // 6 drifting snowflakes, each a single bright pixel
            const flakes = [[0,0],[2,3],[4,1],[6,4],[8,2],[10,5]];
            flakes.forEach(([dx, ph]) => {
              const fy = iy + 8 + ((Math.floor(tick * 0.22) + ph * 2) % 8);
              const fx = ix + dx + Math.floor(Math.sin(tick * 0.06 + ph) * 1.5);
              if (fy < iy + 16 && fx >= 0 && fx < 80) drawPixel(fx, fy, '#e0f2fe');
              // Tiny cross shape for bigger flakes
              if (ph % 2 === 0) {
                if (fx+1 < 80) drawPixel(fx + 1, fy, '#bae6fd');
                if (fx-1 >= 0) drawPixel(fx - 1, fy, '#bae6fd');
              }
            });

          } else {
            // Mist / wind — 5 horizontal scrolling streaks spanning full 16px width
            const streakDefs: [number, string][] = [
              [2,  '#94a3b8'],
              [5,  '#cbd5e1'],
              [8,  '#94a3b8'],
              [11, '#e2e8f0'],
              [14, '#94a3b8'],
            ];
            streakDefs.forEach(([yOff, col], i) => {
              const shift = Math.floor(tick * 0.35 + i * 3.3) % 16;
              for (let c = 0; c < 12; c++) {
                const px = ix + ((c + shift) % 15);
                if (px < ix + 16) drawPixel(px, iy + yOff, col);
              }
            });
          }

          // ─── Text ─────────────────────────────────────────────────────────────
          // Each tiny-font line is 5px tall; stacked at y=0, y=5, y=10 they fit in 16px.
          // Height=8 gives generous clip room; actual char height is 5px.
          const textAbsX = wt.x + textOffX;
          const textAbsY = wt.y + textOffY;
          const textW    = wt.width - textOffX;
          const humiW    = wt.width - humiOffX;
          const briefW   = wt.width - briefOffX;
          drawTextHelper(temp,  textAbsX,           textAbsY,           textW,  8, tempColor,  tempSize,  tempShad,  tempShadCol,  'none', 4, tempFamily);
          drawTextHelper(humi,  wt.x + humiOffX,  wt.y + humiOffY,  humiW,  8, humiColor,  humiSize,  humiShad,  humiShadCol,  'none', 4, humiFamily);
          drawTextHelper(brief, wt.x + briefOffX, wt.y + briefOffY, briefW, 8, briefColor, briefSize, briefShad, briefShadCol, 'none', 4, briefFamily);
        }
      }

      // 7.1 Draw Weather Temperature Widget
      if (widget.type === 'weather-temp') {
        const wt = widget as any;
        const cond = getWeatherCondition();
        let temp = '28.5C';
        if (cond === 'clouds') temp = '22.0C';
        else if (cond === 'rain') temp = '18.5C';
        else if (cond === 'thunderstorm') temp = '20.0C';
        else if (cond === 'snow') temp = '-2.0C';
        else if (cond === 'mist') temp = '15.0C';

        const shadCol = wt.shadowColorMode === 'custom' ? (wt.shadowColor || '#000000') : 'auto';
        drawTextHelper(temp, wt.x, wt.y, wt.width, wt.height, wt.color, wt.fontSize !== undefined ? wt.fontSize : 1, wt.shadow, shadCol, wt.scrollEffect || 'none', 4, wt.fontFamily || 'standard');
      }

      // 7.2 Draw Weather Humidity Widget
      if (widget.type === 'weather-humi') {
        const wt = widget as any;
        const cond = getWeatherCondition();
        let humi = '65%';
        if (cond === 'clouds') humi = '78%';
        else if (cond === 'rain') humi = '92%';
        else if (cond === 'thunderstorm') humi = '88%';
        else if (cond === 'snow') humi = '85%';
        else if (cond === 'mist') humi = '95%';

        const shadCol = wt.shadowColorMode === 'custom' ? (wt.shadowColor || '#000000') : 'auto';
        drawTextHelper(humi, wt.x, wt.y, wt.width, wt.height, wt.color, wt.fontSize !== undefined ? wt.fontSize : 1, wt.shadow, shadCol, wt.scrollEffect || 'none', 4, wt.fontFamily || 'standard');
      }

      // 7.3 Draw Weather Brief Widget
      if (widget.type === 'weather-brief') {
        const wt = widget as any;
        const cond = getWeatherCondition();
        let brief = 'Sunny';
        if (cond === 'clouds') brief = 'Cloudy';
        else if (cond === 'rain') brief = 'Rainy';
        else if (cond === 'thunderstorm') brief = 'Stormy';
        else if (cond === 'snow') brief = 'Snowy';
        else if (cond === 'mist') brief = 'Misty';

        const shadCol = wt.shadowColorMode === 'custom' ? (wt.shadowColor || '#000000') : 'auto';
        drawTextHelper(brief, wt.x, wt.y, wt.width, wt.height, wt.color, wt.fontSize !== undefined ? wt.fontSize : 1, wt.shadow, shadCol, wt.scrollEffect || 'none', 4, wt.fontFamily || 'bold');
      }

      // 7.4 Draw YouTube Subscription Count Widget
      if (widget.type === 'youtube-sub') {
        const yt = widget as any;
        const textOffX = yt.textX !== undefined ? yt.textX : 0;
        const textOffY = yt.textY !== undefined ? yt.textY : 0;

        // Draw Subscriber count text (fetched from YouTube API or simulated default)
        const countText = formatYouTubeCount(ytSubCount, yt.format || 'short');

        const ytColor = yt.color || '#ffffff';
        const ytSize = yt.fontSize !== undefined ? yt.fontSize : 1;
        const ytShadow = yt.shadow !== undefined ? yt.shadow : true;
        const ytShadowCol = yt.shadowColorMode === 'custom' ? (yt.shadowColor || '#000000') : 'auto';
        const ytFamily = yt.fontFamily || 'bold';

        drawTextHelper(
          countText,
          yt.x + textOffX,
          yt.y + textOffY,
          yt.width - textOffX,
          yt.height !== undefined ? yt.height : 8,
          ytColor,
          ytSize,
          ytShadow,
          ytShadowCol,
          yt.scrollEffect || 'none',
          4,
          ytFamily
        );
      }

      // 7.5 Draw Clock Widget
      if (widget.type === 'clock') {
        const ck = widget as any;

        // 1. Determine phase (morning, afternoon, evening, night)
        let phase = 'morning';
        const now = new Date();
        const hour = now.getHours();

        if (!ck.timeOfDayOverride || ck.timeOfDayOverride === 'auto') {
          if (hour >= 6 && hour < 12) phase = 'morning';
          else if (hour >= 12 && hour < 17) phase = 'afternoon';
          else if (hour >= 17 && hour < 20) phase = 'evening';
          else phase = 'night';
        } else {
          phase = ck.timeOfDayOverride;
        }

        // 2. Draw Background
        const ckStateCache = animationStatesRef.current[ck.id] || (animationStatesRef.current[ck.id] = {});
        let resolvedAnim = 'sunrise';
        if (phase === 'morning') resolvedAnim = 'sunrise';
        else if (phase === 'sunset' || phase === 'evening') resolvedAnim = 'sunset';
        else if (phase === 'afternoon') resolvedAnim = 'afternoon';
        else resolvedAnim = 'night';

        const bgX = ck.bgX !== undefined ? ck.bgX : 10;
        const bgY = ck.bgY !== undefined ? ck.bgY : 8;

        // Pass coordinates in state cache for the prebuilt animations
        if (!ckStateCache[resolvedAnim]) {
          ckStateCache[resolvedAnim] = {};
        }
        ckStateCache[resolvedAnim].bgX = bgX;
        ckStateCache[resolvedAnim].bgY = bgY;

        // Clear background to black first (so offset background shows cleanly)
        oCtx.fillStyle = '#000000';
        oCtx.fillRect(ck.x, ck.y, ck.width, ck.height);

        drawPrebuiltEffect(resolvedAnim, oCtx, ck.x, ck.y, ck.width, ck.height, 1, tick, ckStateCache);

        // 3. Draw Date & Time texts
        // Format Date
        let dateStr = '';
        const day = String(now.getDate()).padStart(2, '0');
        const monthNum = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const shortMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const monthStr = shortMonths[now.getMonth()];

        if (ck.dateFormat === 'MM/DD/YYYY') {
          dateStr = `${monthNum}/${day}/${year}`;
        } else if (ck.dateFormat === 'YYYY-MM-DD') {
          dateStr = `${year}-${monthNum}-${day}`;
        } else if (ck.dateFormat === 'DD/MM/YYYY') {
          dateStr = `${day}/${monthNum}/${year}`;
        } else {
          // Default to 'DD MMM'
          dateStr = `${day} ${monthStr}`;
        }

        // Format Time
        let timeStr = '';
        const hours24 = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        if (ck.timeFormat === 'HH:MM:SS') {
          timeStr = `${String(hours24).padStart(2, '0')}:${minutes}:${seconds}`;
        } else if (ck.timeFormat === 'HH:MM AM/PM') {
          const ampm = hours24 >= 12 ? 'PM' : 'AM';
          const hours12 = hours24 % 12 || 12;
          timeStr = `${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;
        } else {
          // Default to 'HH:MM'
          timeStr = `${String(hours24).padStart(2, '0')}:${minutes}`;
        }

        const dateX = ck.dateX !== undefined ? ck.dateX : 20;
        const dateY = ck.dateY !== undefined ? ck.dateY : 0;
        const timeX = ck.timeX !== undefined ? ck.timeX : 20;
        const timeY = ck.timeY !== undefined ? ck.timeY : 8;

        // Helper: resolve color based on "followTime" mode
        const getFollowTimeColor = (p: string): string => {
          if (p === 'morning') return '#f6c90e'; // warm gold
          if (p === 'afternoon') return '#fffde7'; // bright near-white
          if (p === 'evening') return '#ff7043'; // deep orange
          return '#5c9dd6';                         // night – cool blue
        };

        const dateColor = (ck.dateColorMode === 'followTime')
          ? getFollowTimeColor(phase)
          : (ck.dateColor !== undefined ? ck.dateColor : ck.color);
        const timeColor = (ck.timeColorMode === 'followTime')
          ? getFollowTimeColor(phase)
          : (ck.timeColor !== undefined ? ck.timeColor : ck.color);
        const dateFontFamily = ck.dateFontFamily !== undefined ? ck.dateFontFamily : ck.fontFamily;
        const timeFontFamily = ck.timeFontFamily !== undefined ? ck.timeFontFamily : ck.fontFamily;
        const dateFontSize = ck.dateFontSize !== undefined ? ck.dateFontSize : ck.fontSize;
        const timeFontSize = ck.timeFontSize !== undefined ? ck.timeFontSize : ck.fontSize;

        const dateShadow = ck.dateShadow !== undefined ? ck.dateShadow : ck.shadow;
        const timeShadow = ck.timeShadow !== undefined ? ck.timeShadow : ck.shadow;
        const dateShadowCol = ck.dateShadowColorMode === 'custom'
          ? (ck.dateShadowColor || '#000000')
          : (ck.shadowColorMode === 'custom' ? ck.shadowColor : 'auto');
        const timeShadowCol = ck.timeShadowColorMode === 'custom'
          ? (ck.timeShadowColor || '#000000')
          : (ck.shadowColorMode === 'custom' ? ck.shadowColor : 'auto');

        drawTextHelper(dateStr, ck.x + dateX, ck.y + dateY, ck.width - dateX, 8, dateColor, dateFontSize, dateShadow, dateShadowCol, 'none', 4, dateFontFamily);
        drawTextHelper(timeStr, ck.x + timeX, ck.y + timeY, ck.width - timeX, 8, timeColor, timeFontSize, timeShadow, timeShadowCol, 'none', 4, timeFontFamily);
      }

      // 8. Draw Timer Widget
      if (widget.type === 'timer') {
        const tr = widget;
        const total = tr.durationSeconds;
        const minStr = String(Math.floor(total / 60)).padStart(2, '0');
        const secStr = String(total % 60).padStart(2, '0');
        drawTextHelper(`${minStr}:${secStr}`, tr.x, tr.y, tr.width, tr.height, tr.color, tr.fontSize, tr.shadow, tr.shadowColorMode === 'custom' ? tr.shadowColor : 'auto', tr.scrollEffect, 4, tr.fontFamily);
      }

      // 9. Draw Shape Widget
      // 9. Draw Shape Widget
      if (widget.type === 'shape') {
        const sh = widget as any;
        const color = sh.color || '#EA580C';
        const borderColor = sh.borderColor || '#00000000';
        const borderWidth = sh.borderWidth !== undefined ? sh.borderWidth : 1;
        const filled = sh.filled !== undefined ? sh.filled : true;
        const w = sh.width;
        const h = sh.height;
        const cornerRadius = sh.cornerRadius || 0;

        const motion = sh.motion || 'none';
        const speedVal = sh.motionSpeed || 4;

        let startX = sh.x;
        let startY = sh.y;
        let isVisible = true;

        if (motion === 'wobble') {
          startX += Math.floor(Math.sin(tick * speedVal * 0.05) * 2);
          startY += Math.floor(Math.cos(tick * speedVal * 0.05) * 1);
        } else if (motion === 'wave') {
          startY += Math.floor(Math.sin(tick * speedVal * 0.05) * 2.5);
        } else if (motion === 'bounce') {
          startY += Math.floor(Math.abs(Math.sin(tick * speedVal * 0.05)) * 3);
        } else if (motion === 'orbit') {
          startX += Math.floor(Math.cos(tick * speedVal * 0.05) * 2.5);
          startY += Math.floor(Math.sin(tick * speedVal * 0.05) * 2.5);
        } else if (motion === 'blink') {
          isVisible = Math.floor(tick * speedVal * 0.05) % 2 === 0;
        } else if (motion === 'glitch') {
          if (Math.random() > 0.8) {
            startX += Math.floor((Math.random() - 0.5) * 3);
            startY += Math.floor((Math.random() - 0.5) * 3);
          }
        } else if (motion === 'scroll-left') {
          const totalRange = 80 + w;
          const offset = Math.floor(tick * speedVal * 0.4) % totalRange;
          startX = sh.x - offset;
          if (startX < -w) {
            startX += totalRange;
          }
        } else if (motion === 'scroll-right') {
          const totalRange = 80 + w;
          const offset = Math.floor(tick * speedVal * 0.4) % totalRange;
          startX = sh.x + offset;
          if (startX >= 80) {
            startX -= totalRange;
          }
        } else if (motion === 'scroll-up') {
          const totalRange = 16 + h;
          const offset = Math.floor(tick * speedVal * 0.4) % totalRange;
          startY = sh.y - offset;
          if (startY < -h) {
            startY += totalRange;
          }
        } else if (motion === 'scroll-down') {
          const totalRange = 16 + h;
          const offset = Math.floor(tick * speedVal * 0.4) % totalRange;
          startY = sh.y + offset;
          if (startY >= 16) {
            startY -= totalRange;
          }
        }

        if (isVisible) {
          const angle = tick * speedVal * 0.02;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);
          const hW = (w - 1) / 2;
          const hH = (h - 1) / 2;

          const drawPixel = (sx: number, sy: number, col: string) => {
            let px = startX + sx;
            let py = startY + sy;
            if (motion === 'rotate') {
              const rx = sx - hW;
              const ry = sy - hH;
              const nx = Math.round(hW + rx * cosA - ry * sinA);
              const ny = Math.round(hH + rx * sinA + ry * cosA);
              px = startX + nx;
              py = startY + ny;
            }
            if (px >= 0 && px < 80 && py >= 0 && py < 16) {
              oCtx.fillStyle = col;
              oCtx.fillRect(px, py, 1, 1);
            }
          };

          if (sh.shapeType === 'rect') {
            for (let sy = 0; sy < h; sy++) {
              for (let sx = 0; sx < w; sx++) {
                let isInside = true;
                let drawBorder = false;

                const onStraightBorder = (
                  ((sx >= cornerRadius && sx < w - cornerRadius) && (sy < borderWidth || sy >= h - borderWidth)) ||
                  ((sy >= cornerRadius && sy < h - cornerRadius) && (sx < borderWidth || sx >= w - borderWidth))
                );

                if (onStraightBorder && borderWidth > 0) {
                  drawBorder = true;
                }

                let cx = 0, cy = 0;
                let inCorner = false;

                if (cornerRadius > 0) {
                  if (sx < cornerRadius && sy < cornerRadius) {
                    cx = cornerRadius - 0.5;
                    cy = cornerRadius - 0.5;
                    inCorner = true;
                  } else if (sx >= w - cornerRadius && sy < cornerRadius) {
                    cx = w - cornerRadius - 0.5;
                    cy = cornerRadius - 0.5;
                    inCorner = true;
                  } else if (sx < cornerRadius && sy >= h - cornerRadius) {
                    cx = cornerRadius - 0.5;
                    cy = h - cornerRadius - 0.5;
                    inCorner = true;
                  } else if (sx >= w - cornerRadius && sy >= h - cornerRadius) {
                    cx = w - cornerRadius - 0.5;
                    cy = h - cornerRadius - 0.5;
                    inCorner = true;
                  }
                }

                if (inCorner) {
                  const dx = sx - cx;
                  const dy = sy - cy;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist > cornerRadius) {
                    isInside = false;
                  } else if (borderWidth > 0 && dist >= cornerRadius - borderWidth) {
                    drawBorder = true;
                  }
                } else if (!onStraightBorder) {
                  if (!filled) {
                    isInside = false;
                  }
                }

                if (isInside) {
                  if (drawBorder && borderWidth > 0) {
                    drawPixel(sx, sy, borderColor);
                  } else if (filled) {
                    drawPixel(sx, sy, color);
                  }
                }
              }
            }
          }
          else if (sh.shapeType === 'circle') {
            const cx = (w - 1) / 2;
            const cy = (h - 1) / 2;
            const rx = w / 2;
            const ry = h / 2;

            for (let sy = 0; sy < h; sy++) {
              for (let sx = 0; sx < w; sx++) {
                const dx = (sx - cx) / rx;
                const dy = (sy - cy) / ry;
                const dist = dx * dx + dy * dy;

                if (dist <= 1.0) {
                  const innerRx = rx - borderWidth;
                  const innerRy = ry - borderWidth;
                  const innerDx = (sx - cx) / Math.max(0.5, innerRx);
                  const innerDy = (sy - cy) / Math.max(0.5, innerRy);
                  const innerDist = innerDx * innerDx + innerDy * innerDy;

                  if (borderWidth > 0 && innerDist > 1.0) {
                    drawPixel(sx, sy, borderColor);
                  } else if (filled) {
                    drawPixel(sx, sy, color);
                  }
                }
              }
            }
          }
          else if (sh.shapeType === 'triangle') {
            for (let sy = 0; sy < h; sy++) {
              const progress = sy / (h - 1 || 1);
              const startX = ((w - 1) / 2) * (1 - progress);
              const endX = (w - 1) - startX;

              for (let sx = 0; sx < w; sx++) {
                if (sx >= startX && sx <= endX) {
                  const isBorder = (sy < borderWidth || sx < startX + borderWidth || sx > endX - borderWidth);

                  if (isBorder && borderWidth > 0) {
                    drawPixel(sx, sy, borderColor);
                  } else if (filled) {
                    drawPixel(sx, sy, color);
                  }
                }
              }
            }
          }
          else if (sh.shapeType === 'line') {
            let x1 = 0;
            let y1 = 0;
            const x2 = w - 1;
            const y2 = h - 1;
            const dx = Math.abs(x2 - x1);
            const dy = Math.abs(y2 - y1);
            const sx = x1 < x2 ? 1 : -1;
            const sy = y1 < y2 ? 1 : -1;
            let err = dx - dy;

            while (true) {
              drawPixel(x1, y1, color);
              if (x1 === x2 && y1 === y2) break;
              const e2 = 2 * err;
              if (e2 > -dy) {
                err -= dy;
                x1 += sx;
              }
              if (e2 < dx) {
                err += dx;
                y1 += sy;
              }
            }
          }
          else if (sh.shapeType === 'hline') {
            const thickness = Math.max(1, h);
            for (let sy = 0; sy < thickness; sy++) {
              for (let sx = 0; sx < w; sx++) {
                drawPixel(sx, sy, color);
              }
            }
          }
          else if (sh.shapeType === 'vline') {
            const thickness = Math.max(1, w);
            for (let sy = 0; sy < h; sy++) {
              for (let sx = 0; sx < thickness; sx++) {
                drawPixel(sx, sy, color);
              }
            }
          }
        }
      }
    });

    // 2. Render the realistic LED grid on the main high-res canvas (800x160)
    const imgData = oCtx.getImageData(0, 0, 80, 16);
    const data = imgData.data;

    // Capture offscreen RGB data for live streaming
    if (onFrameUpdate) {
      const rgbBuffer = new Uint8Array(80 * 16 * 3);
      for (let i = 0; i < 80 * 16; i++) {
        rgbBuffer[i * 3] = data[i * 4];       // R
        rgbBuffer[i * 3 + 1] = data[i * 4 + 1]; // G
        rgbBuffer[i * 3 + 2] = data[i * 4 + 2]; // B
      }
      onFrameUpdate(rgbBuffer);
    }

    const cellSize = 10;

    // Clear main canvas PCB background
    ctx.fillStyle = '#060608';
    ctx.fillRect(0, 0, 800, 160);

    // Draw subtle grid lines on the PCB
    ctx.strokeStyle = '#0e0e12';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= 80; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellSize, 0);
      ctx.lineTo(c * cellSize, 160);
      ctx.stroke();
    }
    for (let r = 0; r <= 16; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellSize);
      ctx.lineTo(800, r * cellSize);
      ctx.stroke();
    }

    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 80; col++) {
        const idx = (row * 80 + col) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        const cx = col * cellSize + cellSize / 2;
        const cy = row * cellSize + cellSize / 2;

        const isLit = a > 127 && (r > 0 || g > 0 || b > 0);

        if (isLit) {
          // 1. Draw outer bloom
          const bloom = ctx.createRadialGradient(cx, cy, 2, cx, cy, 7);
          bloom.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.35)`);
          bloom.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.fillStyle = bloom;
          ctx.beginPath();
          ctx.arc(cx, cy, 7, 0, Math.PI * 2);
          ctx.fill();

          // 2. Draw LED bead casing
          ctx.fillStyle = '#1e1e24';
          ctx.beginPath();
          ctx.arc(cx, cy, 3.8, 0, Math.PI * 2);
          ctx.fill();

          // 3. Draw LED lit core
          const ledGrad = ctx.createRadialGradient(cx - 0.8, cy - 0.8, 0.2, cx, cy, 3.5);
          ledGrad.addColorStop(0, '#ffffff');
          ledGrad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 1)`);
          ledGrad.addColorStop(1, `rgba(${Math.floor(r * 0.6)}, ${Math.floor(g * 0.6)}, ${Math.floor(b * 0.6)}, 1)`);
          ctx.fillStyle = ledGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw unlit LED bead
          ctx.strokeStyle = '#121216';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#16161a';
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#08080a';
          ctx.fillRect(cx - 0.8, cy - 0.8, 1.6, 1.6);
        }
      }
    }

    // 3. Draw selection outline directly on the main canvas
    sortedWidgets.forEach(widget => {
      if (selectedWidgetId === widget.id) {
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(
          widget.x * cellSize - 0.5,
          widget.y * cellSize - 0.5,
          widget.width * cellSize + 1,
          widget.height * cellSize + 1
        );
        ctx.setLineDash([]);
      }
    });

  }, [widgets, stickers, selectedWidgetId, tick]);

  // Handle click on canvas to select widget
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cellWidth = rect.width / 80;
    const cellHeight = rect.height / 16;

    const clickX = Math.floor((e.clientX - rect.left) / cellWidth);
    const clickY = Math.floor((e.clientY - rect.top) / cellHeight);

    // Find clicked widget (traverse from top z-index downwards)
    const clickedWidget = [...widgets]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find(w => {
        return (
          clickX >= w.x &&
          clickX < w.x + w.width &&
          clickY >= w.y &&
          clickY < w.y + w.height
        );
      });

    if (clickedWidget) {
      if (onDragStart) {
        onDragStart();
      }
      onSelectWidget(clickedWidget.id);
      setIsDragging(true);
      setDraggedWidgetId(clickedWidget.id);
      setDragOffset({
        x: clickX - clickedWidget.x,
        y: clickY - clickedWidget.y
      });
    } else {
      onSelectWidget(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedWidgetId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cellWidth = rect.width / 80;
    const cellHeight = rect.height / 16;

    const mouseX = Math.floor((e.clientX - rect.left) / cellWidth);
    const mouseY = Math.floor((e.clientY - rect.top) / cellHeight);

    let newX = mouseX - dragOffset.x;
    let newY = mouseY - dragOffset.y;

    // Bounds snapping
    newX = Math.max(-20, Math.min(80, newX));
    newY = Math.max(-5, Math.min(16, newY));

    onUpdateWidgetPosition(draggedWidgetId, newX, newY);
  };

  const handleCanvasMouseUp = () => {
    if (isDragging && onDragEnd) {
      onDragEnd();
    }
    setIsDragging(false);
    setDraggedWidgetId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '16px', flex: 1 }}>
      <div
        ref={containerRef}
        className="digital-twin-chassis-container"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: 'auto',
          aspectRatio: '2048 / 445',
          backgroundImage: `url("${import.meta.env.BASE_URL}Pixel_Bar.png")`,
          backgroundSize: '100% 345.17%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '0% 59.12%',
          padding: '11.69% 3.52% 1.80% 5.13%',
          filter: 'drop-shadow(0 8px 12px rgba(78, 78, 78, 0.25))'
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={160}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          style={{
            position: 'absolute',
            left: '9%',
            width: '84%',
            top: '18%',
            height: '74%',
            borderRadius: '4px',
            cursor: isDragging ? 'grabbing' : 'pointer',
            backgroundColor: '#060608'
          }}
        />
      </div>
      {/* <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 8px var(--primary)' }}></span>
          Digital Twin Active (80x16 LEDs)
        </span>
        <span>•</span>
        <span>Drag widgets directly to position them</span>
        <span>•</span>
        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Active Widgets: {widgets.length} ({widgets.length > 0 ? widgets.map(w => w.name).join(', ') : 'None'})</span>
      </div> */}
    </div>
  );
};
