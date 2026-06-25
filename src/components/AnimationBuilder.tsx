import React, { useState, useEffect, useRef } from 'react';
import type { AnimationPreset } from '../types/studio';
import { AssetPreview } from './AssetPreview';
import { generateBlankGrid } from '../utils/defaultAssets';
import { Download, Upload, Save, Trash, Share2, Check, Play, Pause, Plus, Copy, Undo, Redo, FlipHorizontal, FlipVertical, Pencil, Eraser, Square, Circle, Slash, PaintBucket, Droplet, Image as ImageIcon, Flame, Sparkles, Zap, Activity, Waves, Rocket, SunDim, Atom, Sunrise, Sunset, Palmtree, CloudRain, Tornado, Spline, Wind, Palette, ArrowDown, Orbit, Infinity, Grid, RotateCw, Disc, Cpu, Route, Lightbulb, CircleDot, Dna, GitMerge, Maximize2, Bomb, ZapOff, PartyPopper, Sun, Target, Droplets, GlassWater, Gamepad2, Bug, Boxes, CloudLightning, ChevronLeft, ChevronRight, Moon } from 'lucide-react';
import { drawPrebuiltEffect } from '../utils/prebuiltRenderer';

interface AnimationBuilderProps {
  animations: AnimationPreset[];
  onSaveAnimation: (anim: AnimationPreset) => void;
  onDeleteAnimation: (id: string) => void;
  onPublishToCommunity: (type: string, data: any) => Promise<any> | void;
  navBar?: React.ReactNode;
}

export const AnimationBuilder: React.FC<AnimationBuilderProps> = ({
  animations,
  onSaveAnimation,
  onDeleteAnimation,
  onPublishToCommunity,
  navBar
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [animName, setAnimName] = useState<string>('My Custom Animation');
  const [animType, setAnimType] = useState<'prebuilt' | 'custom'>('prebuilt');
  const [prebuiltId, setPrebuiltId] = useState<AnimationPreset['prebuiltId']>('aurora');
  
  // Sizing properties
  const [size, setSize] = useState<number>(80); // 80x16 Full size default
  const [activeWidth, setActiveWidth] = useState<number>(80);
  const [activeHeight, setActiveHeight] = useState<number>(16);
  const [inputW, setInputW] = useState<string>('80');
  const [inputH, setInputH] = useState<string>('16');

  // Custom timeline frame state
  const [frames, setFrames] = useState<string[][]>([generateBlankGrid(80, 16)]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [frameRate, setFrameRate] = useState<number>(8); // 8 FPS default
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  
  // Ref and scrolling handler for horizontal FX simulator toolbar
  const fxScrollRef = useRef<HTMLDivElement>(null);
  const scrollFX = (direction: 'left' | 'right') => {
    if (fxScrollRef.current) {
      const scrollAmount = 180;
      fxScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  // Custom painter state
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

  // History states for Undo/Redo (storing string[][][])
  const [history, setHistory] = useState<string[][][]>([]);
  const [redoStack, setRedoStack] = useState<string[][][]>([]);

  // Mirror toggle states
  const [mirrorH, setMirrorH] = useState(false);
  const [mirrorV, setMirrorV] = useState(false);
  
  const isDrawingRef = useRef(false);
  const activeStrokeColorRef = useRef<string>('#00000000');

  // Prebuilt FX live preview visualizer states/refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewTick, setPreviewTick] = useState(0);
  const previewStatesRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (animType !== 'prebuilt') return;
    const interval = setInterval(() => {
      setPreviewTick(prev => prev + 1);
    }, 50);
    return () => clearInterval(interval);
  }, [animType]);

  useEffect(() => {
    if (animType !== 'prebuilt' || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear to black
    ctx.fillStyle = '#060608';
    ctx.fillRect(0, 0, 800, 160);

    // Draw procedural prebuilt FX based on prebuiltId
    drawPrebuiltEffect(
      prebuiltId || 'stars',
      ctx,
      0,
      0,
      80,
      16,
      10, // 10x scale for preview canvas
      previewTick,
      previewStatesRef.current
    );

    // Draw realistic LED overlay grid lines
    ctx.strokeStyle = '#0e0e12';
    ctx.lineWidth = 1;
    for (let c = 0; c <= 80; c++) {
      ctx.beginPath();
      ctx.moveTo(c * 10, 0);
      ctx.lineTo(c * 10, 160);
      ctx.stroke();
    }
    for (let r = 0; r <= 16; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * 10);
      ctx.lineTo(800, r * 10);
      ctx.stroke();
    }
  }, [animType, prebuiltId, previewTick]);

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

  // Animation playing effect
  useEffect(() => {
    if (!isPlaying || animType === 'prebuilt') return;
    const interval = setInterval(() => {
      setCurrentFrameIdx((prev) => (prev + 1) % frames.length);
    }, 1000 / frameRate);
    return () => clearInterval(interval);
  }, [isPlaying, frames.length, frameRate, animType]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDrawingRef.current = false;
    };
    const handleShapeMouseUp = () => {
      if (dragStart !== null && dragEnd !== null) {
        setHistory(prev => [...prev, frames]);
        setRedoStack([]);

        const w = activeWidth;
        const h = activeHeight;
        const shapeIndices = getShapeCells(dragStart, dragEnd, drawMode as any, w);
        const committedIndices = getMirroredIndices(shapeIndices, w, h);

        setFrames(prev => {
          const next = prev.map((f, idx) => {
            if (idx === currentFrameIdx) {
              const updatedFrame = [...f];
              committedIndices.forEach(idxToPaint => {
                updatedFrame[idxToPaint] = activeColor;
              });
              return updatedFrame;
            }
            return f;
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
  }, [dragStart, dragEnd, drawMode, activeColor, activeWidth, activeHeight, mirrorH, mirrorV, frames, currentFrameIdx]);

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
      const fileInput = document.getElementById('anim-json-import-file') as HTMLInputElement;
      fileInput?.click();
    };
    const onShare = () => handleShare();
    const onPlayPause = () => setIsPlaying(prev => !prev);
    const onAddFrame = () => handleAddFrame();
    const onDuplicate = () => handleDuplicateFrame();
    const onPrevFrame = () => setCurrentFrameIdx(prev => (prev - 1 + frames.length) % frames.length);
    const onNextFrame = () => setCurrentFrameIdx(prev => (prev + 1) % frames.length);
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
    document.addEventListener('app-shortcut-play-pause', onPlayPause);
    document.addEventListener('app-shortcut-add-frame', onAddFrame);
    document.addEventListener('app-shortcut-duplicate', onDuplicate);
    document.addEventListener('app-shortcut-prev-frame', onPrevFrame);
    document.addEventListener('app-shortcut-next-frame', onNextFrame);
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
      document.removeEventListener('app-shortcut-play-pause', onPlayPause);
      document.removeEventListener('app-shortcut-add-frame', onAddFrame);
      document.removeEventListener('app-shortcut-duplicate', onDuplicate);
      document.removeEventListener('app-shortcut-prev-frame', onPrevFrame);
      document.removeEventListener('app-shortcut-next-frame', onNextFrame);
      document.removeEventListener('app-shortcut-rect', onRect);
      document.removeEventListener('app-shortcut-circle', onCircle);
      document.removeEventListener('app-shortcut-line', onLine);
    };
  }, [frames, activeColor, drawMode, animName, animType, prebuiltId, currentFrameIdx, frameRate, isPlaying, mirrorH, mirrorV, history, redoStack]);

  const handleSizeChange = (newSize: number) => {
    setSize(newSize);
    if (newSize > 0) {
      const w = newSize === 80 ? 80 : newSize;
      const h = newSize === 80 ? 16 : newSize;
      setActiveWidth(w);
      setActiveHeight(h);
      setInputW(w.toString());
      setInputH(h.toString());
      const nextFrames = frames.map(() => generateBlankGrid(w, h));
      setFrames(nextFrames);
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
    setSize(0); // Custom Size
    const nextFrames = frames.map(() => generateBlankGrid(w, h));
    setFrames(nextFrames);
    setHistory([]);
    setRedoStack([]);
  };

  const currentWidth = activeWidth;
  const currentHeight = activeHeight;

  const paintCell = (cellIdx: number, color: string) => {
    const w = currentWidth;
    const h = currentHeight;
    const x = cellIdx % w;
    const y = Math.floor(cellIdx / w);

    const targetIndices = new Set<number>();
    targetIndices.add(cellIdx);

    if (mirrorH) {
      targetIndices.add(y * w + (w - 1 - x));
    }
    if (mirrorV) {
      targetIndices.add((h - 1 - y) * w + x);
    }
    if (mirrorH && mirrorV) {
      targetIndices.add((h - 1 - y) * w + (w - 1 - x));
    }

    setFrames(prev => {
      const next = prev.map((f, idx) => {
        if (idx === currentFrameIdx) {
          const updatedFrame = [...f];
          targetIndices.forEach(idxToPaint => {
            updatedFrame[idxToPaint] = color;
          });
          return updatedFrame;
        }
        return f;
      });
      return next;
    });
  };

  const floodFill = (startIdx: number, replacementColor: string) => {
    const activeFrame = frames[currentFrameIdx] || generateBlankGrid(activeWidth, activeHeight);
    const targetColor = activeFrame[startIdx];
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
        if (!visited.has(n) && activeFrame[n] === targetColor) {
          visited.add(n);
          queue.push(n);
        }
      }
    }

    const expandedIndices = getMirroredIndices(visited, w, h);

    setHistory(prev => [...prev, frames]);
    setRedoStack([]);
    setFrames(prev => {
      return prev.map((f, idx) => {
        if (idx === currentFrameIdx) {
          const next = [...f];
          expandedIndices.forEach(idxToPaint => {
            next[idxToPaint] = replacementColor;
          });
          return next;
        }
        return f;
      });
    });
  };

  const handleCellMouseDown = (e: React.MouseEvent, cellIdx: number) => {
    if (e.button === 1) return; // ignore middle click
    if (e.button === 2) {
      e.preventDefault();
    }
    
    if (drawMode === 'fill') {
      const color = e.button === 2 ? '#00000000' : activeColor;
      floodFill(cellIdx, color);
      return;
    }

    if (['rect', 'circle', 'line'].includes(drawMode)) {
      setDragStart(cellIdx);
      setDragEnd(cellIdx);
      return;
    }

    // Save history before change
    setHistory(prev => [...prev, frames]);
    setRedoStack([]);

    const color = e.button === 2 ? '#00000000' : (drawMode === 'pencil' ? activeColor : '#00000000');
    activeStrokeColorRef.current = color;
    isDrawingRef.current = true;

    paintCell(cellIdx, color);
  };

  const handleCellMouseEnter = (cellIdx: number) => {
    if (['rect', 'circle', 'line'].includes(drawMode)) {
      if (dragStart !== null) {
        setDragEnd(cellIdx);
      }
      return;
    }

    if (isDrawingRef.current) {
      paintCell(cellIdx, activeStrokeColorRef.current);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));
    setRedoStack(prev => [...prev, frames]);
    setFrames(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, prev.length - 1));
    setHistory(prev => [...prev, frames]);
    setFrames(next);
  };



  const handleAddFrame = () => {
    setHistory(prev => [...prev, frames]);
    setRedoStack([]);
    setFrames([...frames, generateBlankGrid(currentWidth, currentHeight)]);
    setCurrentFrameIdx(frames.length);
  };

  const handleDuplicateFrame = () => {
    setHistory(prev => [...prev, frames]);
    setRedoStack([]);
    const frameToCopy = [...frames[currentFrameIdx]];
    setFrames([...frames, frameToCopy]);
    setCurrentFrameIdx(frames.length);
  };

  const handleDeleteFrame = (idxToDelete: number) => {
    if (frames.length <= 1) return;
    setHistory(prev => [...prev, frames]);
    setRedoStack([]);
    const nextFrames = frames.filter((_, idx) => idx !== idxToDelete);
    setFrames(nextFrames);
    setCurrentFrameIdx(Math.max(0, currentFrameIdx - 1));
  };

  const handleClear = () => {
    setHistory(prev => [...prev, frames]);
    setRedoStack([]);
    const nextFrames = [...frames];
    nextFrames[currentFrameIdx] = generateBlankGrid(currentWidth, currentHeight);
    setFrames(nextFrames);
  };

  const handleFillAll = () => {
    setHistory(prev => [...prev, frames]);
    setRedoStack([]);
    const nextFrames = [...frames];
    nextFrames[currentFrameIdx] = Array(currentWidth * currentHeight).fill(activeColor);
    setFrames(nextFrames);
  };

  // Local Save
  const handleSave = () => {
    if (!animName.trim()) return;
    const newAnim: AnimationPreset = {
      id: 'anim-' + Date.now(),
      name: animName,
      animType,
      prebuiltId: animType === 'prebuilt' ? prebuiltId : undefined,
      frames: animType === 'custom' ? frames : undefined,
      width: currentWidth,
      height: currentHeight,
      frameRate
    };
    onSaveAnimation(newAnim);
    window.showToast('Animation saved locally!', 'success');
  };

  // Export JSON
  const handleExport = () => {
    const exportData = {
      name: animName,
      animType,
      prebuiltId,
      frames: animType === 'custom' ? frames : undefined,
      width: currentWidth,
      height: currentHeight,
      frameRate
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${animName.replace(/\s+/g, '_')}_animation.json`);
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
          if (parsed.animType) {
            setHistory(prev => [...prev, frames]);
            setRedoStack([]);
            setAnimName(parsed.name || 'Imported Anim');
            setAnimType(parsed.animType);
            if (parsed.prebuiltId) setPrebuiltId(parsed.prebuiltId);
            if (parsed.frames && parsed.frames.length > 0) {
              const w = parsed.width || 8;
              const h = parsed.height || 8;
              setFrames(parsed.frames);
              setSize((w === 80 && h === 16) ? 80 : (w === h ? w : 0));
              setInputW(w.toString());
              setInputH(h.toString());
              setActiveWidth(w);
              setActiveHeight(h);
              setCurrentFrameIdx(0);
            }
            if (parsed.frameRate) setFrameRate(parsed.frameRate);
          }
        } catch (err) {
          window.showToast('Invalid JSON animation format', 'error');
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
      setHistory(prev => [...prev, frames]);
      setRedoStack([]);
      const nextFrames = [...frames];
      nextFrames[currentFrameIdx] = importPreviewPixels;
      setFrames(nextFrames);
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

  const handleExportFramePNG = () => {
    const canvas = document.createElement('canvas');
    const scale = 32;
    canvas.width = activeWidth * scale;
    canvas.height = activeHeight * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentFrame = frames[currentFrameIdx] || [];
    currentFrame.forEach((color, idx) => {
      const x = idx % activeWidth;
      const y = Math.floor(idx / activeWidth);
      if (color !== '#00000000') {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    });

    const link = document.createElement('a');
    link.download = `${animName.toLowerCase().replace(/\s+/g, '_') || 'animation'}_frame_${currentFrameIdx + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleExportSpritesheetPNG = () => {
    const canvas = document.createElement('canvas');
    const scale = 32;
    canvas.width = activeWidth * scale * frames.length;
    canvas.height = activeHeight * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    frames.forEach((frame, fIdx) => {
      frame.forEach((color, idx) => {
        const x = idx % activeWidth;
        const y = Math.floor(idx / activeWidth);
        if (color !== '#00000000') {
          ctx.fillStyle = color;
          ctx.fillRect((fIdx * activeWidth + x) * scale, y * scale, scale, scale);
        }
      });
    });

    const link = document.createElement('a');
    link.download = `${animName.toLowerCase().replace(/\s+/g, '_') || 'animation'}_spritesheet.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = async () => {
    setIsPublishing(true);
    setIsPublished(false);
    try {
      const shareData = {
        id: 'shared-anim-' + Date.now(),
        name: animName,
        animType,
        prebuiltId,
        frames: animType === 'custom' ? frames : undefined,
        width: currentWidth,
        height: currentHeight,
        frameRate
      };
      await onPublishToCommunity('animation', shareData);
      setIsPublished(true);
      setTimeout(() => setIsPublished(false), 3000);
    } catch (err) {
      console.error("Publish error:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const loadPreset = (anim: AnimationPreset) => {
    setHistory(prev => [...prev, frames]);
    setRedoStack([]);
    setAnimName(anim.name);
    setAnimType(anim.animType);
    if (anim.prebuiltId) setPrebuiltId(anim.prebuiltId);
    if (anim.frames && anim.frames.length > 0) {
      const w = anim.width || 8;
      const h = anim.height || 8;
      setFrames(anim.frames);
      setSize((w === 80 && h === 16) ? 80 : (w === h ? w : 0));
      setInputW(w.toString());
      setInputH(h.toString());
      setActiveWidth(w);
      setActiveHeight(h);
      setCurrentFrameIdx(0);
    }
    setFrameRate(anim.frameRate);
  };

  return (
    <div className="builder-layout-grid">
      {/* Column 1: Local Library & Actions */}
      <div className="glass-panel workspace-panel" style={{ height: '100%', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 className="panel-header">Local Library</h3>
          <div className="saved-items-scrollbar-box" style={{ flex: 1, overflowY: 'auto', maxHeight: '420px', marginTop: '10px' }}>
            {animations.length === 0 ? (
              <p style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-light)', textAlign: 'center', marginTop: '10px' }}>No saved animations yet.</p>
            ) : (
              animations.map((an) => (
                <div 
                  key={an.id} 
                  className="saved-asset-card"
                  onClick={() => loadPreset(an)}
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      {an.frames && an.frames.length > 0 ? (
                        <AssetPreview pixels={an.frames[0]} width={an.width || 80} height={an.height || 16} type="animation" />
                      ) : (
                        <Play size={8} style={{ color: 'var(--primary)' }} />
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{an.name}</p>
                      <p style={{ fontSize: '9px', color: 'var(--text-light)', textTransform: 'capitalize' }}>
                        {an.frames ? `${an.width}x${an.height} timeline` : an.animType} preset
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAnimation(an.id);
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
              <button
                onClick={handleExport}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Download size={12} /> Export JSON
              </button>

              {animType === 'custom' && (
                <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                  <button
                    onClick={handleExportFramePNG}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
                    title="Export Current Frame as PNG"
                  >
                    <Download size={10} /> Frame PNG
                  </button>

                  <button
                    onClick={handleExportSpritesheetPNG}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
                    title="Export All Frames side-by-side as Spritesheet PNG"
                  >
                    <Download size={10} /> Spritesheet
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '500' }}>Import</label>
              <label className="btn btn-secondary" style={{ padding: '8px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: 0 }}>
                <Upload size={12} /> Choose File
                <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} id="anim-json-import-file" />
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
        {/* Prebuilt selection */}
        {animType === 'prebuilt' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '16px 16px 0 16px', flex: 1 }}>
              {/* Live animated preview canvas */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                <span className="prop-label" style={{ fontSize: '10px', opacity: 0.6 }}>Live LED Simulator Preview</span>
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
                  <canvas
                    ref={previewCanvasRef}
                    width={800}
                    height={160}
                    style={{
                      position: 'absolute',
                      left: '9%',
                      width: '84%',
                      top: '18%',
                      height: '74%',
                      borderRadius: '4px',
                      backgroundColor: '#060608'
                    }}
                  />
                </div>
              </div>
            </div>

              {/* Prebuilt FX Options Toolbar on top of bottom Menu */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <span className="prop-label" style={{ fontSize: '10px', opacity: 0.6 }}>Prebuilt FX Simulations</span>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px', maxWidth: '900px' }}>
                  <button 
                    onClick={() => scrollFX('left')}
                    className="btn btn-secondary btn-circle"
                    style={{ padding: '8px', width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Scroll Left"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div 
                    ref={fxScrollRef}
                    className="hide-scrollbar"
                    style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      overflowX: 'auto', 
                      whiteSpace: 'nowrap', 
                      flex: 1, 
                      padding: '8px 4px',
                      alignItems: 'center',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {[
                      // 1. Cosmic & Space
                      { id: 'supernova', name: 'Supernova', icon: SunDim },
                      { id: 'pulsar', name: 'Pulsar Star', icon: Atom },

                      // 2. Nature, Weather & Landscapes
                      { id: 'sunrise', name: 'Sunrise', icon: Sunrise },
                      { id: 'sunset', name: 'Sunset', icon: Sunset },
                      { id: 'afternoon', name: 'Glowing Sun', icon: Sun },
                      { id: 'night', name: 'Rising Moon', icon: Moon },
                      { id: 'beach', name: 'Beach Wave', icon: Palmtree },
                      { id: 'tsunami', name: 'Tsunami', icon: Waves },
                      { id: 'drippingrain', name: 'Dripping Rain', icon: CloudRain },
                      { id: 'tornado', name: 'Tornado', icon: Tornado },

                      // 3. Fluid & Plasma Waves
                      { id: 'plasma', name: 'Plasma', icon: Spline },
                      { id: 'aurora', name: 'Aurora', icon: Wind },
                      { id: 'rainbowwaves', name: 'Rainbow Waves', icon: Palette },
                      { id: 'wavefront', name: 'Wavefront', icon: Activity },
                      { id: 'watercells', name: 'Voronoi Cells', icon: Droplet },
                      { id: 'waterfall', name: 'Waterfall', icon: ArrowDown },

                      // 4. Fractals & Math Curves
                      { id: 'attractor3d', name: 'Rössler Attractor', icon: Orbit },
                      { id: 'lissajous3d', name: '3D Lissajous', icon: Infinity },
                      { id: 'kaleidoscope', name: 'Kaleidoscope', icon: Grid },
                      { id: 'vortex', name: 'Vortex', icon: RotateCw },
                      { id: 'spiral', name: 'Spiral', icon: Disc },

                      // 5. Particles & Physics (with Stars and Hyperspace near Flow Field)
                      { id: 'particles', name: 'Gravity Well', icon: Cpu },
                      { id: 'noiseflow', name: 'Flow Field', icon: Route },
                      { id: 'stars', name: 'Stars', icon: Sparkles },
                      { id: 'hyperspace', name: 'Hyperspace', icon: Rocket },
                      { id: 'fireflies', name: 'Fireflies', icon: Lightbulb },
                      { id: 'bounceballs', name: 'Bouncing Balls', icon: CircleDot },
                      { id: 'sparks', name: 'Plasma Sparks', icon: Zap },

                      // 6. Helixes & 3D Structures
                      { id: 'dnahelix', name: 'DNA Helix', icon: Dna },
                      { id: 'dna3d', name: '3D DNA', icon: GitMerge },
                      { id: 'tunnel', name: '3D Tunnel', icon: Maximize2 },

                      // 7. Fire, Heat & Explosions
                      { id: 'firefastled', name: 'FastLED Fire', icon: Flame },
                      { id: 'combustion', name: 'Combustion', icon: Bomb },
                      { id: 'firecracker', name: 'Firecracker', icon: ZapOff },
                      { id: 'fireworks', name: 'Fireworks', icon: PartyPopper },
                      { id: 'starburst', name: 'Starburst', icon: Sun },
                      { id: 'ripples', name: 'Water Ripples', icon: Target },
                      { id: 'metaballs', name: 'Metaballs', icon: Droplets },
                      { id: 'lavalamp', name: 'Lava Lamp', icon: GlassWater },

                      // 8. Grid, Game & Block Scenarios
                      { id: 'snake', name: 'Snake Game', icon: Gamepad2 },
                      { id: 'sandworm', name: 'Sand Worm', icon: Bug },
                      { id: 'blocks', name: 'Falling Blocks', icon: Boxes },
                      { id: 'colorrain', name: 'Color Rain', icon: CloudLightning }
                    ].map((fx) => {
                      const IconComponent = fx.icon;
                      return (
                        <button
                          key={fx.id}
                          onClick={() => setPrebuiltId(fx.id as any)}
                          className={`btn btn-circle ${prebuiltId === fx.id ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '8px', width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }}
                          title={`${fx.name} Effect`}
                        >
                          <IconComponent size={16} />
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => scrollFX('right')}
                    className="btn btn-secondary btn-circle"
                    style={{ padding: '8px', width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Scroll Right"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Custom timeline frame editor */}
          {animType === 'custom' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '16px 16px 0 16px', flex: 1 }}>
              {/* Draw Matrix */}
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
                    {(frames[currentFrameIdx] || generateBlankGrid(currentWidth, currentHeight)).map((color, idx) => {
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

              {/* Play controls and timeline */}
              <div style={{ width: '100%', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="btn btn-primary btn-circle"
                      style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0 }}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)' }}>Timeline <kbd style={{ margin: '0 0 0 4px' }}>Space</kbd></span>
                      <span style={{ fontSize: '10px', color: 'var(--text-light)' }}>Frame {currentFrameIdx + 1} of {frames.length}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={handleAddFrame}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '10px' }}
                    >
                      <Plus size={10} /> Add Frame <kbd>A</kbd>
                    </button>
                    <button
                      onClick={handleDuplicateFrame}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '10px' }}
                    >
                      <Copy size={12} /> Duplicate <kbd>D</kbd>
                    </button>
                    <button
                      onClick={() => handleDeleteFrame(currentFrameIdx)}
                      disabled={frames.length <= 1}
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '10px' }}
                    >
                      Delete Frame <kbd>Del</kbd>
                    </button>
                  </div>
                </div>

                {/* Slider timeline frames */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.03)' }}>
                  {frames.map((frame, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentFrameIdx(idx);
                        setIsPlaying(false);
                      }}
                      style={{
                        position: 'relative',
                        flexShrink: 0,
                        width: '75px',
                        height: '22px',
                        borderRadius: '4px',
                        border: currentFrameIdx === idx ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.08)',
                        background: '#0f172a',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <AssetPreview pixels={frame} width={currentWidth} height={currentHeight} type="animation" />
                      <span style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#ffffff', fontSize: '8px', padding: '1px 3px', borderTopLeftRadius: '3px' }}>{idx + 1}</span>
                    </button>
                  ))}
                </div>

                {/* Frame rate FPS control */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span className="prop-label" style={{ fontSize: '10px' }}>Playback Speed: {frameRate} FPS</span>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    value={frameRate}
                    onChange={(e) => setFrameRate(Number(e.target.value))}
                    className="slider-input"
                    style={{ width: '160px' }}
                  />
                </div>
              </div>

            {/* Toolbar: Color Swatches & Drawing Options */}

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

                  <div style={{ width: '1px', height: '20px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

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
            </>
          )}
        </div>

      {/* Column 3: Settings Panel */}
      <div className="glass-panel workspace-panel" style={{ height: '100%', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 className="panel-header">Animation Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '500' }}>Animation Name</label>
              <input
                type="text"
                className="glass-input"
                style={{ fontSize: '14px', fontWeight: 'bold', width: '100%' }}
                value={animName}
                onChange={(e) => setAnimName(e.target.value)}
                placeholder="Animation name..."
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '500' }}>Animation Type</label>
              <div style={{ 
                width: '100%', 
                display: 'flex', 
                background: 'rgba(15, 23, 42, 0.04)', 
                borderRadius: '20px', 
                padding: '4px',
                position: 'relative',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
              }}>
                <button
                  onClick={() => setAnimType('prebuilt')}
                  style={{ 
                    flex: 1, 
                    padding: '8px 12px', 
                    fontSize: '11px', 
                    fontWeight: '600',
                    textAlign: 'center',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    zIndex: 2,
                    background: animType === 'prebuilt' ? 'linear-gradient(135deg, #ff7e33, #ea580c)' : 'transparent',
                    color: animType === 'prebuilt' ? '#ffffff' : 'var(--text-main)',
                    boxShadow: animType === 'prebuilt' ? '0 2px 4px rgba(234, 88, 12, 0.3)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Prebuilt
                </button>
                <button
                  onClick={() => setAnimType('custom')}
                  style={{ 
                    flex: 1, 
                    padding: '8px 12px', 
                    fontSize: '11px', 
                    fontWeight: '600',
                    textAlign: 'center',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    zIndex: 2,
                    background: animType === 'custom' ? 'linear-gradient(135deg, #ff7e33, #ea580c)' : 'transparent',
                    color: animType === 'custom' ? '#ffffff' : 'var(--text-main)',
                    boxShadow: animType === 'custom' ? '0 2px 4px rgba(234, 88, 12, 0.3)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Custom Timeline
                </button>
              </div>
            </div>

            {animType === 'custom' && (
              <>
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
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
          <button 
            onClick={handleSave}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Save size={14} /> Save Animation <kbd>S</kbd>
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
