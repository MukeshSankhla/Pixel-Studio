export type WidgetType = 'text' | 'sticker' | 'background' | 'animation' | 'timer' | 'date' | 'time' | 'weather' | 'weather-temp' | 'weather-humi' | 'weather-brief' | 'shape' | 'clock' | 'youtube-sub';

export interface BaseWidget {
  id: string;
  type: WidgetType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  shadowColorMode?: 'auto' | 'custom';
}

export type ScrollEffect = 
  | 'none'
  | 'left' 
  | 'right' 
  | 'top' 
  | 'bottom' 
  | 'bounce' 
  | 'wave' 
  | 'shimmer' 
  | 'glow' 
  | 'twinkle' 
  | 'pop';

export interface TextWidget extends BaseWidget {
  type: 'text';
  text: string;
  fontSize: number; // e.g. 8 (standard small), 12, 16
  shadow: boolean; // drop shadow effect
  shadowColor: string;
  alignment: 'left' | 'center' | 'right' | 'custom';
  scrollEffect: ScrollEffect;
  scrollSpeed: number; // 1 to 10
  color: string;
  fontFamily: 'standard' | 'bold' | 'retro' | 'pixel';
  rainbow?: boolean;
}

export interface StickerWidget extends BaseWidget {
  type: 'sticker';
  stickerId: string; // references a saved sticker
  pixelData: string[]; // 1D array of hex colors of size width * height
  motion?: 'none' | 'wobble' | 'wave' | 'rotate' | 'bounce' | 'orbit' | 'blink' | 'glitch' | 'scroll-left' | 'scroll-right' | 'scroll-up' | 'scroll-down';
  motionSpeed?: number;
}

export interface BackgroundWidget extends BaseWidget {
  type: 'background';
  bgType: 'solid' | 'gradient' | 'pattern' | 'prebuilt' | 'pixels';
  colors: string[]; // solid: 1 color, gradient: 2+ colors
  shape?: 'rect' | 'circle' | 'grid';
  cornerRadius?: number;
  depthEffect?: boolean;
  animationEffect?: 'none' | 'scroll-left' | 'scroll-right' | 'pulse' | 'wave';
  prebuiltId?: string; // standard prebuilt animations/backgrounds
  backgroundId?: string;
  pixelData?: string[];
}

export interface AnimationWidget extends BaseWidget {
  type: 'animation';
  animType: 'prebuilt' | 'custom';
  prebuiltId?: 
    | 'supernova'
    | 'pulsar'
    | 'sunrise'
    | 'sunset'
    | 'afternoon'
    | 'night'
    | 'beach'
    | 'tsunami'
    | 'drippingrain'
    | 'tornado'
    | 'plasma'
    | 'aurora'
    | 'rainbowwaves'
    | 'wavefront'
    | 'watercells'
    | 'waterfall'
    | 'attractor3d'
    | 'lissajous3d'
    | 'kaleidoscope'
    | 'vortex'
    | 'spiral'
    | 'particles'
    | 'noiseflow'
    | 'stars'
    | 'hyperspace'
    | 'fireflies'
    | 'bounceballs'
    | 'sparks'
    | 'dnahelix'
    | 'dna3d'
    | 'tunnel'
    | 'firefastled'
    | 'combustion'
    | 'firecracker'
    | 'fireworks'
    | 'starburst'
    | 'ripples'
    | 'metaballs'
    | 'lavalamp'
    | 'snake'
    | 'sandworm'
    | 'blocks'
    | 'colorrain';
  customAnimId?: string; // references a custom saved animation
  frames?: string[][]; // 2D array of frames, each containing width * height hex colors
  frameRate: number; // frames per second
}

export interface TimerWidget extends BaseWidget {
  type: 'timer';
  durationSeconds: number;
  color: string;
  shadow: boolean;
  shadowColor: string;
  fontSize: number;
  scrollEffect: ScrollEffect;
  fontFamily: 'standard' | 'bold' | 'retro' | 'pixel';
}

export interface DateWidget extends BaseWidget {
  type: 'date';
  format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMM';
  color: string;
  shadow: boolean;
  shadowColor: string;
  fontSize: number;
  scrollEffect: ScrollEffect;
  fontFamily: 'standard' | 'bold' | 'retro' | 'pixel';
}

export interface TimeWidget extends BaseWidget {
  type: 'time';
  format: 'HH:MM:SS' | 'HH:MM' | 'HH:MM AM/PM';
  color: string;
  shadow: boolean;
  shadowColor: string;
  fontSize: number;
  scrollEffect: ScrollEffect;
  fontFamily: 'standard' | 'bold' | 'retro' | 'pixel';
}

export interface WeatherWidget extends BaseWidget {
  type: 'weather';
  param: 'temp' | 'humidity' | 'desc' | 'wind' | 'temp+humidity' | 'all';
  color: string;
  shadow: boolean;
  shadowColor: string;
  fontSize: number;
  scrollEffect: ScrollEffect;
  fontFamily: 'standard' | 'bold' | 'retro' | 'pixel';
  formatMode?: 'predefined' | 'custom';
  // Icon positioning
  iconX?: number;
  iconY?: number;
  // Per-element: Temperature line
  tempColor?: string;
  tempColorMode?: 'custom' | 'followBrief';
  tempFontFamily?: 'standard' | 'bold';
  tempFontSize?: number;
  tempShadow?: boolean;
  tempShadowColorMode?: 'auto' | 'custom';
  tempShadowColor?: string;
  // Per-element: Humidity line
  humiColor?: string;
  humiColorMode?: 'custom' | 'followBrief';
  humiFontFamily?: 'standard' | 'bold';
  humiFontSize?: number;
  humiShadow?: boolean;
  humiShadowColorMode?: 'auto' | 'custom';
  humiShadowColor?: string;
  humiX?: number;
  humiY?: number;
  // Per-element: Brief / description line
  briefColor?: string;
  briefColorMode?: 'custom' | 'followBrief';
  briefFontFamily?: 'standard' | 'bold';
  briefFontSize?: number;
  briefShadow?: boolean;
  briefShadowColorMode?: 'auto' | 'custom';
  briefShadowColor?: string;
  briefX?: number;
  briefY?: number;
  // Text layout
  textX?: number;
  textY?: number;
}

export interface ShapeWidget extends BaseWidget {
  type: 'shape';
  shapeType: 'rect' | 'circle' | 'triangle' | 'line' | 'hline' | 'vline';
  color: string;
  borderColor?: string;
  borderWidth?: number;
  filled?: boolean;
  cornerRadius?: number;
  motion?: 'none' | 'wobble' | 'wave' | 'rotate' | 'bounce' | 'orbit' | 'blink' | 'glitch' | 'scroll-left' | 'scroll-right' | 'scroll-up' | 'scroll-down';
  motionSpeed?: number;
}

export interface ClockWidget extends BaseWidget {
  type: 'clock';
  color: string;
  shadow: boolean;
  shadowColor: string;
  fontFamily: 'standard' | 'bold' | 'retro' | 'pixel';
  fontSize: number;
  timeOfDayOverride?: 'auto' | 'morning' | 'afternoon' | 'evening' | 'night';
  bgX?: number;
  bgY?: number;
  dateX?: number;
  dateY?: number;
  timeX?: number;
  timeY?: number;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMM';
  timeFormat?: 'HH:MM:SS' | 'HH:MM' | 'HH:MM AM/PM';
  dateColor?: string;
  timeColor?: string;
  dateColorMode?: 'custom' | 'followTime';
  timeColorMode?: 'custom' | 'followTime';
  dateFontFamily?: 'standard' | 'bold' | 'retro' | 'pixel';
  timeFontFamily?: 'standard' | 'bold' | 'retro' | 'pixel';
  dateFontSize?: number;
  timeFontSize?: number;
  dateShadow?: boolean;
  timeShadow?: boolean;
  dateShadowColorMode?: 'auto' | 'custom';
  timeShadowColorMode?: 'auto' | 'custom';
  dateShadowColor?: string;
  timeShadowColor?: string;
}

export interface WeatherTempWidget extends BaseWidget {
  type: 'weather-temp';
  color: string;
  shadow: boolean;
  shadowColor: string;
  fontSize: number;
  scrollEffect: ScrollEffect;
  fontFamily: 'standard' | 'bold' | 'retro' | 'pixel';
}

export interface WeatherHumiWidget extends BaseWidget {
  type: 'weather-humi';
  color: string;
  shadow: boolean;
  shadowColor: string;
  fontSize: number;
  scrollEffect: ScrollEffect;
  fontFamily: 'standard' | 'bold' | 'retro' | 'pixel';
}

export interface WeatherBriefWidget extends BaseWidget {
  type: 'weather-brief';
  color: string;
  shadow: boolean;
  shadowColor: string;
  fontSize: number;
  scrollEffect: ScrollEffect;
  fontFamily: 'standard' | 'bold' | 'retro' | 'pixel';
}

export interface YouTubeSubWidget extends BaseWidget {
  type: 'youtube-sub';
  color: string;
  shadow: boolean;
  shadowColor: string;
  shadowColorMode?: 'auto' | 'custom';
  fontSize: number;
  scrollEffect: ScrollEffect;
  fontFamily: 'standard' | 'bold' | 'retro' | 'pixel';
  iconX?: number;
  iconY?: number;
  textX?: number;
  textY?: number;
  format?: 'short' | 'full';
}


export type Widget =
  | TextWidget
  | StickerWidget
  | BackgroundWidget
  | AnimationWidget
  | TimerWidget
  | DateWidget
  | TimeWidget
  | WeatherWidget
  | WeatherTempWidget
  | WeatherHumiWidget
  | WeatherBriefWidget
  | ShapeWidget
  | ClockWidget
  | YouTubeSubWidget;

export interface Sticker {
  id: string;
  name: string;
  width: number;
  height: number;
  pixels: string[]; // width * height flat array of hex strings
  isPrebuilt?: boolean;
}

export interface BackgroundPreset {
  id: string;
  name: string;
  bgType: 'solid' | 'gradient' | 'pattern' | 'pixels';
  colors: string[];
  shape?: 'rect' | 'circle' | 'grid';
  cornerRadius?: number;
  depthEffect?: boolean;
  animationEffect?: 'none' | 'scroll-left' | 'scroll-right' | 'pulse' | 'wave';
  isPrebuilt?: boolean;
  width?: number;
  height?: number;
  pixels?: string[];
}

export interface AnimationPreset {
  id: string;
  name: string;
  animType: 'prebuilt' | 'custom';
  prebuiltId?: 
    | 'supernova'
    | 'pulsar'
    | 'sunrise'
    | 'sunset'
    | 'afternoon'
    | 'night'
    | 'beach'
    | 'tsunami'
    | 'drippingrain'
    | 'tornado'
    | 'plasma'
    | 'aurora'
    | 'rainbowwaves'
    | 'wavefront'
    | 'watercells'
    | 'waterfall'
    | 'attractor3d'
    | 'lissajous3d'
    | 'kaleidoscope'
    | 'vortex'
    | 'spiral'
    | 'particles'
    | 'noiseflow'
    | 'stars'
    | 'hyperspace'
    | 'fireflies'
    | 'bounceballs'
    | 'sparks'
    | 'dnahelix'
    | 'dna3d'
    | 'tunnel'
    | 'firefastled'
    | 'combustion'
    | 'firecracker'
    | 'fireworks'
    | 'starburst'
    | 'ripples'
    | 'metaballs'
    | 'lavalamp'
    | 'snake'
    | 'sandworm'
    | 'blocks'
    | 'colorrain';
  frames?: string[][]; // custom animation frames
  width: number;
  height: number;
  frameRate: number;
  isPrebuilt?: boolean;
}

export interface Scene {
  id: string;
  name: string;
  widgets: Widget[];
  createdAt: number;
}
