import React, { useState, useEffect, useRef } from 'react';
import type { BackgroundPreset } from '../types/studio';
import { AssetPreview } from './AssetPreview';
import { generateBlankGrid } from '../utils/defaultAssets';
import { Download, Upload, Save, Trash, Share2, Check, Undo, Redo, Pencil, Eraser, Square, Circle, Slash, PaintBucket, Droplet, FlipHorizontal, FlipVertical, Image as ImageIcon } from 'lucide-react';

interface BackgroundBuilderProps {
  backgrounds: BackgroundPreset[];
  onSaveBackground: (bg: BackgroundPreset) => void;
  onDeleteBackground: (id: string) => void;
  onPublishToCommunity: (type: string, data: any) => Promise<any> | void;
  navBar?: React.ReactNode;
}

export const BackgroundBuilder: React.FC<BackgroundBuilderProps> = ({
  backgrounds,
  onSaveBackground,
  onDeleteBackground,
  onPublishToCommunity,
  navBar
}) => {
  const [size, setSize] = useState<number>(80); // 80x16 Full size default
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [activeWidth, setActiveWidth] = useState<number>(80);
  const [activeHeight, setActiveHeight] = useState<number>(16);
  const [inputW, setInputW] = useState<string>('80');
  const [inputH, setInputH] = useState<string>('16');
  const [bgName, setBgName] = useState<string>('My Custom BG');
  const [activeColor, setActiveColor] = useState<string>('#ff0000');
  const [drawMode, setDrawMode] = useState<'pencil' | 'eraser' | 'rect' | 'circle' | 'line' | 'fill'>('pencil');
  
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  // Image Importer Modal States
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importImageSrc, setImportImageSrc] = useState<string | null>(null);
  const [importZoom, setImportZoom] = useState<number>(1.0);
  const [importOffsetX, setImportOffsetX] = useState<number>(0);
  const [importOffsetY, setImportOffsetY] = useState<number>(0);
  const [importContrast, setImportContrast] = useState<number>(100);
  const [importSaturation, setImportSaturation] = useState<number>(100);
  const [importBrightness, setImportBrightness] = useState<number>(100);
  const [importPreviewPixels, setImportPreviewPixels] = useState<string[]>([]);

  const getShapeCells = (start: number, end: number, mode: 'rect' | 'circle' | 'line', w: number): Set<number> => {
    const cells = new Set<number>();
    const startX = start % w;
    const startY = Math.floor(start / w);
    const endX = end % w;
    const endY = Math.floor(end / w);

    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    if (mode === 'rect') {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          cells.add(y * w + x);
        }
      }
    } else if (mode === 'circle') {
      const cx = (startX + endX) / 2;
      const cy = (startY + endY) / 2;
      const rx = Math.max(0.5, Math.abs(endX - startX) / 2);
      const ry = Math.max(0.5, Math.abs(endY - startY) / 2);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1.05) {
            cells.add(y * w + x);
          }
        }
      }
    } else if (mode === 'line') {
      let x1 = startX;
      let y1 = startY;
      const x2 = endX;
      const y2 = endY;

      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1;
      const sy = y1 < y2 ? 1 : -1;
      let err = dx - dy;

      while (true) {
        cells.add(y1 * w + x1);
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

    return cells;
  };

  const getMirroredIndices = (indices: Set<number>, w: number, h: number): Set<number> => {
    const expanded = new Set<number>();
    indices.forEach(idx => {
      const x = idx % w;
      const y = Math.floor(idx / w);
      expanded.add(idx);
      if (mirrorH) {
        expanded.add(y * w + (w - 1 - x));
      }
      if (mirrorV) {
        expanded.add((h - 1 - y) * w + x);
      }
      if (mirrorH && mirrorV) {
        expanded.add((h - 1 - y) * w + (w - 1 - x));
      }
    });
    return expanded;
  };
  
  // Matrix pixels state
  const [pixels, setPixels] = useState<string[]>(generateBlankGrid(80, 16));

  // History states for Undo/Redo
  const [history, setHistory] = useState<string[][]>([]);
  const [redoStack, setRedoStack] = useState<string[][]>([]);

  // Mirror toggle states
  const [mirrorH, setMirrorH] = useState(false);
  const [mirrorV, setMirrorV] = useState(false);
  
  const isDrawingRef = useRef(false);
  const activeStrokeColorRef = useRef<string>('#00000000');

  // Preset Colors arranged by natural hue spectrum
  const colors = [
    '#00000000', // transparent
    '#ffffff',   // white
    '#090d16',   // dark
    '#ef4444',   // red
    '#f97316',   // orange
    '#f59e0b',   // amber
    '#eab308',   // yellow
    '#84cc16',   // lime
    '#22c55e',   // green
    '#10b981',   // emerald
    '#14b8a6',   // teal
    '#06b6d4',   // cyan
    '#0ea5e9',   // sky
    '#3b82f6',   // blue
    '#6366f1',   // indigo
    '#8b5cf6',   // violet
    '#a855f7',   // purple
    '#d946ef',   // fuchsia
    '#ec4899',   // pink
    '#f43f5e',   // rose
  ];

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDrawingRef.current = false;
    };
    const handleShapeMouseUp = () => {
      if (dragStart !== null && dragEnd !== null) {
        setHistory(prev => [...prev, pixels]);
        setRedoStack([]);

        const w = activeWidth;
        const h = activeHeight;
        const shapeIndices = getShapeCells(dragStart, dragEnd, drawMode as any, w);
        const committedIndices = getMirroredIndices(shapeIndices, w, h);

        setPixels(prev => {
          const next = [...prev];
          committedIndices.forEach(idx => {
            next[idx] = activeColor;
          });
          return next;
        });
      }
      setDragStart(null);
      setDragEnd(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mouseup', handleShapeMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mouseup', handleShapeMouseUp);
    };
  }, [dragStart, dragEnd, drawMode, activeColor, activeWidth, activeHeight, mirrorH, mirrorV, pixels]);

  useEffect(() => {
    const onPaint = () => setDrawMode('pencil');
    const onEraser = () => setDrawMode('eraser');
    const onClear = () => handleClear();
    const onFill = () => setDrawMode('fill');
    const onFillAll = () => handleFillAll();
    const onUndo = () => handleUndo();
    const onRedo = () => handleRedo();
    const onMirrorH = () => setMirrorH(prev => !prev);
    const onMirrorV = () => setMirrorV(prev => !prev);
    const onSave = () => handleSave();
    const onImportImage = () => {
      setShowImportModal(true);
    };
    const onExportJson = () => handleExport();
    const onImportJson = () => {
      const fileInput = document.getElementById('bg-json-import-file') as HTMLInputElement;
      fileInput?.click();
    };
    const onShare = () => handleShare();
    const onRect = () => setDrawMode('rect');
    const onCircle = () => setDrawMode('circle');
    const onLine = () => setDrawMode('line');

    document.addEventListener('app-shortcut-paint', onPaint);
    document.addEventListener('app-shortcut-eraser', onEraser);
    document.addEventListener('app-shortcut-clear', onClear);
    document.addEventListener('app-shortcut-fill', onFill);
    document.addEventListener('app-shortcut-fill-all', onFillAll);
    document.addEventListener('app-shortcut-undo', onUndo);
    document.addEventListener('app-shortcut-redo', onRedo);
    document.addEventListener('app-shortcut-mirror-h', onMirrorH);
    document.addEventListener('app-shortcut-mirror-v', onMirrorV);
    document.addEventListener('app-shortcut-save', onSave);
    document.addEventListener('app-shortcut-import-image', onImportImage);
    document.addEventListener('app-shortcut-export-json', onExportJson);
    document.addEventListener('app-shortcut-import-json', onImportJson);
    document.addEventListener('app-shortcut-share', onShare);
    document.addEventListener('app-shortcut-rect', onRect);
    document.addEventListener('app-shortcut-circle', onCircle);
    document.addEventListener('app-shortcut-line', onLine);

    return () => {
      document.removeEventListener('app-shortcut-paint', onPaint);
      document.removeEventListener('app-shortcut-eraser', onEraser);
      document.removeEventListener('app-shortcut-clear', onClear);
      document.removeEventListener('app-shortcut-fill', onFill);
      document.removeEventListener('app-shortcut-fill-all', onFillAll);
      document.removeEventListener('app-shortcut-undo', onUndo);
      document.removeEventListener('app-shortcut-redo', onRedo);
      document.removeEventListener('app-shortcut-mirror-h', onMirrorH);
      document.removeEventListener('app-shortcut-mirror-v', onMirrorV);
      document.removeEventListener('app-shortcut-save', onSave);
      document.removeEventListener('app-shortcut-import-image', onImportImage);
      document.removeEventListener('app-shortcut-export-json', onExportJson);
      document.removeEventListener('app-shortcut-import-json', onImportJson);
      document.removeEventListener('app-shortcut-share', onShare);
      document.removeEventListener('app-shortcut-rect', onRect);
      document.removeEventListener('app-shortcut-circle', onCircle);
      document.removeEventListener('app-shortcut-line', onLine);
    };
  }, [pixels, activeColor, drawMode, bgName, activeWidth, activeHeight, mirrorH, mirrorV, history, redoStack]);

  const handleSizeChange = (newSize: number) => {
    setSize(newSize);
    if (newSize > 0) {
      if (newSize === 80) {
        setActiveWidth(80);
        setActiveHeight(16);
        setInputW('80');
        setInputH('16');
        setPixels(generateBlankGrid(80, 16));
      } else {
        setActiveWidth(newSize);
        setActiveHeight(newSize);
        setInputW(newSize.toString());
        setInputH(newSize.toString());
        setPixels(generateBlankGrid(newSize, newSize));
      }
    }
    setHistory([]);
    setRedoStack([]);
  };

  const handleCustomSizeApply = () => {
    const w = Math.min(80, Math.max(1, parseInt(inputW) || 80));
    const h = Math.min(16, Math.max(1, parseInt(inputH) || 16));
    setInputW(w.toString());
    setInputH(h.toString());
    setActiveWidth(w);
    setActiveHeight(h);
    setSize(0); // indicates custom size
    setPixels(generateBlankGrid(w, h));
    setHistory([]);
    setRedoStack([]);
  };

  const currentWidth = activeWidth;
  const currentHeight = activeHeight;

  const paintCell = (index: number, color: string) => {
    const w = currentWidth;
    const h = currentHeight;
    const x = index % w;
    const y = Math.floor(index / w);

    const targetIndices = new Set<number>();
    targetIndices.add(index);

    if (mirrorH) {
      targetIndices.add(y * w + (w - 1 - x));
    }
    if (mirrorV) {
      targetIndices.add((h - 1 - y) * w + x);
    }
    if (mirrorH && mirrorV) {
      targetIndices.add((h - 1 - y) * w + (w - 1 - x));
    }

    setPixels(prev => {
      const next = [...prev];
      targetIndices.forEach(idx => {
        next[idx] = color;
      });
      return next;
    });
  };

  const floodFill = (startIdx: number, replacementColor: string) => {
    const targetColor = pixels[startIdx];
    if (targetColor === replacementColor) return;

    const w = activeWidth;
    const h = activeHeight;
    const queue: number[] = [startIdx];
    const visited = new Set<number>();
    visited.add(startIdx);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const x = curr % w;
      const y = Math.floor(curr / w);

      // Neighbors
      const neighbors: number[] = [];
      if (x > 0) neighbors.push(curr - 1);
      if (x < w - 1) neighbors.push(curr + 1);
      if (y > 0) neighbors.push(curr - w);
      if (y < h - 1) neighbors.push(curr + w);

      for (const n of neighbors) {
        if (!visited.has(n) && pixels[n] === targetColor) {
          visited.add(n);
          queue.push(n);
        }
      }
    }

    const expandedIndices = getMirroredIndices(visited, w, h);

    setHistory(prev => [...prev, pixels]);
    setRedoStack([]);
    setPixels(prev => {
      const next = [...prev];
      expandedIndices.forEach(idx => {
        next[idx] = replacementColor;
      });
      return next;
    });
  };

  const handleCellMouseDown = (e: React.MouseEvent, index: number) => {
    if (e.button === 1) return; // ignore middle click
    if (e.button === 2) {
      e.preventDefault();
    }
    
    if (drawMode === 'fill') {
      const color = e.button === 2 ? '#00000000' : activeColor;
      floodFill(index, color);
      return;
    }

    if (['rect', 'circle', 'line'].includes(drawMode)) {
      setDragStart(index);
      setDragEnd(index);
      return;
    }

    // Save state before changes
    setHistory(prev => [...prev, pixels]);
    setRedoStack([]);

    const color = e.button === 2 ? '#00000000' : (drawMode === 'pencil' ? activeColor : '#00000000');
    activeStrokeColorRef.current = color;
    isDrawingRef.current = true;
    
    paintCell(index, color);
  };

  const handleCellMouseEnter = (index: number) => {
    if (['rect', 'circle', 'line'].includes(drawMode)) {
      if (dragStart !== null) {
        setDragEnd(index);
      }
      return;
    }

    if (isDrawingRef.current) {
      paintCell(index, activeStrokeColorRef.current);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));
    setRedoStack(prev => [...prev, pixels]);
    setPixels(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, prev.length - 1));
    setHistory(prev => [...prev, pixels]);
    setPixels(next);
  };



  const handleClear = () => {
    setHistory(prev => [...prev, pixels]);
    setRedoStack([]);
    setPixels(generateBlankGrid(currentWidth, currentHeight));
  };

  const handleFillAll = () => {
    setHistory(prev => [...prev, pixels]);
    setRedoStack([]);
    setPixels(Array(currentWidth * currentHeight).fill(activeColor));
  };

  // Local Save
  const handleSave = () => {
    if (!bgName.trim()) return;
    const newBg: BackgroundPreset = {
      id: 'bg-' + Date.now(),
      name: bgName,
      bgType: 'pixels',
      width: currentWidth,
      height: currentHeight,
      pixels: pixels,
      colors: [] // Empty colors array for schema consistency
    };
    onSaveBackground(newBg);
    window.showToast('Background layout saved locally!', 'success');
  };

  // Export JSON
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ name: bgName, bgType: 'pixels', width: currentWidth, height: currentHeight, pixels })
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${bgName.replace(/\s+/g, '_')}_bg.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.width && parsed.height && parsed.pixels) {
            setHistory(prev => [...prev, pixels]);
            setRedoStack([]);
            setSize((parsed.width === 80 && parsed.height === 16) ? 80 : (parsed.width === parsed.height ? parsed.width : 0));
            setInputW(parsed.width.toString());
            setInputH(parsed.height.toString());
            setActiveWidth(parsed.width);
            setActiveHeight(parsed.height);
            setBgName(parsed.name || 'Imported BG');
            setPixels(parsed.pixels);
          }
        } catch (err) {
          window.showToast('Invalid JSON background format', 'error');
        }
      };
    }
  };

  const handleModalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImportImageSrc(event.target.result as string);
        setImportZoom(1.0);
        setImportOffsetX(0);
        setImportOffsetY(0);
        setImportContrast(100);
        setImportSaturation(100);
        setImportBrightness(100);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyImport = () => {
    if (importPreviewPixels.length > 0) {
      setHistory(prev => [...prev, pixels]);
      setRedoStack([]);
      setPixels(importPreviewPixels);
      setShowImportModal(false);
      setImportImageSrc(null);
    }
  };

  useEffect(() => {
    if (!importImageSrc) {
      setImportPreviewPixels([]);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = activeWidth;
      canvas.height = activeHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#00000000';
      ctx.fillRect(0, 0, activeWidth, activeHeight);

      ctx.filter = `contrast(${importContrast}%) saturate(${importSaturation}%) brightness(${importBrightness}%)`;

      const aspect = img.width / img.height;
      let bw = activeWidth * importZoom;
      let bh = (activeWidth / aspect) * importZoom;

      let dx = (activeWidth - bw) / 2 + importOffsetX;
      let dy = (activeHeight - bh) / 2 + importOffsetY;
      let dw = bw;
      let dh = bh;

      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.filter = 'none';

      const imgData = ctx.getImageData(0, 0, activeWidth, activeHeight);
      const generated: string[] = [];
      for (let i = 0; i < imgData.data.length; i += 4) {
        const r = imgData.data[i];
        const g = imgData.data[i + 1];
        const b = imgData.data[i + 2];
        const a = imgData.data[i + 3];
        if (a < 128) {
          generated.push('#00000000');
        } else {
          const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
          generated.push(hex);
        }
      }
      setImportPreviewPixels(generated);
    };
    img.src = importImageSrc;
  }, [importImageSrc, importZoom, importOffsetX, importOffsetY, importContrast, importSaturation, importBrightness, activeWidth, activeHeight]);

  const handleExportPNG = () => {
    const canvas = document.createElement('canvas');
    const scale = 32;
    canvas.width = activeWidth * scale;
    canvas.height = activeHeight * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pixels.forEach((color, idx) => {
      const x = idx % activeWidth;
      const y = Math.floor(idx / activeWidth);
      if (color !== '#00000000') {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    });

    const link = document.createElement('a');
    link.download = `${bgName.toLowerCase().replace(/\s+/g, '_') || 'background'}_art.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = async () => {
    setIsPublishing(true);
    setIsPublished(false);
    try {
      const shareData = {
        id: 'shared-bg-' + Date.now(),
        name: bgName,
        bgType: 'pixels',
        width: currentWidth,
        height: currentHeight,
        pixels: pixels,
        colors: []
      };
      await onPublishToCommunity('background', shareData);
      setIsPublished(true);
      setTimeout(() => setIsPublished(false), 3000);
    } catch (err) {
      console.error("Publish error:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const loadLocalBackground = (bg: BackgroundPreset) => {
    setHistory(prev => [...prev, pixels]);
    setRedoStack([]);
    setBgName(bg.name);
    if (bg.pixels) {
      setSize((bg.width === 80 && bg.height === 16) ? 80 : (bg.width === bg.height ? bg.width! : 0));
      setInputW((bg.width || 80).toString());
      setInputH((bg.height || 16).toString());
      setActiveWidth(bg.width || 80);
      setActiveHeight(bg.height || 16);
      setPixels(bg.pixels);
    } else {
      // Fallback for legacy preset (convert to standard 80x16 pixel array)
      setSize(80);
      const tempPixels = generateBlankGrid(80, 16);
      if (bg.bgType === 'solid' && bg.colors[0]) {
        tempPixels.fill(bg.colors[0]);
      } else if (bg.bgType === 'gradient' && bg.colors.length >= 2) {
        // Simple linear gradient approximation
        const c1 = bg.colors[0];
        const c2 = bg.colors[1];
        // Just fill the grid with standard layout for simulation
        for (let x = 0; x < 80; x++) {
          const ratio = x / 79;
          // Parse hex
          const r1 = parseInt(c1.substring(1, 3), 16);
          const g1 = parseInt(c1.substring(3, 5), 16);
          const b1 = parseInt(c1.substring(5, 7), 16);
          const r2 = parseInt(c2.substring(1, 3), 16);
          const g2 = parseInt(c2.substring(3, 5), 16);
          const b2 = parseInt(c2.substring(5, 7), 16);
          const r = Math.round(r1 + ratio * (r2 - r1));
          const g = Math.round(g1 + ratio * (g2 - g1));
          const b = Math.round(b1 + ratio * (b2 - b1));
          const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
          for (let y = 0; y < 16; y++) {
            tempPixels[y * 80 + x] = hex;
          }
        }
      } else {
        tempPixels.fill('#030712');
      }
      setPixels(tempPixels);
    }
  };

  return (
    <div className="builder-layout-grid">
      {/* Column 1: Local Library & Actions */}
      <div className="glass-panel workspace-panel" style={{ height: '100%', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 className="panel-header">Local Library</h3>
          <div className="saved-items-scrollbar-box" style={{ flex: 1, overflowY: 'auto', maxHeight: '420px', marginTop: '10px' }}>
            {backgrounds.length === 0 ? (
              <p style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-light)', textAlign: 'center', marginTop: '10px' }}>No saved backgrounds yet.</p>
            ) : (
              backgrounds.map((bg) => (
                <div 
                  key={bg.id} 
                  className="saved-asset-card"
                  onClick={() => loadLocalBackground(bg)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: '8px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div 
                      style={{ 
                        width: '60px', 
                        height: '12px', 
                        borderRadius: '3px', 
                        border: '1px solid rgba(0,0,0,0.08)',
                        background: '#0f172a', 
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {bg.pixels ? (
                        <AssetPreview pixels={bg.pixels} width={bg.width || 80} height={bg.height || 16} type="background" />
                      ) : (
                        <div 
                          style={{
                            width: '100%',
                            height: '100%',
                            background: bg.bgType === 'solid' ? bg.colors[0] : `linear-gradient(90deg, ${bg.colors[0]}, ${bg.colors[1] || bg.colors[0]})`
                          }}
                        />
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bg.name}</p>
                      <p style={{ fontSize: '9px', color: 'var(--text-light)', textTransform: 'capitalize' }}>
                        {bg.pixels ? `${bg.width}x${bg.height} pixel` : bg.bgType} background
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBackground(bg.id);
                    }}
                    className="btn btn-danger btn-circle"
                    style={{ padding: '4px', borderRadius: '4px', background: 'transparent', border: 'none', color: 'var(--danger)' }}
                  >
                    <Trash size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px', marginTop: 'auto' }}>
          <h3 className="panel-header">Studio Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button
                onClick={handleExport}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Download size={12} /> Export JSON
              </button>

              <button
                onClick={handleExportPNG}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Download size={12} /> Export PNG
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '500' }}>Import</label>
              <label className="btn btn-secondary" style={{ padding: '8px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: 0 }}>
                <Upload size={12} /> Choose File
                <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} id="bg-json-import-file" />
              </label>
            </div>

            <button
               onClick={handleShare}
               disabled={isPublishing}
               className={`btn ${isPublished ? 'btn-success' : 'btn-primary'}`}
               style={{ 
                 width: '100%', 
                 padding: '8px', 
                 fontSize: '11px', 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'center', 
                 gap: '4px',
                 background: isPublished ? '#10b981' : '',
                 borderColor: isPublished ? '#10b981' : ''
               }}
             >
               {isPublishing ? (
                 <>
                   <div className="spinner-border animate-spin" style={{ width: '10px', height: '10px', border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                   Publishing...
                 </>
               ) : isPublished ? (
                 <>
                   <Check size={12} />
                   Published!
                 </>
               ) : (
                 <>
                   <Share2 size={12} />
                   Publish to Hub <kbd>U</kbd>
                 </>
               )}
             </button>
          </div>
        </div>
      </div>

      {/* Column 2: Digital Twin Simulator & Painting Workspace */}
      <div className="center-canvas-area" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 24px 10px 24px', position: 'relative' }}>
        {navBar}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '16px 16px 0 16px', flex: 1 }}>
          <div
            className="digital-twin-chassis-container"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              aspectRatio: '2048 / 445',
              backgroundImage: `url("${import.meta.env.BASE_URL}Pixel_Bar.png")`,
              backgroundSize: '100% 345.17%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '0% 59.12%',
              padding: '11.69% 3.52% 1.80% 5.13%',
              filter: 'drop-shadow(0 45px 20px rgba(78, 78, 78, 0.85))'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '9%',
                width: '84%',
                top: '18%',
                height: '74%',
                borderRadius: '4px',
                backgroundColor: '#060608',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px'
              }}
            >
              <div 
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${currentWidth}, minmax(0, 1fr))`,
                  gap: '1px',
                  aspectRatio: `${currentWidth}/${currentHeight}`,
                  height: '100%',
                  maxHeight: '100%',
                  maxWidth: '100%',
                  margin: 'auto'
                }}
              >
                {pixels.map((color, idx) => {
                  const isPreview = dragStart !== null && dragEnd !== null && getMirroredIndices(getShapeCells(dragStart, dragEnd, drawMode as any, currentWidth), currentWidth, currentHeight).has(idx);
                  const displayColor = isPreview ? activeColor : color;
                  const isEmpty = displayColor === '#00000000';
                  return (
                    <div
                      key={idx}
                      onMouseDown={(e) => handleCellMouseDown(e, idx)}
                      onMouseEnter={() => handleCellMouseEnter(idx)}
                      className="pixel-cell"
                      style={{
                        backgroundColor: isEmpty ? 'transparent' : displayColor,
                        backgroundImage: isEmpty ? 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)' : 'none',
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        opacity: isPreview ? 0.7 : 1,
                        boxShadow: !isEmpty ? `inset 0 0 4px rgba(255, 255, 255, 0.3), 0 0 6px ${displayColor}44` : 'none'
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Color Swatches & Drawing Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '100%', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            {/* Row 1: Colors in a line */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setActiveColor(c);
                    if (c === '#00000000') {
                      setDrawMode('eraser');
                    } else {
                      if (drawMode === 'eraser') setDrawMode('pencil');
                    }
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: c === '#00000000' ? 'transparent' : c,
                    border: activeColor === c ? '2.5px solid var(--primary)' : '1px solid rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    boxShadow: activeColor === c ? '0 0 8px var(--primary)' : 'none',
                    backgroundImage: c === '#00000000' ? 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%)' : 'none',
                    backgroundSize: '4px 4px',
                    transition: 'transform 0.1s ease',
                  }}
                  className="hover:scale-110"
                />
              ))}
              
              {/* Custom Color Picker */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="color"
                  value={activeColor.startsWith('#') && activeColor.length === 7 ? activeColor : '#ff0000'}
                  onChange={(e) => {
                    setActiveColor(e.target.value);
                    if (drawMode === 'eraser') setDrawMode('pencil');
                  }}
                  className="color-picker-input-native"
                  style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', padding: 0 }}
                />
              </div>
            </div>

            {/* Row 2: Drawing Options in one line with Icons */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <button
                onClick={() => setDrawMode('pencil')}
                className={`btn btn-circle ${drawMode === 'pencil' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', width: '34px', height: '34px', borderRadius: '50%' }}
                title="Paint Brush [P]"
              >
                <Pencil size={14} />
              </button>
              
              <button
                onClick={() => setDrawMode('eraser')}
                className={`btn btn-circle ${drawMode === 'eraser' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', width: '34px', height: '34px', borderRadius: '50%' }}
                title="Eraser [E]"
              >
                <Eraser size={14} />
              </button>

              <button
                onClick={() => setDrawMode('rect')}
                className={`btn btn-circle ${drawMode === 'rect' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', width: '34px', height: '34px', borderRadius: '50%' }}
                title="Rectangle [R]"
              >
                <Square size={14} />
              </button>

              <button
                onClick={() => setDrawMode('circle')}
                className={`btn btn-circle ${drawMode === 'circle' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', width: '34px', height: '34px', borderRadius: '50%' }}
                title="Circle [O]"
              >
                <Circle size={14} />
              </button>

              <button
                onClick={() => setDrawMode('line')}
                className={`btn btn-circle ${drawMode === 'line' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', width: '34px', height: '34px', borderRadius: '50%' }}
                title="Line [L]"
              >
                <Slash size={14} />
              </button>

              <button
                onClick={() => setDrawMode('fill')}
                className={`btn btn-circle ${drawMode === 'fill' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', width: '34px', height: '34px', borderRadius: '50%' }}
                title="Flood Fill [F]"
              >
                <PaintBucket size={14} />
              </button>

              <div style={{ width: '1px', height: '20px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

              <button
                onClick={handleFillAll}
                className="btn btn-secondary"
                style={{ padding: '8px', width: '34px', height: '34px', borderRadius: '50%' }}
                title="Fill All Grid"
              >
                <Droplet size={14} />
              </button>

              <button
                onClick={handleClear}
                className="btn btn-danger"
                style={{ padding: '8px', width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}
                title="Clear Grid [K]"
              >
                <Trash size={14} />
              </button>

              <div style={{ width: '1px', height: '20px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="btn btn-secondary"
                style={{ padding: '8px', width: '34px', height: '34px', borderRadius: '50%' }}
                title="Undo [Ctrl+Z]"
              >
                <Undo size={14} />
              </button>

              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="btn btn-secondary"
                style={{ padding: '8px', width: '34px', height: '34px', borderRadius: '50%' }}
                title="Redo [Ctrl+Y]"
              >
                <Redo size={14} />
              </button>

              <div style={{ width: '1px', height: '20px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

              <button
                onClick={() => setShowImportModal(true)}
                className="btn btn-secondary"
                style={{ padding: '8px', width: '34px', height: '34px', borderRadius: '50%' }}
                title="Import Image [I]"
              >
                <ImageIcon size={14} />
              </button>

              <button
                onClick={() => setMirrorH(!mirrorH)}
                className={`btn ${mirrorH ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', width: '34px', height: '34px', borderRadius: '50%' }}
                title="Mirror Horizontal [H]"
              >
                <FlipHorizontal size={14} />
              </button>

              <button
                onClick={() => setMirrorV(!mirrorV)}
                className={`btn ${mirrorV ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', width: '34px', height: '34px', borderRadius: '50%' }}
                title="Mirror Vertical [V]"
              >
                <FlipVertical size={14} />
              </button>
            </div>
          </div>
        </div>

      {/* Column 3: Settings Panel */}
      <div className="glass-panel workspace-panel" style={{ height: '100%', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 className="panel-header">Background Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '500' }}>Background Name</label>
              <input
                type="text"
                className="glass-input"
                style={{ fontSize: '14px', fontWeight: 'bold', width: '100%' }}
                value={bgName}
                onChange={(e) => setBgName(e.target.value)}
                placeholder="Background name..."
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '500' }}>Canvas Size</label>
              <select
                value={size}
                onChange={(e) => handleSizeChange(Number(e.target.value))}
                className="glass-input"
                style={{ width: '100%', padding: '8px 12px' }}
              >
                <option value={8}>8 x 8 Grid</option>
                <option value={10}>10 x 10 Grid</option>
                <option value={11}>11 x 11 Grid</option>
                <option value={12}>12 x 12 Grid</option>
                <option value={13}>13 x 13 Grid</option>
                <option value={14}>14 x 14 Grid</option>
                <option value={15}>15 x 15 Grid</option>
                <option value={16}>16 x 16 Grid</option>
                <option value={80}>80 x 16 (Full Screen)</option>
                <option value={0}>Custom Size</option>
              </select>
            </div>

            {size === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                  <input
                    type="number"
                    min={1}
                    max={80}
                    className="glass-input"
                    style={{ width: '100%', textAlign: 'center', padding: '6px' }}
                    value={inputW}
                    onChange={(e) => setInputW(e.target.value)}
                  />
                  <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>x</span>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    className="glass-input"
                    style={{ width: '100%', textAlign: 'center', padding: '6px' }}
                    value={inputH}
                    onChange={(e) => setInputH(e.target.value)}
                  />
                </div>
                <button onClick={handleCustomSizeApply} className="btn btn-primary btn-pill" style={{ padding: '8px 16px', fontSize: '11px' }}>
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
          <button 
            onClick={handleSave}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Save size={14} /> Save Background <kbd>S</kbd>
          </button>
        </div>
      </div>

      {showImportModal && (
        <div className="modal-backdrop-layer">
          <div className="glass-panel modal-dialog-box" style={{ maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--primary)' }}>
              Import & Resize Image
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '500' }}>Select Image File</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleModalImageSelect} 
                  className="glass-input" 
                  style={{ width: '100%', padding: '8px' }} 
                />
              </div>

              {importImageSrc && (
                <>
                  {(() => {
                    const previewMaxDim = 200;
                    const isWide = activeWidth >= activeHeight;
                    const previewW = isWide ? previewMaxDim : (activeWidth / activeHeight) * previewMaxDim;
                    const previewH = isWide ? (activeHeight / activeWidth) * previewMaxDim : previewMaxDim;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.03)', padding: '12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Pixel Grid Preview ({activeWidth}x{activeHeight})</span>
                        <div 
                          style={{ 
                            display: 'grid', 
                            gridTemplateColumns: `repeat(${activeWidth}, 1fr)`, 
                            gap: '0.5px', 
                            width: `${previewW}px`, 
                            height: `${previewH}px`, 
                            background: '#0f172a', 
                            borderRadius: '6px', 
                            padding: '4px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                        >
                          {importPreviewPixels.map((c, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                backgroundColor: c === '#00000000' ? 'transparent' : c,
                                backgroundImage: c === '#00000000' ? 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%)' : 'none',
                                backgroundSize: '4px 4px'
                              }} 
                              className="aspect-square" 
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Zoom: {importZoom.toFixed(2)}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="3.0" 
                        step="0.05"
                        value={importZoom} 
                        onChange={(e) => setImportZoom(parseFloat(e.target.value))} 
                        className="slider-input" 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Horizontal Shift: {importOffsetX} px</span>
                      </div>
                      <input 
                        type="range" 
                        min={-activeWidth} 
                        max={activeWidth} 
                        step="1"
                        value={importOffsetX} 
                        onChange={(e) => setImportOffsetX(parseInt(e.target.value))} 
                        className="slider-input" 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Vertical Shift: {importOffsetY} px</span>
                      </div>
                      <input 
                        type="range" 
                        min={-activeHeight} 
                        max={activeHeight} 
                        step="1"
                        value={importOffsetY} 
                        onChange={(e) => setImportOffsetY(parseInt(e.target.value))} 
                        className="slider-input" 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Contrast: {importContrast}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="200" 
                        step="5"
                        value={importContrast} 
                        onChange={(e) => setImportContrast(parseInt(e.target.value))} 
                        className="slider-input" 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Saturation: {importSaturation}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        step="5"
                        value={importSaturation} 
                        onChange={(e) => setImportSaturation(parseInt(e.target.value))} 
                        className="slider-input" 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Brightness: {importBrightness}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="150" 
                        step="5"
                        value={importBrightness} 
                        onChange={(e) => setImportBrightness(parseInt(e.target.value))} 
                        className="slider-input" 
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyItems: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  onClick={() => {
                    setShowImportModal(false);
                    setImportImageSrc(null);
                  }} 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApplyImport} 
                  disabled={!importImageSrc}
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '10px' }}
                >
                  Apply Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
