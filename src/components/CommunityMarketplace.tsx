import React, { useState, useEffect, useRef } from 'react';
import type { Sticker, BackgroundPreset, AnimationPreset, Scene, Widget } from '../types/studio';
import { Search, Download, Check, Sparkles, Cloud, Palette, Layers, Play, X, Eye, LayoutGrid } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AssetPreview } from './AssetPreview';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { DigitalTwin } from './DigitalTwin';

interface CommunityMarketplaceProps {
  onDownloadSticker: (st: Sticker) => void;
  onDownloadBackground: (bg: BackgroundPreset) => void;
  onDownloadAnimation: (anim: AnimationPreset) => void;
  onDownloadScene: (sc: Scene) => void;
  navBar?: React.ReactNode;
}

// Inline component to preview a scene layout onto an 80x16 canvas snapshot
const ScenePreview: React.FC<{ widgets: any[] }> = ({ widgets }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 80, 16);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 80, 16);

    const sorted = [...(widgets || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    for (const w of sorted) {
      if (w.type === 'background') {
        if (w.bgType === 'solid' && w.colors?.[0]) {
          ctx.fillStyle = w.colors[0];
          ctx.fillRect(w.x, w.y, w.width, w.height);
        } else if (w.bgType === 'gradient' && w.colors?.[0]) {
          const grad = ctx.createLinearGradient(w.x, w.y, w.x + w.width, w.y);
          grad.addColorStop(0, w.colors[0]);
          grad.addColorStop(1, w.colors[1] || w.colors[0]);
          ctx.fillStyle = grad;
          ctx.fillRect(w.x, w.y, w.width, w.height);
        } else if (w.bgType === 'pixels' && w.pixelData) {
          for (let py = 0; py < w.height; py++) {
            for (let px = 0; px < w.width; px++) {
              const color = w.pixelData[py * w.width + px];
              if (color && color !== '#00000000') {
                ctx.fillStyle = color;
                ctx.fillRect(w.x + px, w.y + py, 1, 1);
              }
            }
          }
        }
      } else if (w.type === 'sticker') {
        if (w.pixelData) {
          for (let py = 0; py < w.height; py++) {
            for (let px = 0; px < w.width; px++) {
              const color = w.pixelData[py * w.width + px];
              if (color && color !== '#00000000') {
                ctx.fillStyle = color;
                ctx.fillRect(w.x + px, w.y + py, 1, 1);
              }
            }
          }
        }
      } else if (w.type === 'shape') {
        ctx.fillStyle = w.color;
        if (w.shapeType === 'rect') {
          ctx.fillRect(w.x, w.y, w.width, w.height);
        } else if (w.shapeType === 'circle') {
          ctx.beginPath();
          ctx.arc(w.x + w.width/2, w.y + w.height/2, Math.min(w.width, w.height)/2, 0, Math.PI*2);
          ctx.fill();
        } else if (w.shapeType === 'line' || w.shapeType === 'hline') {
          ctx.fillRect(w.x, w.y, w.width, 1);
        } else if (w.shapeType === 'vline') {
          ctx.fillRect(w.x, w.y, 1, w.height);
        }
      } else if (w.type === 'animation') {
        if (w.animType === 'custom' && w.frames && w.frames[0]) {
          const frame = w.frames[0];
          for (let py = 0; py < w.height; py++) {
            for (let px = 0; px < w.width; px++) {
              const color = frame[py * w.width + px];
              if (color && color !== '#00000000') {
                ctx.fillStyle = color;
                ctx.fillRect(w.x + px, w.y + py, 1, 1);
              }
            }
          }
        } else {
          ctx.fillStyle = 'rgba(234, 88, 12, 0.35)'; // translucent Cyber Orange for prebuilt effects
          ctx.fillRect(w.x, w.y, w.width, w.height);
        }
      } else if (['text', 'date', 'time', 'clock', 'weather', 'weather-temp', 'weather-humi', 'weather-brief', 'timer', 'youtube-sub'].includes(w.type)) {
        ctx.fillStyle = w.color || '#ffffff';
        const textH = Math.min(4, w.height);
        ctx.fillRect(w.x, w.y + (w.height - textH)/2, w.width, textH);
      }
    }
  }, [widgets]);

  return (
    <canvas 
      ref={canvasRef} 
      width={80} 
      height={16} 
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'block',
        imageRendering: 'pixelated',
        borderRadius: '4px',
        backgroundColor: '#0f172a'
      }} 
    />
  );
};

export const CommunityMarketplace: React.FC<CommunityMarketplaceProps> = ({
  onDownloadSticker,
  onDownloadBackground,
  onDownloadAnimation,
  onDownloadScene,
  navBar
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'scenes' | 'stickers' | 'backgrounds' | 'animations'>('scenes');
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [previewAsset, setPreviewAsset] = useState<{ asset: any; type: 'scene' | 'sticker' | 'background' | 'animation' } | null>(null);

  const getPreviewWidgetsAndStickers = () => {
    if (!previewAsset) return { widgets: [], stickers: [] };
    const { asset, type } = previewAsset;
    let widgets: Widget[] = [];
    let stickersList: Sticker[] = [];

    if (type === 'scene') {
      widgets = asset.widgets || [];
    } else if (type === 'sticker') {
      const stickerWidget: Widget = {
        id: 'preview-sticker-widget',
        type: 'sticker',
        name: asset.name,
        x: Math.round((80 - (asset.width || 8)) / 2),
        y: Math.round((16 - (asset.height || 8)) / 2),
        width: asset.width || 8,
        height: asset.height || 8,
        zIndex: 1,
        stickerId: asset.id,
        pixelData: asset.pixels || [],
        motion: 'none'
      };
      widgets = [stickerWidget];
      stickersList = [asset];
    } else if (type === 'background') {
      const bgWidget: Widget = {
        id: 'preview-background-widget',
        type: 'background',
        name: asset.name,
        x: 0,
        y: 0,
        width: asset.width || 80,
        height: asset.height || 16,
        zIndex: 0,
        bgType: asset.bgType,
        colors: asset.colors || ['#000000'],
        cornerRadius: asset.cornerRadius || 0,
        depthEffect: asset.depthEffect || false,
        animationEffect: asset.animationEffect || 'none',
        pixelData: asset.pixels
      };
      widgets = [bgWidget];
    } else if (type === 'animation') {
      const animWidget: Widget = {
        id: 'preview-animation-widget',
        type: 'animation',
        name: asset.name,
        x: 0,
        y: 0,
        width: asset.width || 80,
        height: asset.height || 16,
        zIndex: 1,
        animType: asset.animType,
        prebuiltId: asset.prebuiltId,
        frames: asset.frames,
        frameRate: asset.frameRate || 8
      };
      widgets = [animWidget];
    }

    return { widgets, stickers: stickersList };
  };

  // Community lists from Firestore
  const [communityScenes, setCommunityScenes] = useState<Scene[]>([]);
  const [communityStickers, setCommunityStickers] = useState<Sticker[]>([]);
  const [communityBackgrounds, setCommunityBackgrounds] = useState<BackgroundPreset[]>([]);
  const [communityAnimations, setCommunityAnimations] = useState<AnimationPreset[]>([]);

  // Local fallback mock data (used if firestore returns empty or fails)
  const mockStickers: Sticker[] = [
    {
      id: 'comm-pikachu-8',
      name: 'Retro Pikachu Spark',
      width: 8,
      height: 8,
      pixels: [
        '#00000000', '#00000000', '#facc15', '#facc15', '#00000000', '#00000000', '#facc15', '#00000000',
        '#00000000', '#facc15', '#facc15', '#facc15', '#facc15', '#facc15', '#facc15', '#facc15',
        '#facc15', '#ffffff', '#000000', '#facc15', '#facc15', '#ffffff', '#000000', '#facc15',
        '#facc15', '#facc15', '#facc15', '#facc15', '#facc15', '#facc15', '#facc15', '#facc15',
        '#facc15', '#f87171', '#facc15', '#facc15', '#facc15', '#f87171', '#facc15', '#facc15',
        '#00000000', '#facc15', '#facc15', '#f59e0b', '#f59e0b', '#facc15', '#facc15', '#00000000',
        '#00000000', '#00000000', '#facc15', '#facc15', '#facc15', '#facc15', '#00000000', '#00000000',
        '#00000000', '#00000000', '#facc15', '#00000000', '#00000000', '#facc15', '#00000000', '#00000000'
      ]
    },
    {
      id: 'comm-skull-8',
      name: 'Skull Head',
      width: 8,
      height: 8,
      pixels: [
        '#00000000', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#00000000',
        '#cbd5e1', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#cbd5e1',
        '#cbd5e1', '#ffffff', '#000000', '#ffffff', '#ffffff', '#000000', '#ffffff', '#cbd5e1',
        '#cbd5e1', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#cbd5e1',
        '#00000000', '#cbd5e1', '#000000', '#cbd5e1', '#cbd5e1', '#000000', '#cbd5e1', '#00000000',
        '#00000000', '#cbd5e1', '#ffffff', '#cbd5e1', '#cbd5e1', '#ffffff', '#cbd5e1', '#00000000',
        '#00000000', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#00000000',
        '#00000000', '#00000000', '#cbd5e1', '#000000', '#000000', '#cbd5e1', '#00000000', '#00000000'
      ]
    },
    {
      id: 'comm-alien-8',
      name: 'Space Invader sprite',
      width: 8,
      height: 8,
      pixels: [
        '#00000000', '#00000000', '#22c55e', '#00000000', '#00000000', '#22c55e', '#00000000', '#00000000',
        '#00000000', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#00000000',
        '#00000000', '#22c55e', '#ffffff', '#22c55e', '#22c55e', '#ffffff', '#22c55e', '#00000000',
        '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e',
        '#22c55e', '#00000000', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#00000000', '#22c55e',
        '#22c55e', '#00000000', '#22c55e', '#00000000', '#00000000', '#22c55e', '#00000000', '#22c55e',
        '#00000000', '#00000000', '#00000000', '#22c55e', '#22c55e', '#00000000', '#00000000', '#00000000',
        '#00000000', '#00000000', '#22c55e', '#00000000', '#00000000', '#22c55e', '#00000000', '#00000000'
      ]
    }
  ];

  const mockBackgrounds: BackgroundPreset[] = [
    {
      id: 'comm-bg-aurora',
      name: 'Aurora Borealis',
      bgType: 'gradient',
      colors: ['#059669', '#1d4ed8'],
      cornerRadius: 0,
      depthEffect: true,
      animationEffect: 'wave'
    },
    {
      id: 'comm-bg-neon',
      name: 'Synthwave Skyline',
      bgType: 'gradient',
      colors: ['#f43f5e', '#581c87'],
      cornerRadius: 4,
      depthEffect: true,
      animationEffect: 'scroll-left'
    },
    {
      id: 'comm-bg-matrix',
      name: 'Pure Binary',
      bgType: 'pattern',
      colors: ['#042f1a', '#10b981'],
      cornerRadius: 0,
      depthEffect: false,
      animationEffect: 'none'
    }
  ];

  const mockAnimations: AnimationPreset[] = [
    {
      id: 'comm-anim-water',
      name: 'Rippling Water',
      animType: 'prebuilt',
      prebuiltId: 'ripples',
      width: 80,
      height: 16,
      frameRate: 15
    },
    {
      id: 'comm-anim-neon',
      name: 'Glowing Starfield',
      animType: 'prebuilt',
      prebuiltId: 'stars',
      width: 80,
      height: 16,
      frameRate: 20
    }
  ];

  const mockScenes: Scene[] = [
    {
      id: 'comm-scene-clock',
      name: 'Retro Ambient Clock',
      createdAt: Date.now(),
      widgets: [
        {
          id: 'bg-1',
          type: 'background',
          name: 'Ambient Fill',
          x: 0,
          y: 0,
          width: 80,
          height: 16,
          zIndex: 1,
          bgType: 'gradient',
          colors: ['#3b82f6', '#8b5cf6']
        },
        {
          id: 'clock-1',
          type: 'clock',
          name: 'Large Clock',
          x: 4,
          y: 2,
          width: 72,
          height: 12,
          zIndex: 2,
          color: '#ffffff',
          shadow: true,
          shadowColor: '#000000bb',
          fontFamily: 'retro',
          fontSize: 12,
          dateFormat: 'DD MMM',
          timeFormat: 'HH:MM AM/PM'
        }
      ]
    }
  ];

  // Fetch from Firestore
  const fetchCommunityData = async () => {
    setIsLoading(true);
    try {
      // Fetch all collections concurrently using Promise.all with limits to optimize speed
      const [stickersSnap, bgsSnap, animsSnap, scenesSnap] = await Promise.all([
        getDocs(query(collection(db, 'community_stickers'), orderBy('createdAt', 'desc'), limit(30))),
        getDocs(query(collection(db, 'community_backgrounds'), orderBy('createdAt', 'desc'), limit(30))),
        getDocs(query(collection(db, 'community_animations'), orderBy('createdAt', 'desc'), limit(30))),
        getDocs(query(collection(db, 'community_scenes'), orderBy('createdAt', 'desc'), limit(30)))
      ]);

      // 1. Process Stickers
      const loadedStickers: Sticker[] = [];
      stickersSnap.forEach((doc) => {
        const d = doc.data();
        loadedStickers.push({
          id: doc.id,
          name: d.name,
          width: d.width,
          height: d.height,
          pixels: d.pixels
        });
      });
      setCommunityStickers(loadedStickers.length > 0 ? loadedStickers : mockStickers);

      // 2. Process Backgrounds
      const loadedBgs: BackgroundPreset[] = [];
      bgsSnap.forEach((doc) => {
        const d = doc.data();
        loadedBgs.push({
          id: doc.id,
          name: d.name,
          bgType: d.bgType,
          colors: d.colors,
          cornerRadius: d.cornerRadius,
          depthEffect: d.depthEffect,
          animationEffect: d.animationEffect,
          width: d.width,
          height: d.height,
          pixels: d.pixels
        });
      });
      setCommunityBackgrounds(loadedBgs.length > 0 ? loadedBgs : mockBackgrounds);

      // 3. Process Animations
      const loadedAnims: AnimationPreset[] = [];
      animsSnap.forEach((doc) => {
        const d = doc.data();
        loadedAnims.push({
          id: doc.id,
          name: d.name,
          animType: d.animType,
          prebuiltId: d.prebuiltId,
          frames: d.frames,
          width: d.width,
          height: d.height,
          frameRate: d.frameRate
        });
      });
      setCommunityAnimations(loadedAnims.length > 0 ? loadedAnims : mockAnimations);

      // 4. Process Scenes
      const loadedScenes: Scene[] = [];
      scenesSnap.forEach((doc) => {
        const d = doc.data();
        loadedScenes.push({
          id: doc.id,
          name: d.name,
          widgets: typeof d.widgets === 'string' ? JSON.parse(d.widgets) : d.widgets,
          createdAt: d.createdAt || Date.now()
        });
      });
      setCommunityScenes(loadedScenes.length > 0 ? loadedScenes : mockScenes);

    } catch (error) {
      console.warn("Could not retrieve community datasets from firestore. Using seed fallbacks.", error);
      setCommunityStickers(mockStickers);
      setCommunityBackgrounds(mockBackgrounds);
      setCommunityAnimations(mockAnimations);
      setCommunityScenes(mockScenes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#06b6d4', '#ec4899']
    });
  };

  const handleDownload = (type: 'scene' | 'sticker' | 'background' | 'animation', item: any) => {
    if (type === 'sticker') {
      onDownloadSticker(item);
    } else if (type === 'background') {
      onDownloadBackground(item);
    } else if (type === 'animation') {
      onDownloadAnimation(item);
    } else if (type === 'scene') {
      onDownloadScene(item);
    }
    
    setDownloadedIds(prev => [...prev, item.id]);
    triggerConfetti();
  };

  const getFilteredScenes = () => {
    return communityScenes.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const getFilteredStickers = () => {
    return communityStickers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const getFilteredBackgrounds = () => {
    return communityBackgrounds.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const getFilteredAnimations = () => {
    return communityAnimations.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  return (
    <div className="community-container">
      {navBar}
      {/* Title Header */}
      <div className="community-header-box">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', fontWeight: 'bold' }}>
            <Sparkles className="text-cyan-500 animate-pulse" style={{ color: 'var(--secondary)' }} size={24} />
            Pixel Community Hub
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Discover, download, and publish matrix templates, stickers, and animations.</p>
        </div>

        {/* Tab navigation */}
        <div className="nav-tabs-container">
          {(['scenes', 'stickers', 'backgrounds', 'animations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`nav-tab-btn ${activeTab === tab ? 'active' : ''}`}
              style={{ padding: '6px 14px', fontSize: '11px', textTransform: 'capitalize' }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search Filter */}
      <div style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder={`Search community ${activeTab}...`}
            className="glass-input"
            style={{ paddingLeft: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={fetchCommunityData} 
          className="btn btn-secondary"
          style={{ padding: '10px 16px', fontSize: '12px', whiteSpace: 'nowrap' }}
        >
          Refresh Feed
        </button>
      </div>

      {isLoading ? (
        <div className="community-gallery-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="glass-panel community-asset-card" style={{ pointerEvents: 'none' }}>
              <div>
                {/* Image Shimmer */}
                <div 
                  className="skeleton-shimmer" 
                  style={{ 
                    width: '100%', 
                    height: activeTab === 'stickers' ? '48px' : 'auto',
                    aspectRatio: activeTab === 'stickers' ? undefined : '80 / 16',
                    borderRadius: '8px', 
                    marginBottom: '16px' 
                  }} 
                />
                {/* Title Shimmer */}
                <div 
                  className="skeleton-shimmer" 
                  style={{ 
                    width: '60%', 
                    height: '14px', 
                    borderRadius: '4px', 
                    marginBottom: '8px' 
                  }} 
                />
                {/* Subtitle Shimmer */}
                <div 
                  className="skeleton-shimmer" 
                  style={{ 
                    width: '40%', 
                    height: '10px', 
                    borderRadius: '4px' 
                  }} 
                />
              </div>
              
              {/* Button Shimmer */}
              <div 
                className="skeleton-shimmer" 
                style={{ 
                  width: '100%', 
                  height: '36px', 
                  borderRadius: '8px', 
                  marginTop: '16px' 
                }} 
              />
            </div>
          ))}
        </div>
      ) : (
        /* Assets Grid */
        <div className="community-gallery-grid">
          {activeTab === 'scenes' && getFilteredScenes().map(sc => (
            <div key={sc.id} className="glass-panel community-asset-card glass-panel-hover" onClick={() => setPreviewAsset({ asset: sc, type: 'scene' })}>
              <div className="community-preview-wrapper" style={{ marginBottom: '12px' }}>
                <div style={{ width: '100%', aspectRatio: '80 / 16', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <ScenePreview widgets={sc.widgets} />
                </div>
                <div className="preview-hover-overlay">
                  <Eye size={18} style={{ color: '#fff' }} />
                </div>
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{sc.name}</h4>
            </div>
          ))}

          {activeTab === 'stickers' && getFilteredStickers().map(st => (
            <div key={st.id} className="glass-panel community-asset-card glass-panel-hover" onClick={() => setPreviewAsset({ asset: st, type: 'sticker' })}>
              <div className="community-preview-wrapper" style={{ marginBottom: '12px' }}>
                <div 
                  style={{ 
                    width: '100%', 
                    height: '48px', 
                    background: '#0f172a', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '4px', 
                    border: '1px solid rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                  }}
                >
                  <AssetPreview pixels={st.pixels} width={st.width} height={st.height} type="sticker" />
                </div>
                <div className="preview-hover-overlay">
                  <Eye size={18} style={{ color: '#fff' }} />
                </div>
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{st.name}</h4>
            </div>
          ))}

          {activeTab === 'backgrounds' && getFilteredBackgrounds().map(bg => (
            <div key={bg.id} className="glass-panel community-asset-card glass-panel-hover" onClick={() => setPreviewAsset({ asset: bg, type: 'background' })}>
              <div className="community-preview-wrapper" style={{ marginBottom: '12px' }}>
                <div 
                  style={{
                    width: '100%',
                    aspectRatio: '80 / 16',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    background: bg.bgType === 'solid' ? bg.colors[0] : (bg.bgType === 'gradient' ? `linear-gradient(90deg, ${bg.colors[0]}, ${bg.colors[1]})` : '#0f172a')
                  }}
                >
                  {bg.pixels && (
                    <AssetPreview pixels={bg.pixels} width={bg.width || 80} height={bg.height || 16} type="background" />
                  )}
                </div>
                <div className="preview-hover-overlay">
                  <Eye size={18} style={{ color: '#fff' }} />
                </div>
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{bg.name}</h4>
            </div>
          ))}

          {activeTab === 'animations' && getFilteredAnimations().map(an => (
            <div key={an.id} className="glass-panel community-asset-card glass-panel-hover" onClick={() => setPreviewAsset({ asset: an, type: 'animation' })}>
              <div className="community-preview-wrapper" style={{ marginBottom: '12px' }}>
                <div style={{ width: '100%', aspectRatio: '80 / 16', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {an.frames && an.frames.length > 0 ? (
                    <AssetPreview pixels={an.frames[0]} width={an.width || 80} height={an.height || 16} type="animation" />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-light)', fontSize: '11px' }}>
                      <Play size={14} style={{ color: 'var(--secondary)' }} />
                      <span>{an.prebuiltId} fx</span>
                    </div>
                  )}
                </div>
                <div className="preview-hover-overlay">
                  <Eye size={18} style={{ color: '#fff' }} />
                </div>
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{an.name}</h4>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal Dialog */}
      {previewAsset && (
        <div 
          className="modal-backdrop-layer" 
          onClick={() => setPreviewAsset(null)}
          style={{ zIndex: 1100 }}
        >
          <div 
            className="glass-panel modal-dialog-box" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '640px',
              width: '90%',
              padding: '24px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(15, 23, 42, 0.08)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>
                  {previewAsset.asset.name}
                </h3>
              </div>
              <button 
                onClick={() => setPreviewAsset(null)}
                className="btn-circle"
                style={{ background: 'rgba(0,0,0,0.03)', color: 'var(--text-muted)', border: 'none', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body: Digital Twin */}
            <div 
              style={{ 
                minHeight: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                margin: '12px 0'
              }}
            >
              {(() => {
                const { widgets, stickers } = getPreviewWidgetsAndStickers();
                return (
                  <DigitalTwin
                    widgets={widgets}
                    stickers={stickers}
                    selectedWidgetId={null}
                    onSelectWidget={() => {}}
                    onUpdateWidgetPosition={() => {}}
                  />
                );
              })()}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(15, 23, 42, 0.08)' }}>
              {/* Scene/element indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {previewAsset.type === 'scene' && (
                  <>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(15,23,42,0.04)', borderRadius: '6px', padding: '3px 8px', border: '1px solid rgba(15,23,42,0.06)' }}>
                      <LayoutGrid size={11} />
                      1 Scene
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(15,23,42,0.04)', borderRadius: '6px', padding: '3px 8px', border: '1px solid rgba(15,23,42,0.06)' }}>
                      <Layers size={11} />
                      {(previewAsset.asset.widgets || []).length} Element{(previewAsset.asset.widgets || []).length !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
                {previewAsset.type === 'sticker' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(15,23,42,0.04)', borderRadius: '6px', padding: '3px 8px', border: '1px solid rgba(15,23,42,0.06)' }}>
                    <Cloud size={11} />
                    {previewAsset.asset.width}×{previewAsset.asset.height} Sticker
                  </span>
                )}
                {previewAsset.type === 'background' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(15,23,42,0.04)', borderRadius: '6px', padding: '3px 8px', border: '1px solid rgba(15,23,42,0.06)' }}>
                    <Palette size={11} />
                    {previewAsset.asset.pixels ? `${previewAsset.asset.width}×${previewAsset.asset.height} Pixel` : (previewAsset.asset.bgType || 'Solid')} BG
                  </span>
                )}
                {previewAsset.type === 'animation' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(15,23,42,0.04)', borderRadius: '6px', padding: '3px 8px', border: '1px solid rgba(15,23,42,0.06)' }}>
                    <Sparkles size={11} />
                    {previewAsset.asset.frames ? `${previewAsset.asset.frames.length} Frames` : (previewAsset.asset.prebuiltId || 'FX')}
                  </span>
                )}
              </div>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setPreviewAsset(null)}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 16px' }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDownload(previewAsset.type, previewAsset.asset);
                  }}
                  disabled={downloadedIds.includes(previewAsset.asset.id)}
                  className={`btn ${downloadedIds.includes(previewAsset.asset.id) ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ 
                    fontSize: '12px', 
                    padding: '8px 16px', 
                    background: downloadedIds.includes(previewAsset.asset.id) ? 'rgba(16, 185, 129, 0.08)' : '', 
                    color: downloadedIds.includes(previewAsset.asset.id) ? 'var(--success)' : '', 
                    border: downloadedIds.includes(previewAsset.asset.id) ? '1px solid rgba(16, 185, 129, 0.15)' : '' 
                  }}
                >
                  {downloadedIds.includes(previewAsset.asset.id) ? (
                    <><Check size={14} /> Installed</>
                  ) : (
                    <><Download size={14} /> Download</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
