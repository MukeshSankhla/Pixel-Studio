import React, { useRef, useEffect } from 'react';

interface AssetPreviewProps {
  pixels: string[];
  width: number;
  height: number;
  type: 'sticker' | 'background' | 'animation';
}

export const AssetPreview: React.FC<AssetPreviewProps> = ({ pixels, width, height, type }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isWidescreen = type === 'background' || type === 'animation';
  const canvasWidth = isWidescreen ? (width || 80) : 32;
  const canvasHeight = isWidescreen ? (height || 16) : 32;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (!pixels || pixels.length === 0) return;

    if (type === 'sticker') {
      // Draw entire sticker scaled to 32x32
      const w = width || 8;
      const h = height || 8;
      
      const pixelWidth = 32 / w;
      const pixelHeight = 32 / h;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          if (idx < pixels.length) {
            const color = pixels[idx];
            if (color && color !== '#00000000') {
              ctx.fillStyle = color;
              ctx.fillRect(x * pixelWidth, y * pixelHeight, pixelWidth, pixelHeight);
            }
          }
        }
      }
    } else {
      // Background and animation: draw full canvas of size w x h (80x16)
      const w = width || 80;
      const h = height || 16;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          if (idx < pixels.length) {
            const color = pixels[idx];
            if (color && color !== '#00000000') {
              ctx.fillStyle = color;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
      }
    }
  }, [pixels, width, height, type, canvasWidth, canvasHeight]);

  return (
    <canvas 
      ref={canvasRef} 
      width={canvasWidth} 
      height={canvasHeight} 
      style={{ 
        width: isWidescreen ? '100%' : 'auto', 
        height: isWidescreen ? 'auto' : '100%', 
        aspectRatio: isWidescreen ? '80 / 16' : '1 / 1',
        display: 'block',
        margin: '0 auto',
        imageRendering: 'pixelated', // crisp pixel scaling
      }} 
    />
  );
};
