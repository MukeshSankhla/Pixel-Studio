import React from 'react';
import type { Widget, Sticker, ScrollEffect, BackgroundPreset, AnimationPreset } from '../types/studio';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface PropertiesPanelProps {
  selectedWidget: Widget | null;
  stickers: Sticker[];
  backgrounds: BackgroundPreset[];
  animations: AnimationPreset[];
  onUpdateWidget: (updated: Widget) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedWidget,
  stickers,
  backgrounds,
  animations,
  onUpdateWidget
}) => {
  if (!selectedWidget) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>
        <p style={{ fontSize: '13px', fontStyle: 'italic' }}>No widget selected.</p>
        <p style={{ fontSize: '11px', marginTop: '6px', lineHeight: '1.4' }}>Select a widget on the Digital Twin or click on the left sidebar to add a new one.</p>
      </div>
    );
  }

  // Generic handle change
  const handleChange = (field: string, value: any) => {
    let extra = {};
    if (field === 'shapeType') {
      if (value === 'hline') {
        extra = { width: 12, height: 1 };
      } else if (value === 'vline') {
        extra = { width: 1, height: 12 };
      } else if (value === 'rect' || value === 'circle' || value === 'triangle' || value === 'line') {
        extra = { width: 10, height: 10 };
      }
    }

    let val = value;
    if (selectedWidget.type === 'shape') {
      const shapeType = field === 'shapeType' ? value : (selectedWidget as any).shapeType;
      if (shapeType === 'hline') {
        if (field === 'width') {
          val = Math.min(80, Math.max(1, Number(value)));
        } else if (field === 'height') {
          val = Math.min(2, Math.max(1, Number(value)));
        }
      } else if (shapeType === 'vline') {
        if (field === 'width') {
          val = Math.min(2, Math.max(1, Number(value)));
        } else if (field === 'height') {
          val = Math.min(16, Math.max(1, Number(value)));
        }
      }
    }

    onUpdateWidget({
      ...selectedWidget,
      [field]: val,
      ...extra
    } as any);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="scrollable-content">
        <div className="properties-form-group">
          {/* Header */}
          <div className="panel-header" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'capitalize', color: 'var(--text-main)' }}>
                {selectedWidget.type} Widget
              </span>
              <p style={{ fontSize: '9px', color: 'var(--text-light)', fontFamily: 'monospace', marginTop: '2px' }}>
                ID: {selectedWidget.id}
              </p>
            </div>
          </div>

          {/* Coordinate placements */}
          <div className="prop-field">
            <label className="prop-label">Placement Coordinates</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '12px',
              background: 'rgba(15, 23, 42, 0.02)',
              border: '1px solid rgba(15, 23, 42, 0.06)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '8px'
            }}>
              <div className="prop-field">
                <span style={{ fontSize: '9px', color: 'var(--text-light)', fontWeight: 'bold' }}>X PIN</span>
                <input
                  type="number"
                  value={selectedWidget.x}
                  onChange={(e) => handleChange('x', Number(e.target.value))}
                  className="glass-input"
                  style={{ textAlign: 'center', padding: '6px' }}
                />
              </div>
              <div className="prop-field">
                <span style={{ fontSize: '9px', color: 'var(--text-light)', fontWeight: 'bold' }}>Y PIN</span>
                <input
                  type="number"
                  value={selectedWidget.y}
                  onChange={(e) => handleChange('y', Number(e.target.value))}
                  className="glass-input"
                  style={{ textAlign: 'center', padding: '6px' }}
                />
              </div>
              <div className="prop-field">
                <span style={{ fontSize: '9px', color: 'var(--text-light)', fontWeight: 'bold' }}>WIDTH</span>
                <input
                  type="number"
                  value={selectedWidget.width}
                  onChange={(e) => handleChange('width', Math.max(1, Number(e.target.value)))}
                  className="glass-input"
                  style={{ textAlign: 'center', padding: '6px' }}
                />
              </div>
              <div className="prop-field">
                <span style={{ fontSize: '9px', color: 'var(--text-light)', fontWeight: 'bold' }}>HEIGHT</span>
                <input
                  type="number"
                  value={selectedWidget.height}
                  onChange={(e) => handleChange('height', Math.max(1, Number(e.target.value)))}
                  className="glass-input"
                  style={{ textAlign: 'center', padding: '6px' }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: 'rgba(15, 23, 42, 0.02)',
              border: '1px solid rgba(15, 23, 42, 0.06)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <span style={{ fontSize: '9px', color: 'var(--text-light)', fontWeight: 'bold' }}>LAYER DEPTH (Z-INDEX)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => handleChange('zIndex', selectedWidget.zIndex - 1)}
                  className="btn btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '10px', height: '22px' }}
                >
                  <ArrowDown size={11} />
                </button>
                <span style={{ fontSize: '11px', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{selectedWidget.zIndex}</span>
                <button
                  onClick={() => handleChange('zIndex', selectedWidget.zIndex + 1)}
                  className="btn btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '10px', height: '22px' }}
                >
                  <ArrowUp size={11} />
                </button>
              </div>
            </div>
          </div>

          {/* Widget properties */}
          {(selectedWidget.type === 'text' || selectedWidget.type === 'weather-temp' || selectedWidget.type === 'weather-humi' || selectedWidget.type === 'weather-brief' || selectedWidget.type === 'youtube-sub') && (
            <div className="properties-form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '14px' }}>
              {selectedWidget.type === 'text' && (
                <div className="prop-field">
                  <label className="prop-label">Text Content</label>
                  <input
                    type="text"
                    value={(selectedWidget as any).text}
                    onChange={(e) => handleChange('text', e.target.value)}
                    className="glass-input"
                    placeholder="Enter display text..."
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="prop-field">
                  <label className="prop-label">Text Style</label>
                  <select
                    value={(selectedWidget as any).fontFamily}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="standard">Classic Standard</option>
                    <option value="bold">Classic Bold</option>
                  </select>
                </div>
                <div className="prop-field">
                  <label className="prop-label">Text Size</label>
                  <select
                    value={(selectedWidget as any).fontSize ?? 1}
                    onChange={(e) => handleChange('fontSize', Number(e.target.value))}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value={0}>Tiny (Size 0)</option>
                    <option value={1}>Small (Size 1)</option>
                    <option value={2}>Medium (Size 2)</option>
                  </select>
                </div>
              </div>

              <div className="prop-field">
                <label className="prop-label">Text Color</label>
                <div className="color-input-picker-box">
                  <input
                    type="color"
                    value={(selectedWidget as any).color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="color-picker-input-native"
                  />
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{(selectedWidget as any).color}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '10px' }}>
                <div className="prop-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
                  <input
                    type="checkbox"
                    id={`drop-shadow-checkbox-${selectedWidget.id}`}
                    checked={!!(selectedWidget as any).shadow}
                    onChange={(e) => handleChange('shadow', e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor={`drop-shadow-checkbox-${selectedWidget.id}`} className="prop-label" style={{ margin: 0, cursor: 'pointer' }}>Drop Shadow</label>
                </div>
                {!!(selectedWidget as any).shadow && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', paddingLeft: '24px' }}>
                    <div className="prop-field">
                      <label className="prop-label">Shadow Color Mode</label>
                      <select
                        value={(selectedWidget as any).shadowColorMode || 'auto'}
                        onChange={(e) => handleChange('shadowColorMode', e.target.value)}
                        className="glass-input"
                        style={{ padding: '6px 10px' }}
                      >
                        <option value="auto">Automatic (Dimmed)</option>
                        <option value="custom">Custom Color</option>
                      </select>
                    </div>
                    {((selectedWidget as any).shadowColorMode === 'custom') && (
                      <div className="prop-field">
                        <label className="prop-label">Custom Shadow Color</label>
                        <div className="color-input-picker-box">
                          <input
                            type="color"
                            value={(selectedWidget as any).shadowColor || '#000000'}
                            onChange={(e) => handleChange('shadowColor', e.target.value)}
                            className="color-picker-input-native"
                          />
                          <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).shadowColor || '#000000'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="prop-field" style={{ borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '10px' }}>
                <label className="prop-label">Scroll Effect</label>
                <select
                  value={(selectedWidget as any).scrollEffect}
                  onChange={(e) => handleChange('scrollEffect', e.target.value as ScrollEffect)}
                  className="glass-input"
                  style={{ padding: '8px 12px' }}
                >
                  <option value="none">Static (None)</option>
                  <option value="left">Scroll Left</option>
                  <option value="right">Scroll Right</option>
                  <option value="bounce">Horizontal Bounce</option>
                  <option value="wave">Wave/Wobble</option>
                  <option value="glow">Neon Glow</option>
                  <option value="twinkle">Twinkle Star</option>
                  <option value="shimmer">Light Shimmer</option>
                </select>
              </div>

              {(selectedWidget as any).scrollEffect !== 'none' && (
                <div className="prop-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="prop-label">Scroll Speed</label>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>{(selectedWidget as any).scrollSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={(selectedWidget as any).scrollSpeed}
                    onChange={(e) => handleChange('scrollSpeed', Number(e.target.value))}
                    className="slider-input"
                  />
                </div>
              )}
            </div>
          )}

          {selectedWidget.type === 'sticker' && (
            <div className="properties-form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '14px' }}>
              <div className="prop-field">
                <label className="prop-label">Select Sticker Graphic</label>
                <select
                  value={(selectedWidget as any).stickerId}
                  onChange={(e) => {
                    const stickerObj = stickers.find(s => s.id === e.target.value);
                    if (stickerObj) {
                      onUpdateWidget({
                        ...selectedWidget,
                        stickerId: stickerObj.id,
                        pixelData: stickerObj.pixels,
                        width: stickerObj.width,
                        height: stickerObj.height
                      });
                    }
                  }}
                  className="glass-input"
                  style={{ padding: '8px 12px' }}
                >
                  {stickers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.width}x{s.height})
                    </option>
                  ))}
                </select>
              </div>

              <div className="prop-field" style={{ borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '10px' }}>
                <label className="prop-label">Sticker Motion</label>
                <select
                  value={(selectedWidget as any).motion || 'none'}
                  onChange={(e) => handleChange('motion', e.target.value)}
                  className="glass-input"
                  style={{ padding: '8px 12px' }}
                >
                  <option value="none">Static (None)</option>
                  <option value="wobble">Wobble</option>
                  <option value="wave">Wave</option>
                  <option value="rotate">Rotate</option>
                  <option value="bounce">Bounce</option>
                  <option value="orbit">Orbit</option>
                  <option value="blink">Blink</option>
                  <option value="glitch">Glitch</option>
                  <option value="scroll-left">Scroll Left</option>
                  <option value="scroll-right">Scroll Right</option>
                  <option value="scroll-up">Scroll Up</option>
                  <option value="scroll-down">Scroll Down</option>
                </select>
              </div>

              {((selectedWidget as any).motion || 'none') !== 'none' && (
                <div className="prop-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="prop-label">Motion Speed</label>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>{(selectedWidget as any).motionSpeed || 4}x</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={(selectedWidget as any).motionSpeed || 4}
                    onChange={(e) => handleChange('motionSpeed', Number(e.target.value))}
                    className="slider-input"
                  />
                </div>
              )}
            </div>
          )}

          {selectedWidget.type === 'background' && (
            <div className="properties-form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '14px' }}>
              <div className="prop-field">
                <label className="prop-label">Select Background Preset</label>
                <select
                  value={(selectedWidget as any).backgroundId || ''}
                  onChange={(e) => {
                    const bgObj = backgrounds.find(b => b.id === e.target.value);
                    if (bgObj) {
                      onUpdateWidget({
                        ...selectedWidget,
                        backgroundId: bgObj.id,
                        bgType: bgObj.bgType,
                        colors: bgObj.colors || [],
                        pixelData: bgObj.pixels,
                        width: bgObj.width || 80,
                        height: bgObj.height || 16,
                        shape: bgObj.shape || 'rect',
                        cornerRadius: bgObj.cornerRadius || 0,
                        depthEffect: bgObj.depthEffect || false,
                        animationEffect: bgObj.animationEffect || 'none'
                      } as any);
                    }
                  }}
                  className="glass-input"
                  style={{ padding: '8px 12px' }}
                >
                  <option value="">-- Choose Background --</option>
                  {backgrounds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.bgType === 'pixels' ? `${b.width}x${b.height} pixels` : b.bgType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="prop-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="prop-label">Opacity</label>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>{(selectedWidget as any).opacity !== undefined ? (selectedWidget as any).opacity : 100}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={(selectedWidget as any).opacity !== undefined ? (selectedWidget as any).opacity : 100}
                  onChange={(e) => handleChange('opacity', Number(e.target.value))}
                  className="slider-input"
                />
              </div>
            </div>
          )}

          {selectedWidget.type === 'animation' && (
            <div className="properties-form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '14px' }}>
              <div className="prop-field">
                <label className="prop-label">Animation Type</label>
                <select
                  value={(selectedWidget as any).animType || 'prebuilt'}
                  onChange={(e) => handleChange('animType', e.target.value)}
                  className="glass-input"
                  style={{ padding: '8px 12px' }}
                >
                  <option value="prebuilt">Prebuilt Simulation</option>
                  <option value="custom">Custom Timeline</option>
                </select>
              </div>

              {((selectedWidget as any).animType === 'custom') ? (
                <div className="prop-field">
                  <label className="prop-label">Select Custom Animation</label>
                  <select
                    value={(selectedWidget as any).customAnimId || ''}
                    onChange={(e) => {
                      const animObj = animations.find(a => a.id === e.target.value);
                      if (animObj) {
                        onUpdateWidget({
                          ...selectedWidget,
                          customAnimId: animObj.id,
                          frames: animObj.frames || [],
                          width: animObj.width || 80,
                          height: animObj.height || 16,
                          frameRate: animObj.frameRate || 8
                        } as any);
                      }
                    }}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="">-- Choose Custom Animation --</option>
                    {animations.filter(a => a.animType === 'custom').map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.width}x{a.height})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="prop-field">
                  <label className="prop-label">Preset Animation</label>
                  <select
                    value={(selectedWidget as any).prebuiltId || 'stars'}
                    onChange={(e) => handleChange('prebuiltId', e.target.value)}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    {/* 1. Cosmic & Space */}
                    <option value="supernova">Supernova Explosion</option>
                    <option value="pulsar">Pulsar Star</option>

                    {/* 2. Nature, Weather & Landscapes */}
                    <option value="sunrise">Golden Sunrise</option>
                    <option value="sunset">Sunset Twilight</option>
                    <option value="afternoon">Glowing Sun</option>
                    <option value="night">Rising Moon</option>
                    <option value="beach">Sandy Beach Wave</option>
                    <option value="tsunami">Tsunami Wave</option>
                    <option value="drippingrain">Dripping Rain</option>
                    <option value="tornado">Swirling Tornado</option>

                    {/* 3. Fluid & Plasma Waves */}
                    <option value="plasma">WLED Plasma Liquid</option>
                    <option value="aurora">WLED Northern Aurora</option>
                    <option value="rainbowwaves">Rainbow Waves</option>
                    <option value="wavefront">Wavefront Interference</option>
                    <option value="watercells">Voronoi Water Cells</option>
                    <option value="waterfall">Math Waterfall</option>

                    {/* 4. Fractals & Math Curves */}
                    <option value="attractor3d">Rössler Attractor</option>
                    <option value="lissajous3d">3D Lissajous Curve</option>
                    <option value="kaleidoscope">Math Kaleidoscope</option>
                    <option value="vortex">Charybdis Vortex</option>
                    <option value="spiral">Jinx Spiral Wave</option>

                    {/* 5. Particles & Physics */}
                    <option value="particles">Gravity Particle Well</option>
                    <option value="noiseflow">Flow Field Particles</option>
                    <option value="stars">Twinkle Stars</option>
                    <option value="hyperspace">Hyperspace Warp</option>
                    <option value="fireflies">Fireflies Swarm</option>
                    <option value="bounceballs">Bouncing Balls</option>
                    <option value="sparks">Plasma Sparks</option>

                    {/* 6. Helixes & 3D Structures */}
                    <option value="dnahelix">Rotating DNA Helix</option>
                    <option value="dna3d">3D DNA Helix</option>
                    <option value="tunnel">3D Infinite Tunnel</option>

                    {/* 7. Fire, Heat & Explosions */}
                    <option value="firefastled">FastLED Fire2012</option>
                    <option value="combustion">Math Combustion</option>
                    <option value="firecracker">Firecracker Show</option>
                    <option value="fireworks">Mathematical Fireworks</option>
                    <option value="starburst">Rainbow Starburst</option>
                    <option value="ripples">Circular Ripples</option>
                    <option value="metaballs">Metaballs Demoscene</option>
                    <option value="lavalamp">Lava Lamp Blobs</option>

                    {/* 8. Grid, Game & Block Scenarios */}
                    <option value="snake">Retro Snake AI</option>
                    <option value="sandworm">Dune Sand Worm</option>
                    <option value="blocks">Falling Trig Blocks</option>
                    <option value="colorrain">Color Rain Matrix</option>
                  </select>
                </div>
              )}

              <div className="prop-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="prop-label">Frame Rate (FPS)</label>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>{(selectedWidget as any).frameRate || 15} FPS</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={(selectedWidget as any).frameRate || 15}
                  onChange={(e) => handleChange('frameRate', Number(e.target.value))}
                  className="slider-input"
                />
              </div>

              <div className="prop-field" style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="prop-label">Opacity</label>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>{(selectedWidget as any).opacity !== undefined ? (selectedWidget as any).opacity : 100}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={(selectedWidget as any).opacity !== undefined ? (selectedWidget as any).opacity : 100}
                  onChange={(e) => handleChange('opacity', Number(e.target.value))}
                  className="slider-input"
                />
              </div>
            </div>
          )}

          {selectedWidget.type === 'timer' && (
            <div className="properties-form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '14px' }}>
              <div className="prop-field">
                <label className="prop-label">Countdown Duration (Seconds)</label>
                <input
                  type="number"
                  value={(selectedWidget as any).durationSeconds}
                  onChange={(e) => handleChange('durationSeconds', Math.max(10, Number(e.target.value)))}
                  className="glass-input"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="prop-field">
                  <label className="prop-label">Text Style</label>
                  <select
                    value={(selectedWidget as any).fontFamily}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="standard">Classic Standard</option>
                    <option value="bold">Classic Bold</option>
                  </select>
                </div>
                <div className="prop-field">
                  <label className="prop-label">Text Size</label>
                  <select
                    value={(selectedWidget as any).fontSize ?? 1}
                    onChange={(e) => handleChange('fontSize', Number(e.target.value))}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value={0}>Tiny (Size 0)</option>
                    <option value={1}>Small (Size 1)</option>
                    <option value={2}>Medium (Size 2)</option>
                  </select>
                </div>
              </div>

              <div className="prop-field">
                <label className="prop-label">Timer Color</label>
                <div className="color-input-picker-box">
                  <input
                    type="color"
                    value={(selectedWidget as any).color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="color-picker-input-native"
                  />
                  <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).color}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '10px' }}>
                <div className="prop-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
                  <input
                    type="checkbox"
                    id={`drop-shadow-checkbox-${selectedWidget.id}`}
                    checked={!!(selectedWidget as any).shadow}
                    onChange={(e) => handleChange('shadow', e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor={`drop-shadow-checkbox-${selectedWidget.id}`} className="prop-label" style={{ margin: 0, cursor: 'pointer' }}>Drop Shadow</label>
                </div>
                {!!(selectedWidget as any).shadow && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', paddingLeft: '24px' }}>
                    <div className="prop-field">
                      <label className="prop-label">Shadow Color Mode</label>
                      <select
                        value={(selectedWidget as any).shadowColorMode || 'auto'}
                        onChange={(e) => handleChange('shadowColorMode', e.target.value)}
                        className="glass-input"
                        style={{ padding: '6px 10px' }}
                      >
                        <option value="auto">Automatic (Dimmed)</option>
                        <option value="custom">Custom Color</option>
                      </select>
                    </div>
                    {((selectedWidget as any).shadowColorMode === 'custom') && (
                      <div className="prop-field">
                        <label className="prop-label">Custom Shadow Color</label>
                        <div className="color-input-picker-box">
                          <input
                            type="color"
                            value={(selectedWidget as any).shadowColor || '#000000'}
                            onChange={(e) => handleChange('shadowColor', e.target.value)}
                            className="color-picker-input-native"
                          />
                          <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).shadowColor || '#000000'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedWidget.type === 'time' && (
            <div className="properties-form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '14px' }}>
              <div className="prop-field">
                <label className="prop-label">Time Format</label>
                <select
                  value={(selectedWidget as any).format}
                  onChange={(e) => handleChange('format', e.target.value)}
                  className="glass-input"
                  style={{ padding: '8px 12px' }}
                >
                  <option value="HH:MM:SS">HH:MM:SS (24-Hour)</option>
                  <option value="HH:MM">HH:MM (Short)</option>
                  <option value="HH:MM AM/PM">HH:MM AM/PM</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="prop-field">
                  <label className="prop-label">Text Style</label>
                  <select
                    value={(selectedWidget as any).fontFamily}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="standard">Classic Standard</option>
                    <option value="bold">Classic Bold</option>
                  </select>
                </div>
                <div className="prop-field">
                  <label className="prop-label">Text Size</label>
                  <select
                    value={(selectedWidget as any).fontSize ?? 1}
                    onChange={(e) => handleChange('fontSize', Number(e.target.value))}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value={0}>Tiny (Size 0)</option>
                    <option value={1}>Small (Size 1)</option>
                    <option value={2}>Medium (Size 2)</option>
                  </select>
                </div>
              </div>

              <div className="prop-field">
                <label className="prop-label">Time Color</label>
                <div className="color-input-picker-box">
                  <input
                    type="color"
                    value={(selectedWidget as any).color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="color-picker-input-native"
                  />
                  <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).color}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '10px' }}>
                <div className="prop-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
                  <input
                    type="checkbox"
                    id={`drop-shadow-checkbox-${selectedWidget.id}`}
                    checked={!!(selectedWidget as any).shadow}
                    onChange={(e) => handleChange('shadow', e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor={`drop-shadow-checkbox-${selectedWidget.id}`} className="prop-label" style={{ margin: 0, cursor: 'pointer' }}>Drop Shadow</label>
                </div>
                {!!(selectedWidget as any).shadow && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', paddingLeft: '24px' }}>
                    <div className="prop-field">
                      <label className="prop-label">Shadow Color Mode</label>
                      <select
                        value={(selectedWidget as any).shadowColorMode || 'auto'}
                        onChange={(e) => handleChange('shadowColorMode', e.target.value)}
                        className="glass-input"
                        style={{ padding: '6px 10px' }}
                      >
                        <option value="auto">Automatic (Dimmed)</option>
                        <option value="custom">Custom Color</option>
                      </select>
                    </div>
                    {((selectedWidget as any).shadowColorMode === 'custom') && (
                      <div className="prop-field">
                        <label className="prop-label">Custom Shadow Color</label>
                        <div className="color-input-picker-box">
                          <input
                            type="color"
                            value={(selectedWidget as any).shadowColor || '#000000'}
                            onChange={(e) => handleChange('shadowColor', e.target.value)}
                            className="color-picker-input-native"
                          />
                          <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).shadowColor || '#000000'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedWidget.type === 'date' && (
            <div className="properties-form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '14px' }}>
              <div className="prop-field">
                <label className="prop-label">Date Format</label>
                <select
                  value={(selectedWidget as any).format}
                  onChange={(e) => handleChange('format', e.target.value)}
                  className="glass-input"
                  style={{ padding: '8px 12px' }}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD MMM">DD Month (Short)</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="prop-field">
                  <label className="prop-label">Text Style</label>
                  <select
                    value={(selectedWidget as any).fontFamily}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="standard">Classic Standard</option>
                    <option value="bold">Classic Bold</option>
                  </select>
                </div>
                <div className="prop-field">
                  <label className="prop-label">Text Size</label>
                  <select
                    value={(selectedWidget as any).fontSize ?? 1}
                    onChange={(e) => handleChange('fontSize', Number(e.target.value))}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value={0}>Tiny (Size 0)</option>
                    <option value={1}>Small (Size 1)</option>
                    <option value={2}>Medium (Size 2)</option>
                  </select>
                </div>
              </div>

              <div className="prop-field">
                <label className="prop-label">Date Color</label>
                <div className="color-input-picker-box">
                  <input
                    type="color"
                    value={(selectedWidget as any).color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="color-picker-input-native"
                  />
                  <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).color}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '10px' }}>
                <div className="prop-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
                  <input
                    type="checkbox"
                    id={`drop-shadow-checkbox-${selectedWidget.id}`}
                    checked={!!(selectedWidget as any).shadow}
                    onChange={(e) => handleChange('shadow', e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor={`drop-shadow-checkbox-${selectedWidget.id}`} className="prop-label" style={{ margin: 0, cursor: 'pointer' }}>Drop Shadow</label>
                </div>
                {!!(selectedWidget as any).shadow && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', paddingLeft: '24px' }}>
                    <div className="prop-field">
                      <label className="prop-label">Shadow Color Mode</label>
                      <select
                        value={(selectedWidget as any).shadowColorMode || 'auto'}
                        onChange={(e) => handleChange('shadowColorMode', e.target.value)}
                        className="glass-input"
                        style={{ padding: '6px 10px' }}
                      >
                        <option value="auto">Automatic (Dimmed)</option>
                        <option value="custom">Custom Color</option>
                      </select>
                    </div>
                    {((selectedWidget as any).shadowColorMode === 'custom') && (
                      <div className="prop-field">
                        <label className="prop-label">Custom Shadow Color</label>
                        <div className="color-input-picker-box">
                          <input
                            type="color"
                            value={(selectedWidget as any).shadowColor || '#000000'}
                            onChange={(e) => handleChange('shadowColor', e.target.value)}
                            className="color-picker-input-native"
                          />
                          <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).shadowColor || '#000000'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedWidget.type === 'weather' && (
            <div className="properties-form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '14px' }}>

              {/* WEATHER BRIEF SELECTOR */}
              <div className="prop-field" style={{ marginBottom: '8px' }}>
                <label className="prop-label">Simulated Weather Brief</label>
                <select
                  value={(selectedWidget as any).param || 'clear'}
                  onChange={(e) => handleChange('param', e.target.value)}
                  className="glass-input"
                  style={{ padding: '8px 12px' }}
                >
                  <option value="clear">☀️ Sunny / Clear</option>
                  <option value="clouds">☁️ Cloudy / Clouds</option>
                  <option value="rain">🌧️ Rainy / Drizzle</option>
                  <option value="thunderstorm">⛈️ Stormy / Thunderstorm</option>
                  <option value="snow">❄️ Snowy</option>
                  <option value="mist">🌫️ Windy / Hazy / Mist</option>
                </select>
              </div>

              <>

                {/* ICON OPTIONS */}
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', marginTop: '12px', marginBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '4px' }}>ICON OPTIONS</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div className="prop-field">
                    <label className="prop-label">Icon X Position</label>
                    <input
                      type="number"
                      min={0} max={60}
                      value={(selectedWidget as any).iconX !== undefined ? (selectedWidget as any).iconX : 2}
                      onChange={(e) => handleChange('iconX', Number(e.target.value))}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                  <div className="prop-field">
                    <label className="prop-label">Icon Y Position</label>
                    <input
                      type="number"
                      min={0} max={8}
                      value={(selectedWidget as any).iconY !== undefined ? (selectedWidget as any).iconY : 0}
                      onChange={(e) => handleChange('iconY', Number(e.target.value))}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                </div>

                {/* TEMPERATURE OPTIONS */}
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', marginTop: '4px', marginBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '4px' }}>TEMPERATURE OPTIONS</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div className="prop-field">
                    <label className="prop-label">Temp Font Style</label>
                    <select
                      value={(selectedWidget as any).tempFontFamily || 'standard'}
                      onChange={(e) => handleChange('tempFontFamily', e.target.value)}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    >
                      <option value="standard">Classic Standard</option>
                      <option value="bold">Classic Bold</option>
                    </select>
                  </div>
                  <div className="prop-field">
                    <label className="prop-label">Temp Text Size</label>
                    <select
                      value={(selectedWidget as any).tempFontSize !== undefined ? (selectedWidget as any).tempFontSize : 1}
                      onChange={(e) => handleChange('tempFontSize', Number(e.target.value))}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    >
                      <option value={0}>Tiny (Size 0)</option>
                      <option value={1}>Small (Size 1)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div className="prop-field">
                    <label className="prop-label">Text X Offset</label>
                    <input
                      type="number"
                      min={0} max={60}
                      value={(selectedWidget as any).textX !== undefined ? (selectedWidget as any).textX : 22}
                      onChange={(e) => handleChange('textX', Number(e.target.value))}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                  <div className="prop-field">
                    <label className="prop-label">Text Y Offset</label>
                    <input
                      type="number"
                      min={0} max={8}
                      value={(selectedWidget as any).textY !== undefined ? (selectedWidget as any).textY : 0}
                      onChange={(e) => handleChange('textY', Number(e.target.value))}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div className="prop-field">
                    <label className="prop-label">Temp Color Mode</label>
                    <select
                      value={(selectedWidget as any).tempColorMode || 'followBrief'}
                      onChange={(e) => handleChange('tempColorMode', e.target.value)}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    >
                      <option value="followBrief">Follow Brief</option>
                      <option value="custom">Custom Color</option>
                    </select>
                  </div>
                  {((selectedWidget as any).tempColorMode === 'custom') && (
                    <div className="prop-field">
                      <label className="prop-label">Temp Color</label>
                      <div className="color-input-picker-box">
                        <input
                          type="color"
                          value={(selectedWidget as any).tempColor || '#facc15'}
                          onChange={(e) => handleChange('tempColor', e.target.value)}
                          className="color-picker-input-native"
                        />
                        <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).tempColor || '#facc15'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Temp Drop Shadow */}
                <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.05)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                  <div className="prop-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <input
                      type="checkbox"
                      id={`temp-shadow-checkbox-${selectedWidget.id}`}
                      checked={(selectedWidget as any).tempShadow !== undefined ? !!(selectedWidget as any).tempShadow : !!(selectedWidget as any).shadow}
                      onChange={(e) => handleChange('tempShadow', e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor={`temp-shadow-checkbox-${selectedWidget.id}`} className="prop-label" style={{ margin: 0, cursor: 'pointer' }}>Temp Drop Shadow</label>
                  </div>
                  {((selectedWidget as any).tempShadow !== undefined ? (selectedWidget as any).tempShadow : (selectedWidget as any).shadow) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <div className="prop-field">
                        <label className="prop-label" style={{ fontSize: '10px' }}>Shadow Color Mode</label>
                        <select
                          value={(selectedWidget as any).tempShadowColorMode || 'auto'}
                          onChange={(e) => handleChange('tempShadowColorMode', e.target.value)}
                          className="glass-input"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                        >
                          <option value="auto">Automatic (Dimmed)</option>
                          <option value="custom">Custom Color</option>
                        </select>
                      </div>
                      {((selectedWidget as any).tempShadowColorMode === 'custom') && (
                        <div className="prop-field">
                          <label className="prop-label" style={{ fontSize: '10px' }}>Custom Shadow Color</label>
                          <div className="color-input-picker-box">
                            <input
                              type="color"
                              value={(selectedWidget as any).tempShadowColor || '#000000'}
                              onChange={(e) => handleChange('tempShadowColor', e.target.value)}
                              className="color-picker-input-native"
                            />
                            <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).tempShadowColor || '#000000'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* HUMIDITY OPTIONS */}
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', marginTop: '4px', marginBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '4px' }}>HUMIDITY OPTIONS</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div className="prop-field">
                    <label className="prop-label">Humi Font Style</label>
                    <select
                      value={(selectedWidget as any).humiFontFamily || 'standard'}
                      onChange={(e) => handleChange('humiFontFamily', e.target.value)}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    >
                      <option value="standard">Classic Standard</option>
                      <option value="bold">Classic Bold</option>
                    </select>
                  </div>
                  <div className="prop-field">
                    <label className="prop-label">Humi Text Size</label>
                    <select
                      value={(selectedWidget as any).humiFontSize !== undefined ? (selectedWidget as any).humiFontSize : 1}
                      onChange={(e) => handleChange('humiFontSize', Number(e.target.value))}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    >
                      <option value={0}>Tiny (Size 0)</option>
                      <option value={1}>Small (Size 1)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div className="prop-field">
                    <label className="prop-label">Humi X Position</label>
                    <input
                      type="number"
                      min={0} max={75}
                      value={(selectedWidget as any).humiX !== undefined ? (selectedWidget as any).humiX : 58}
                      onChange={(e) => handleChange('humiX', Number(e.target.value))}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                  <div className="prop-field">
                    <label className="prop-label">Humi Y Position</label>
                    <input
                      type="number"
                      min={0} max={15}
                      value={(selectedWidget as any).humiY !== undefined ? (selectedWidget as any).humiY : 0}
                      onChange={(e) => handleChange('humiY', Number(e.target.value))}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div className="prop-field">
                    <label className="prop-label">Humi Color Mode</label>
                    <select
                      value={(selectedWidget as any).humiColorMode || 'followBrief'}
                      onChange={(e) => handleChange('humiColorMode', e.target.value)}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    >
                      <option value="followBrief">Follow Brief</option>
                      <option value="custom">Custom Color</option>
                    </select>
                  </div>
                  {((selectedWidget as any).humiColorMode === 'custom') && (
                    <div className="prop-field">
                      <label className="prop-label">Humi Color</label>
                      <div className="color-input-picker-box">
                        <input
                          type="color"
                          value={(selectedWidget as any).humiColor || '#94a3b8'}
                          onChange={(e) => handleChange('humiColor', e.target.value)}
                          className="color-picker-input-native"
                        />
                        <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).humiColor || '#94a3b8'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Humi Drop Shadow */}
                <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.05)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                  <div className="prop-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <input
                      type="checkbox"
                      id={`humi-shadow-checkbox-${selectedWidget.id}`}
                      checked={(selectedWidget as any).humiShadow !== undefined ? !!(selectedWidget as any).humiShadow : !!(selectedWidget as any).shadow}
                      onChange={(e) => handleChange('humiShadow', e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor={`humi-shadow-checkbox-${selectedWidget.id}`} className="prop-label" style={{ margin: 0, cursor: 'pointer' }}>Humi Drop Shadow</label>
                  </div>
                  {((selectedWidget as any).humiShadow !== undefined ? (selectedWidget as any).humiShadow : (selectedWidget as any).shadow) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <div className="prop-field">
                        <label className="prop-label" style={{ fontSize: '10px' }}>Shadow Color Mode</label>
                        <select
                          value={(selectedWidget as any).humiShadowColorMode || 'auto'}
                          onChange={(e) => handleChange('humiShadowColorMode', e.target.value)}
                          className="glass-input"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                        >
                          <option value="auto">Automatic (Dimmed)</option>
                          <option value="custom">Custom Color</option>
                        </select>
                      </div>
                      {((selectedWidget as any).humiShadowColorMode === 'custom') && (
                        <div className="prop-field">
                          <label className="prop-label" style={{ fontSize: '10px' }}>Custom Shadow Color</label>
                          <div className="color-input-picker-box">
                            <input
                              type="color"
                              value={(selectedWidget as any).humiShadowColor || '#000000'}
                              onChange={(e) => handleChange('humiShadowColor', e.target.value)}
                              className="color-picker-input-native"
                            />
                            <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).humiShadowColor || '#000000'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* BRIEF OPTIONS */}
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', marginTop: '4px', marginBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '4px' }}>BRIEF OPTIONS</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div className="prop-field">
                    <label className="prop-label">Brief Font Style</label>
                    <select
                      value={(selectedWidget as any).briefFontFamily || 'bold'}
                      onChange={(e) => handleChange('briefFontFamily', e.target.value)}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    >
                      <option value="standard">Classic Standard</option>
                      <option value="bold">Classic Bold</option>
                    </select>
                  </div>
                  <div className="prop-field">
                    <label className="prop-label">Brief Text Size</label>
                    <select
                      value={(selectedWidget as any).briefFontSize !== undefined ? (selectedWidget as any).briefFontSize : 1}
                      onChange={(e) => handleChange('briefFontSize', Number(e.target.value))}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    >
                      <option value={0}>Tiny (Size 0)</option>
                      <option value={1}>Small (Size 1)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div className="prop-field">
                    <label className="prop-label">Brief X Position</label>
                    <input
                      type="number"
                      min={0} max={75}
                      value={(selectedWidget as any).briefX !== undefined ? (selectedWidget as any).briefX : 22}
                      onChange={(e) => handleChange('briefX', Number(e.target.value))}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                  <div className="prop-field">
                    <label className="prop-label">Brief Y Position</label>
                    <input
                      type="number"
                      min={0} max={15}
                      value={(selectedWidget as any).briefY !== undefined ? (selectedWidget as any).briefY : 8}
                      onChange={(e) => handleChange('briefY', Number(e.target.value))}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div className="prop-field">
                    <label className="prop-label">Brief Color Mode</label>
                    <select
                      value={(selectedWidget as any).briefColorMode || 'followBrief'}
                      onChange={(e) => handleChange('briefColorMode', e.target.value)}
                      className="glass-input"
                      style={{ padding: '8px 12px' }}
                    >
                      <option value="followBrief">Follow Brief</option>
                      <option value="custom">Custom Color</option>
                    </select>
                  </div>
                  {((selectedWidget as any).briefColorMode === 'custom') && (
                    <div className="prop-field">
                      <label className="prop-label">Brief Color</label>
                      <div className="color-input-picker-box">
                        <input
                          type="color"
                          value={(selectedWidget as any).briefColor || '#ffffff'}
                          onChange={(e) => handleChange('briefColor', e.target.value)}
                          className="color-picker-input-native"
                        />
                        <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).briefColor || '#ffffff'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Brief Drop Shadow */}
                <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.05)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                  <div className="prop-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <input
                      type="checkbox"
                      id={`brief-shadow-checkbox-${selectedWidget.id}`}
                      checked={(selectedWidget as any).briefShadow !== undefined ? !!(selectedWidget as any).briefShadow : !!(selectedWidget as any).shadow}
                      onChange={(e) => handleChange('briefShadow', e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor={`brief-shadow-checkbox-${selectedWidget.id}`} className="prop-label" style={{ margin: 0, cursor: 'pointer' }}>Brief Drop Shadow</label>
                  </div>
                  {((selectedWidget as any).briefShadow !== undefined ? (selectedWidget as any).briefShadow : (selectedWidget as any).shadow) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <div className="prop-field">
                        <label className="prop-label" style={{ fontSize: '10px' }}>Shadow Color Mode</label>
                        <select
                          value={(selectedWidget as any).briefShadowColorMode || 'auto'}
                          onChange={(e) => handleChange('briefShadowColorMode', e.target.value)}
                          className="glass-input"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                        >
                          <option value="auto">Automatic (Dimmed)</option>
                          <option value="custom">Custom Color</option>
                        </select>
                      </div>
                      {((selectedWidget as any).briefShadowColorMode === 'custom') && (
                        <div className="prop-field">
                          <label className="prop-label" style={{ fontSize: '10px' }}>Custom Shadow Color</label>
                          <div className="color-input-picker-box">
                            <input
                              type="color"
                              value={(selectedWidget as any).briefShadowColor || '#000000'}
                              onChange={(e) => handleChange('briefShadowColor', e.target.value)}
                              className="color-picker-input-native"
                            />
                            <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).briefShadowColor || '#000000'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </>

            </div>
          )}
          {selectedWidget.type === 'youtube-sub' && (
            <div className="properties-form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', marginTop: '4px', marginBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '4px' }}>YOUTUBE OPTIONS</div>
              
              <div className="prop-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '4px', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  id={`yt-format-checkbox-${selectedWidget.id}`}
                  checked={(selectedWidget as any).format === 'full'}
                  onChange={(e) => handleChange('format', e.target.checked ? 'full' : 'short')}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor={`yt-format-checkbox-${selectedWidget.id}`} className="prop-label" style={{ margin: 0, cursor: 'pointer' }}>
                  Show Full Count (e.g. 1980)
                </label>
              </div>
            </div>
          )}

          {selectedWidget.type === 'clock' && (
            <div className="properties-form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '14px' }}>

              {/* DATE SECTION */}
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', marginTop: '4px', marginBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '4px' }}>DATE OPTIONS</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <div className="prop-field">
                  <label className="prop-label">Date Font Style</label>
                  <select
                    value={(selectedWidget as any).dateFontFamily || (selectedWidget as any).fontFamily || 'standard'}
                    onChange={(e) => handleChange('dateFontFamily', e.target.value)}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="standard">Classic Standard</option>
                    <option value="bold">Classic Bold</option>
                  </select>
                </div>
                <div className="prop-field">
                  <label className="prop-label">Date Text Size</label>
                  <select
                    value={(selectedWidget as any).dateFontSize !== undefined ? (selectedWidget as any).dateFontSize : ((selectedWidget as any).fontSize ?? 1)}
                    onChange={(e) => handleChange('dateFontSize', Number(e.target.value))}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value={0}>Tiny (Size 0)</option>
                    <option value={1}>Small (Size 1)</option>
                    <option value={2}>Medium (Size 2)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <div className="prop-field">
                  <label className="prop-label">Date Format</label>
                  <select
                    value={(selectedWidget as any).dateFormat || 'DD MMM'}
                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD MMM">DD Month (Short)</option>
                  </select>
                </div>
                <div className="prop-field">
                  <label className="prop-label">Date Color Mode</label>
                  <select
                    value={(selectedWidget as any).dateColorMode || 'custom'}
                    onChange={(e) => handleChange('dateColorMode', e.target.value)}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="custom">Custom Color</option>
                    <option value="followTime">Follow Time of Day</option>
                  </select>
                </div>
              </div>

              {((selectedWidget as any).dateColorMode || 'custom') === 'custom' && (
                <div className="prop-field" style={{ marginBottom: '8px' }}>
                  <label className="prop-label">Date Color</label>
                  <div className="color-input-picker-box">
                    <input
                      type="color"
                      value={(selectedWidget as any).dateColor || (selectedWidget as any).color || '#ffffff'}
                      onChange={(e) => handleChange('dateColor', e.target.value)}
                      className="color-picker-input-native"
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).dateColor || (selectedWidget as any).color || '#ffffff'}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <div className="prop-field">
                  <label className="prop-label">Date X Position</label>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={(selectedWidget as any).dateX !== undefined ? (selectedWidget as any).dateX : 20}
                    onChange={(e) => handleChange('dateX', Number(e.target.value))}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                <div className="prop-field">
                  <label className="prop-label">Date Y Position</label>
                  <input
                    type="number"
                    min={0}
                    max={16}
                    value={(selectedWidget as any).dateY !== undefined ? (selectedWidget as any).dateY : 0}
                    onChange={(e) => handleChange('dateY', Number(e.target.value))}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  />
                </div>
              </div>

              {/* Date Shadow */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.05)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                <div className="prop-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <input
                    type="checkbox"
                    id={`date-shadow-checkbox-${selectedWidget.id}`}
                    checked={(selectedWidget as any).dateShadow !== undefined ? !!(selectedWidget as any).dateShadow : !!(selectedWidget as any).shadow}
                    onChange={(e) => handleChange('dateShadow', e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor={`date-shadow-checkbox-${selectedWidget.id}`} className="prop-label" style={{ margin: 0, cursor: 'pointer' }}>Date Drop Shadow</label>
                </div>
                {((selectedWidget as any).dateShadow !== undefined ? (selectedWidget as any).dateShadow : (selectedWidget as any).shadow) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    <div className="prop-field">
                      <label className="prop-label" style={{ fontSize: '10px' }}>Shadow Color Mode</label>
                      <select
                        value={(selectedWidget as any).dateShadowColorMode || 'auto'}
                        onChange={(e) => handleChange('dateShadowColorMode', e.target.value)}
                        className="glass-input"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                      >
                        <option value="auto">Automatic (Dimmed)</option>
                        <option value="custom">Custom Color</option>
                      </select>
                    </div>
                    {((selectedWidget as any).dateShadowColorMode === 'custom') && (
                      <div className="prop-field">
                        <label className="prop-label" style={{ fontSize: '10px' }}>Custom Shadow Color</label>
                        <div className="color-input-picker-box">
                          <input
                            type="color"
                            value={(selectedWidget as any).dateShadowColor || '#000000'}
                            onChange={(e) => handleChange('dateShadowColor', e.target.value)}
                            className="color-picker-input-native"
                          />
                          <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).dateShadowColor || '#000000'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* TIME SECTION */}
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', marginTop: '8px', marginBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '4px' }}>TIME OPTIONS</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <div className="prop-field">
                  <label className="prop-label">Time Font Style</label>
                  <select
                    value={(selectedWidget as any).timeFontFamily || (selectedWidget as any).fontFamily || 'bold'}
                    onChange={(e) => handleChange('timeFontFamily', e.target.value)}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="standard">Classic Standard</option>
                    <option value="bold">Classic Bold</option>
                  </select>
                </div>
                <div className="prop-field">
                  <label className="prop-label">Time Text Size</label>
                  <select
                    value={(selectedWidget as any).timeFontSize !== undefined ? (selectedWidget as any).timeFontSize : ((selectedWidget as any).fontSize ?? 1)}
                    onChange={(e) => handleChange('timeFontSize', Number(e.target.value))}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value={0}>Tiny (Size 0)</option>
                    <option value={1}>Small (Size 1)</option>
                    <option value={2}>Medium (Size 2)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <div className="prop-field">
                  <label className="prop-label">Time Format</label>
                  <select
                    value={(selectedWidget as any).timeFormat || 'HH:MM'}
                    onChange={(e) => handleChange('timeFormat', e.target.value)}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="HH:MM:SS">HH:MM:SS (24h)</option>
                    <option value="HH:MM">HH:MM (Short)</option>
                    <option value="HH:MM AM/PM">HH:MM AM/PM</option>
                  </select>
                </div>
                <div className="prop-field">
                  <label className="prop-label">Time Color Mode</label>
                  <select
                    value={(selectedWidget as any).timeColorMode || 'custom'}
                    onChange={(e) => handleChange('timeColorMode', e.target.value)}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="custom">Custom Color</option>
                    <option value="followTime">Follow Time of Day</option>
                  </select>
                </div>
              </div>

              {((selectedWidget as any).timeColorMode || 'custom') === 'custom' && (
                <div className="prop-field" style={{ marginBottom: '8px' }}>
                  <label className="prop-label">Time Color</label>
                  <div className="color-input-picker-box">
                    <input
                      type="color"
                      value={(selectedWidget as any).timeColor || (selectedWidget as any).color || '#ffffff'}
                      onChange={(e) => handleChange('timeColor', e.target.value)}
                      className="color-picker-input-native"
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).timeColor || (selectedWidget as any).color || '#ffffff'}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <div className="prop-field">
                  <label className="prop-label">Time X Position</label>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={(selectedWidget as any).timeX !== undefined ? (selectedWidget as any).timeX : 20}
                    onChange={(e) => handleChange('timeX', Number(e.target.value))}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                <div className="prop-field">
                  <label className="prop-label">Time Y Position</label>
                  <input
                    type="number"
                    min={0}
                    max={16}
                    value={(selectedWidget as any).timeY !== undefined ? (selectedWidget as any).timeY : 8}
                    onChange={(e) => handleChange('timeY', Number(e.target.value))}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  />
                </div>
              </div>

              {/* Time Shadow */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.05)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                <div className="prop-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <input
                    type="checkbox"
                    id={`time-shadow-checkbox-${selectedWidget.id}`}
                    checked={(selectedWidget as any).timeShadow !== undefined ? !!(selectedWidget as any).timeShadow : !!(selectedWidget as any).shadow}
                    onChange={(e) => handleChange('timeShadow', e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor={`time-shadow-checkbox-${selectedWidget.id}`} className="prop-label" style={{ margin: 0, cursor: 'pointer' }}>Time Drop Shadow</label>
                </div>
                {((selectedWidget as any).timeShadow !== undefined ? (selectedWidget as any).timeShadow : (selectedWidget as any).shadow) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    <div className="prop-field">
                      <label className="prop-label" style={{ fontSize: '10px' }}>Shadow Color Mode</label>
                      <select
                        value={(selectedWidget as any).timeShadowColorMode || 'auto'}
                        onChange={(e) => handleChange('timeShadowColorMode', e.target.value)}
                        className="glass-input"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                      >
                        <option value="auto">Automatic (Dimmed)</option>
                        <option value="custom">Custom Color</option>
                      </select>
                    </div>
                    {((selectedWidget as any).timeShadowColorMode === 'custom') && (
                      <div className="prop-field">
                        <label className="prop-label" style={{ fontSize: '10px' }}>Custom Shadow Color</label>
                        <div className="color-input-picker-box">
                          <input
                            type="color"
                            value={(selectedWidget as any).timeShadowColor || '#000000'}
                            onChange={(e) => handleChange('timeShadowColor', e.target.value)}
                            className="color-picker-input-native"
                          />
                          <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).timeShadowColor || '#000000'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BACKGROUND / OVERRIDE OPTIONS */}
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', marginTop: '8px', marginBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '4px' }}>BACKGROUND OPTIONS</div>

              <div className="prop-field" style={{ marginBottom: '8px' }}>
                <label className="prop-label">Time of Day Simulator</label>
                <select
                  value={(selectedWidget as any).timeOfDayOverride || 'auto'}
                  onChange={(e) => handleChange('timeOfDayOverride', e.target.value)}
                  className="glass-input"
                  style={{ padding: '8px 12px' }}
                >
                  <option value="auto">Follow Clock Time (Auto)</option>
                  <option value="morning">Morning (Sunrise Animation)</option>
                  <option value="afternoon">Afternoon (Glowing Sun)</option>
                  <option value="evening">Evening (Sunset Animation)</option>
                  <option value="night">Night (Rising Moon)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <div className="prop-field">
                  <label className="prop-label">Background X</label>
                  <input
                    type="number"
                    min={-80}
                    max={80}
                    value={(selectedWidget as any).bgX !== undefined ? (selectedWidget as any).bgX : 0}
                    onChange={(e) => handleChange('bgX', Number(e.target.value))}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                <div className="prop-field">
                  <label className="prop-label">Background Y</label>
                  <input
                    type="number"
                    min={-16}
                    max={16}
                    value={(selectedWidget as any).bgY !== undefined ? (selectedWidget as any).bgY : 0}
                    onChange={(e) => handleChange('bgY', Number(e.target.value))}
                    className="glass-input"
                    style={{ padding: '8px 12px' }}
                  />
                </div>
              </div>

            </div>
          )}

          {selectedWidget.type === 'shape' && (
            <div className="properties-form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '14px' }}>
              <div className="prop-field">
                <label className="prop-label">Shape Geometry</label>
                <select
                  value={(selectedWidget as any).shapeType || 'rect'}
                  onChange={(e) => handleChange('shapeType', e.target.value)}
                  className="glass-input"
                  style={{ padding: '8px 12px' }}
                >
                  <option value="rect">Rectangle</option>
                  <option value="circle">Circle / Ellipse</option>
                  <option value="triangle">Triangle</option>
                  <option value="line">Diagonal Line</option>
                  <option value="hline">Horizontal Line</option>
                  <option value="vline">Vertical Line</option>
                </select>
              </div>

              {((selectedWidget as any).shapeType === 'rect') && (
                <div className="prop-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="prop-label">Corner Rounding</label>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>{(selectedWidget as any).cornerRadius ?? 0}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    value={(selectedWidget as any).cornerRadius ?? 0}
                    onChange={(e) => handleChange('cornerRadius', Number(e.target.value))}
                    className="slider-input"
                  />
                </div>
              )}

              <div className="prop-field">
                <label className="prop-label">Fill Color</label>
                <div className="color-input-picker-box">
                  <input
                    type="color"
                    value={(selectedWidget as any).color || '#EA580C'}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="color-picker-input-native"
                  />
                  <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).color || '#EA580C'}</span>
                </div>
              </div>

              {((selectedWidget as any).shapeType !== 'line' && (selectedWidget as any).shapeType !== 'hline' && (selectedWidget as any).shapeType !== 'vline') && (
                <div className="prop-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id={`shape-filled-checkbox-${selectedWidget.id}`}
                    checked={(selectedWidget as any).filled !== false}
                    onChange={(e) => handleChange('filled', e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor={`shape-filled-checkbox-${selectedWidget.id}`} className="prop-label" style={{ margin: 0, cursor: 'pointer' }}>Filled Shape</label>
                </div>
              )}

              {((selectedWidget as any).shapeType !== 'line' && (selectedWidget as any).shapeType !== 'hline' && (selectedWidget as any).shapeType !== 'vline') && (
                <div className="properties-form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '10px', marginTop: '4px' }}>
                  <div className="prop-field">
                    <label className="prop-label">Border Color</label>
                    <div className="color-input-picker-box">
                      <input
                        type="color"
                        value={(selectedWidget as any).borderColor || '#00000000'}
                        onChange={(e) => handleChange('borderColor', e.target.value)}
                        className="color-picker-input-native"
                      />
                      <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{(selectedWidget as any).borderColor || '#00000000'}</span>
                    </div>
                  </div>

                  <div className="prop-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="prop-label">Border Width</label>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>{(selectedWidget as any).borderWidth ?? 1}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      value={(selectedWidget as any).borderWidth ?? 1}
                      onChange={(e) => handleChange('borderWidth', Number(e.target.value))}
                      className="slider-input"
                    />
                  </div>
                </div>
              )}

              <div className="prop-field" style={{ borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '10px' }}>
                <label className="prop-label">Shape Motion</label>
                <select
                  value={(selectedWidget as any).motion || 'none'}
                  onChange={(e) => handleChange('motion', e.target.value)}
                  className="glass-input"
                  style={{ padding: '8px 12px' }}
                >
                  <option value="none">Static (None)</option>
                  <option value="wobble">Wobble</option>
                  <option value="wave">Wave</option>
                  <option value="rotate">Rotate</option>
                  <option value="bounce">Bounce</option>
                  <option value="orbit">Orbit</option>
                  <option value="blink">Blink</option>
                  <option value="glitch">Glitch</option>
                  <option value="scroll-left">Scroll Left</option>
                  <option value="scroll-right">Scroll Right</option>
                  <option value="scroll-up">Scroll Up</option>
                  <option value="scroll-down">Scroll Down</option>
                </select>
              </div>

              {((selectedWidget as any).motion || 'none') !== 'none' && (
                <div className="prop-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="prop-label">Motion Speed</label>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>{(selectedWidget as any).motionSpeed || 4}x</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={(selectedWidget as any).motionSpeed || 4}
                    onChange={(e) => handleChange('motionSpeed', Number(e.target.value))}
                    className="slider-input"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '14px', marginTop: '14px' }}>
        <p style={{ fontSize: '9px', color: 'var(--text-light)', textAlign: 'center', lineHeight: '1.4' }}>
          Adjust layout fields or drag the snapping box directly on the twin matrix display.
        </p>
      </div>
    </div>
  );
};
