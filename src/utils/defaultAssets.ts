import type { Sticker, BackgroundPreset, AnimationPreset, Scene } from '../types/studio';

// Helper to generate a blank grid
export const generateBlankGrid = (w: number, h: number, color = '#00000000'): string[] => {
  return Array(w * h).fill(color);
};

// Custom Helper to generate default pixels for stickers
const getHeartPixels = (): string[] => {
  const w = 8, h = 8;
  const grid = generateBlankGrid(w, h);
  const heart = [
    [0,1], [0,2], [0,5], [0,6],
    [1,0], [1,1], [1,2], [1,3], [1,4], [1,5], [1,6], [1,7],
    [2,0], [2,1], [2,2], [2,3], [2,4], [2,5], [2,6], [2,7],
    [3,1], [3,2], [3,3], [3,4], [3,5], [3,6],
    [4,2], [4,3], [4,4], [4,5],
    [5,3], [5,4]
  ];
  heart.forEach(([r, c]) => {
    grid[r * w + c] = '#ef4444'; // Red
  });
  return grid;
};

const getGhostPixels = (): string[] => {
  const w = 8, h = 8;
  const grid = generateBlankGrid(w, h);
  const rows = [
    '..1111..',
    '.111111.',
    '11011011',
    '11011011',
    '11111111',
    '11111111',
    '11111111',
    '1.1..1.1'
  ];
  rows.forEach((row, r) => {
    for (let c = 0; c < 8; c++) {
      if (row[c] === '1') grid[r * w + c] = '#a855f7'; // Purple
      if (row[c] === '0') grid[r * w + c] = '#ffffff'; // White eyes
    }
  });
  return grid;
};

const getSunPixels = (): string[] => {
  const w = 8, h = 8;
  const grid = generateBlankGrid(w, h);
  const rows = [
    '..1.1..',
    '.11111.',
    '1111111',
    '.11111.',
    '..1.1..'
  ];
  rows.forEach((row, r) => {
    for (let c = 0; c < 8; c++) {
      if (row[c] === '1') grid[(r+1) * w + c] = '#f59e0b'; // Orange/Yellow
    }
  });
  return grid;
};

const getCloudPixels = (): string[] => {
  const w = 8, h = 8;
  const grid = generateBlankGrid(w, h);
  const rows = [
    '....11..',
    '..11111.',
    '.1111111',
    '11111111'
  ];
  rows.forEach((row, r) => {
    for (let c = 0; c < 8; c++) {
      if (row[c] === '1') grid[(r+2) * w + c] = '#38bdf8'; // Sky blue
    }
  });
  return grid;
};

export const DEFAULT_STICKERS: Sticker[] = [
  {
    id: 'heart-8',
    name: 'Love Heart',
    width: 8,
    height: 8,
    pixels: getHeartPixels(),
    isPrebuilt: true
  },
  {
    id: 'ghost-8',
    name: 'Retro Ghost',
    width: 8,
    height: 8,
    pixels: getGhostPixels(),
    isPrebuilt: true
  },
  {
    id: 'sun-8',
    name: 'Sunny Weather',
    width: 8,
    height: 8,
    pixels: getSunPixels(),
    isPrebuilt: true
  },
  {
    id: 'cloud-8',
    name: 'Cloudy weather',
    width: 8,
    height: 8,
    pixels: getCloudPixels(),
    isPrebuilt: true
  }
];

export const DEFAULT_BACKGROUNDS: BackgroundPreset[] = [
  {
    id: 'solid-dark',
    name: 'Deep Midnight',
    bgType: 'solid',
    colors: ['#030712'],
    isPrebuilt: true
  },
  {
    id: 'grad-sunset',
    name: 'Sunset Glow',
    bgType: 'gradient',
    colors: ['#f59e0b', '#ec4899'],
    isPrebuilt: true
  },
  {
    id: 'grad-ocean',
    name: 'Ocean Depth',
    bgType: 'gradient',
    colors: ['#06b6d4', '#3b82f6'],
    isPrebuilt: true
  },
  {
    id: 'pattern-grid',
    name: 'Cyber Grid',
    bgType: 'pattern',
    colors: ['#1e1b4b', '#4f46e5'],
    shape: 'grid',
    isPrebuilt: true
  }
];

export const DEFAULT_ANIMATIONS: AnimationPreset[] = [
  // 1. Cosmic & Space
  {
    id: 'supernova',
    name: 'Supernova Explosion',
    animType: 'prebuilt',
    prebuiltId: 'supernova',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'pulsar',
    name: 'Pulsar Star',
    animType: 'prebuilt',
    prebuiltId: 'pulsar',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },

  // 2. Nature, Weather & Landscapes
  {
    id: 'sunrise',
    name: 'Golden Sunrise',
    animType: 'prebuilt',
    prebuiltId: 'sunrise',
    width: 80,
    height: 16,
    frameRate: 15,
    isPrebuilt: true
  },
  {
    id: 'sunset',
    name: 'Sunset Twilight',
    animType: 'prebuilt',
    prebuiltId: 'sunset',
    width: 80,
    height: 16,
    frameRate: 15,
    isPrebuilt: true
  },
  {
    id: 'afternoon',
    name: 'Glowing Sun',
    animType: 'prebuilt',
    prebuiltId: 'afternoon',
    width: 80,
    height: 16,
    frameRate: 15,
    isPrebuilt: true
  },
  {
    id: 'night',
    name: 'Rising Moon',
    animType: 'prebuilt',
    prebuiltId: 'night',
    width: 80,
    height: 16,
    frameRate: 15,
    isPrebuilt: true
  },
  {
    id: 'beach',
    name: 'Sandy Beach Wave',
    animType: 'prebuilt',
    prebuiltId: 'beach',
    width: 80,
    height: 16,
    frameRate: 15,
    isPrebuilt: true
  },
  {
    id: 'tsunami',
    name: 'Tsunami Wave',
    animType: 'prebuilt',
    prebuiltId: 'tsunami',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'drippingrain',
    name: 'Dripping Rain',
    animType: 'prebuilt',
    prebuiltId: 'drippingrain',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'tornado',
    name: 'Swirling Tornado',
    animType: 'prebuilt',
    prebuiltId: 'tornado',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },

  // 3. Fluid & Plasma Waves
  {
    id: 'plasma',
    name: 'WLED Plasma Liquid',
    animType: 'prebuilt',
    prebuiltId: 'plasma',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'aurora',
    name: 'WLED Northern Aurora',
    animType: 'prebuilt',
    prebuiltId: 'aurora',
    width: 80,
    height: 16,
    frameRate: 15,
    isPrebuilt: true
  },
  {
    id: 'rainbowwaves',
    name: 'Rainbow Waves',
    animType: 'prebuilt',
    prebuiltId: 'rainbowwaves',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'wavefront',
    name: 'Wavefront Interference',
    animType: 'prebuilt',
    prebuiltId: 'wavefront',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'watercells',
    name: 'Voronoi Water Cells',
    animType: 'prebuilt',
    prebuiltId: 'watercells',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'waterfall',
    name: 'Math Waterfall',
    animType: 'prebuilt',
    prebuiltId: 'waterfall',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },

  // 4. Fractals & Math Curves
  {
    id: 'attractor3d',
    name: 'Rössler Attractor',
    animType: 'prebuilt',
    prebuiltId: 'attractor3d',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'lissajous3d',
    name: '3D Lissajous Curve',
    animType: 'prebuilt',
    prebuiltId: 'lissajous3d',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'kaleidoscope',
    name: 'Math Kaleidoscope',
    animType: 'prebuilt',
    prebuiltId: 'kaleidoscope',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'vortex',
    name: 'Charybdis Vortex',
    animType: 'prebuilt',
    prebuiltId: 'vortex',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'spiral',
    name: 'Jinx Spiral Wave',
    animType: 'prebuilt',
    prebuiltId: 'spiral',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },

  // 5. Particles & Physics
  {
    id: 'particles',
    name: 'Gravity Particle Well',
    animType: 'prebuilt',
    prebuiltId: 'particles',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'noiseflow',
    name: 'Flow Field Particles',
    animType: 'prebuilt',
    prebuiltId: 'noiseflow',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'stars',
    name: 'Twinkle Stars',
    animType: 'prebuilt',
    prebuiltId: 'stars',
    width: 80,
    height: 16,
    frameRate: 15,
    isPrebuilt: true
  },
  {
    id: 'hyperspace',
    name: 'Hyperspace Warp',
    animType: 'prebuilt',
    prebuiltId: 'hyperspace',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'fireflies',
    name: 'Fireflies Swarm',
    animType: 'prebuilt',
    prebuiltId: 'fireflies',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'bounceballs',
    name: 'Bouncing Balls',
    animType: 'prebuilt',
    prebuiltId: 'bounceballs',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'sparks',
    name: 'Plasma Sparks',
    animType: 'prebuilt',
    prebuiltId: 'sparks',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },

  // 6. Helixes & 3D Structures
  {
    id: 'dnahelix',
    name: 'Rotating DNA Helix',
    animType: 'prebuilt',
    prebuiltId: 'dnahelix',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'dna3d',
    name: '3D DNA Helix',
    animType: 'prebuilt',
    prebuiltId: 'dna3d',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'tunnel',
    name: '3D Infinite Tunnel',
    animType: 'prebuilt',
    prebuiltId: 'tunnel',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },

  // 7. Fire, Heat & Explosions
  {
    id: 'firefastled',
    name: 'FastLED Fire2012',
    animType: 'prebuilt',
    prebuiltId: 'firefastled',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'combustion',
    name: 'Math Combustion',
    animType: 'prebuilt',
    prebuiltId: 'combustion',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'firecracker',
    name: 'Firecracker Show',
    animType: 'prebuilt',
    prebuiltId: 'firecracker',
    width: 80,
    height: 16,
    frameRate: 15,
    isPrebuilt: true
  },
  {
    id: 'fireworks',
    name: 'Mathematical Fireworks',
    animType: 'prebuilt',
    prebuiltId: 'fireworks',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'starburst',
    name: 'Rainbow Starburst',
    animType: 'prebuilt',
    prebuiltId: 'starburst',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'ripples',
    name: 'Circular Ripples',
    animType: 'prebuilt',
    prebuiltId: 'ripples',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'metaballs',
    name: 'Metaballs Demoscene',
    animType: 'prebuilt',
    prebuiltId: 'metaballs',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'lavalamp',
    name: 'Lava Lamp Blobs',
    animType: 'prebuilt',
    prebuiltId: 'lavalamp',
    width: 80,
    height: 16,
    frameRate: 15,
    isPrebuilt: true
  },

  // 8. Grid, Game & Block Scenarios
  {
    id: 'snake',
    name: 'Retro Snake AI',
    animType: 'prebuilt',
    prebuiltId: 'snake',
    width: 80,
    height: 16,
    frameRate: 10,
    isPrebuilt: true
  },
  {
    id: 'sandworm',
    name: 'Dune Sand Worm',
    animType: 'prebuilt',
    prebuiltId: 'sandworm',
    width: 80,
    height: 16,
    frameRate: 15,
    isPrebuilt: true
  },
  {
    id: 'blocks',
    name: 'Falling Trig Blocks',
    animType: 'prebuilt',
    prebuiltId: 'blocks',
    width: 80,
    height: 16,
    frameRate: 20,
    isPrebuilt: true
  },
  {
    id: 'colorrain',
    name: 'Color Rain Matrix',
    animType: 'prebuilt',
    prebuiltId: 'colorrain',
    width: 80,
    height: 16,
    frameRate: 15,
    isPrebuilt: true
  }
];

export const DEFAULT_SCENES: Scene[] = [
  {
    id: 'scene-boot',
    name: 'Boot Animation',
    createdAt: Date.now(),
    widgets: [
      {
        id: 'bg-boot',
        type: 'background',
        name: 'Midnight Background',
        x: 0,
        y: 0,
        width: 80,
        height: 16,
        zIndex: 0,
        bgType: 'solid',
        colors: ['#030712']
      },
      {
        id: 'text-boot',
        type: 'text',
        name: 'Boot Text',
        x: 13,
        y: 4,
        width: 54,
        height: 8,
        zIndex: 1,
        text: 'PIXEL BAR',
        fontSize: 1,
        shadow: false,
        shadowColor: '#000000',
        alignment: 'center',
        scrollEffect: 'shimmer',
        scrollSpeed: 4,
        color: '#6366f1',
        fontFamily: 'bold'
      }
    ]
  }
];
