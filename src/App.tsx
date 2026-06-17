import { useState, useEffect, useRef } from 'react';
import {
  DEFAULT_SCENES,
  DEFAULT_STICKERS,
  DEFAULT_BACKGROUNDS,
  DEFAULT_ANIMATIONS
} from './utils/defaultAssets';
import type { Scene, Sticker, BackgroundPreset, AnimationPreset, Widget, WidgetType } from './types/studio';
import { DigitalTwin } from './components/DigitalTwin';
import { PropertiesPanel } from './components/PropertiesPanel';
import { StickerBuilder } from './components/StickerBuilder';
import { BackgroundBuilder } from './components/BackgroundBuilder';
import { AnimationBuilder } from './components/AnimationBuilder';
import { CommunityMarketplace } from './components/CommunityMarketplace';
import { generateArduinoCode } from './utils/codeGenerator';
import {
  Monitor,
  Sparkles,
  Settings,
  Download,
  Cpu,
  Wifi,
  Plus,
  Layers,
  Image,
  Flame,
  Sticker as StickerIcon,
  Trash,
  Undo,
  Redo,
  Copy,
  HelpCircle,
  Edit,
  Type,
  Clock,
  CalendarDays,
  Timer,
  Cloud,
  Thermometer,
  Droplets,
  Wind,
  CloudSun,
  Clapperboard,
  GalleryHorizontal,
  Square,
  Share2,
  Check
} from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import confetti from 'canvas-confetti';

const Youtube = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9" fill="currentColor" />
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'stickers' | 'backgrounds' | 'animations' | 'community'>('studio');
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Storage States
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [backgrounds, setBackgrounds] = useState<BackgroundPreset[]>([]);
  const [animations, setAnimations] = useState<AnimationPreset[]>([]);

  // Scene publishing feedback states
  const [publishingSceneId, setPublishingSceneId] = useState<string | null>(null);
  const [publishedSceneIds, setPublishedSceneIds] = useState<Set<string>>(new Set());

  const handlePublishScene = async (sc: Scene) => {
    setPublishingSceneId(sc.id);
    try {
      await handlePublishToCommunity('scene', sc);
      setPublishedSceneIds(prev => {
        const next = new Set(prev);
        next.add(sc.id);
        return next;
      });
      setTimeout(() => {
        setPublishedSceneIds(prev => {
          const next = new Set(prev);
          next.delete(sc.id);
          return next;
        });
      }, 3000);
    } catch (err) {
      console.error("Failed to publish scene:", err);
    } finally {
      setPublishingSceneId(null);
    }
  };

  // Studio Mode Undo/Redo states
  const [studioHistory, setStudioHistory] = useState<Scene[][]>([]);
  const [studioRedoStack, setStudioRedoStack] = useState<Scene[][]>([]);

  const pushToStudioHistory = (customScenes?: Scene[]) => {
    const target = customScenes || scenes;
    setStudioHistory(prev => [...prev, JSON.parse(JSON.stringify(target))]);
    setStudioRedoStack([]);
  };

  const handleStudioUndo = () => {
    if (studioHistory.length === 0) return;
    const previous = studioHistory[studioHistory.length - 1];
    setStudioHistory(prev => prev.slice(0, prev.length - 1));
    setStudioRedoStack(prev => [...prev, JSON.parse(JSON.stringify(scenes))]);
    setScenes(previous);
    saveAllToStorage(previous, stickers, backgrounds, animations);
  };

  const handleStudioRedo = () => {
    if (studioRedoStack.length === 0) return;
    const next = studioRedoStack[studioRedoStack.length - 1];
    setStudioRedoStack(prev => prev.slice(0, prev.length - 1));
    setStudioHistory(prev => [...prev, JSON.parse(JSON.stringify(scenes))]);
    setScenes(next);
    saveAllToStorage(next, stickers, backgrounds, animations);
  };

  // Selection states
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  // Network/Hardware export configs (Defaulting to user's constants)
  const [wifiSsid, setWifiSsid] = useState(() => localStorage.getItem('pixel_studio_wifi_ssid') || 'Makerbrains_2.4G');
  const [wifiPass, setWifiPass] = useState(() => localStorage.getItem('pixel_studio_wifi_pass') || 'Balaji2830');
  const [ntpServer, setNtpServer] = useState(() => localStorage.getItem('pixel_studio_ntp_server') || 'pool.ntp.org');
  const [tzInfo, setTzInfo] = useState(() => localStorage.getItem('pixel_studio_tz_info') || 'IST-5:30');
  const [owmKey, setOwmKey] = useState(() => localStorage.getItem('pixel_studio_owm_key') || '43f22249d3d42ec5daf08c4384ca809b');
  const [owmCity, setOwmCity] = useState(() => localStorage.getItem('pixel_studio_owm_city') || 'Hyderabad');
  const [owmCountry, setOwmCountry] = useState(() => localStorage.getItem('pixel_studio_owm_country') || 'IN');
  const [ytApiKey, setYtApiKey] = useState(() => localStorage.getItem('pixel_studio_yt_api_key') || '');
  const [ytChannelId, setYtChannelId] = useState(() => localStorage.getItem('pixel_studio_yt_channel_id') || 'UCFYguRGMmGpH493PDX5WmBA');
  const [ytSubCount, setYtSubCount] = useState<string>('1980');

  // Connection status
  const [espIp, setEspIp] = useState(() => {
    return localStorage.getItem('pixel_studio_esp_ip') || '192.168.1.10';
  });
  const [liveMode, setLiveMode] = useState<'off' | 'wifi'>('off');
  const [brightness, setBrightness] = useState(60);
  const [wifiSocket, setWifiSocket] = useState<WebSocket | null>(null);
  const [isConnectedWifiLive, setIsConnectedWifiLive] = useState(false);
  const [isConnectingWifiLive, setIsConnectingWifiLive] = useState(false);
  const isStreamingFrameRef = useRef(false);

  // Inline renaming states
  const [renamingSceneIdx, setRenamingSceneIdx] = useState<number | null>(null);
  const [renamingSceneValue, setRenamingSceneValue] = useState<string>('');

  // Drag and drop scenes reordering state
  const [draggedSceneIdx, setDraggedSceneIdx] = useState<number | null>(null);

  const handleSceneDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSceneIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSceneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSceneDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSceneIdx === null || draggedSceneIdx === targetIndex) return;

    pushToStudioHistory();
    const nextScenes = [...scenes];
    const [removed] = nextScenes.splice(draggedSceneIdx, 1);
    nextScenes.splice(targetIndex, 0, removed);

    setScenes(nextScenes);
    setCurrentSceneIdx(targetIndex);
    saveAllToStorage(nextScenes, stickers, backgrounds, animations);
  };

  const handleSceneDragEnd = () => {
    setDraggedSceneIdx(null);
  };
  const [renamingWidgetId, setRenamingWidgetId] = useState<string | null>(null);
  const [renamingWidgetValue, setRenamingWidgetValue] = useState<string>('');

  // Modals state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  const activeScene = scenes[currentSceneIdx] || null;


  // Load Initial states
  useEffect(() => {
    const savedScenes = localStorage.getItem('pixel_studio_scenes');
    const savedStickers = localStorage.getItem('pixel_studio_stickers');
    const savedBgs = localStorage.getItem('pixel_studio_backgrounds');
    const savedAnims = localStorage.getItem('pixel_studio_animations');

    let parsedScenes: Scene[] = [];
    try {
      parsedScenes = savedScenes ? JSON.parse(savedScenes) : [];
    } catch (e) {
      parsedScenes = [];
    }

    let parsedStickers: Sticker[] = [];
    try {
      parsedStickers = savedStickers ? JSON.parse(savedStickers) : [];
    } catch (e) {
      parsedStickers = [];
    }

    let parsedBgs: BackgroundPreset[] = [];
    try {
      parsedBgs = savedBgs ? JSON.parse(savedBgs) : [];
    } catch (e) {
      parsedBgs = [];
    }

    let parsedAnims: AnimationPreset[] = [];
    try {
      parsedAnims = savedAnims ? JSON.parse(savedAnims) : [];
    } catch (e) {
      parsedAnims = [];
    }

    setScenes(savedScenes !== null ? parsedScenes : DEFAULT_SCENES);
    setStickers(savedStickers !== null ? parsedStickers : DEFAULT_STICKERS);
    setBackgrounds(savedBgs !== null ? parsedBgs : DEFAULT_BACKGROUNDS);
    setAnimations(savedAnims !== null ? parsedAnims : DEFAULT_ANIMATIONS);
  }, []);



  // Live fetch YouTube statistics in Web UI
  useEffect(() => {
    if (!ytApiKey || !ytChannelId) {
      setYtSubCount('1980');
      return;
    }

    const fetchSubscribers = async () => {
      try {
        const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${ytChannelId}&key=${ytApiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const rawCount = data.items[0].statistics.subscriberCount;
          if (rawCount) {
            setYtSubCount(rawCount);
          }
        }
      } catch (err) {
        console.error('Failed to fetch YouTube subscribers:', err);
      }
    };

    fetchSubscribers();
    const interval = setInterval(fetchSubscribers, 600000); // refresh every 10 mins
    return () => clearInterval(interval);
  }, [ytApiKey, ytChannelId]);



  // Keyboard navigation/edit shortcuts for selected widgets and page operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if any input field has active focus (to prevent hijacking text writing)
      const activeEl = document.activeElement;
      if (activeEl) {
        const tag = activeEl.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || activeEl.hasAttribute('contenteditable')) {
          return;
        }
      }

      // Check Ctrl+Z and Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (activeTab === 'studio') {
          handleStudioUndo();
        } else {
          document.dispatchEvent(new CustomEvent('app-shortcut-undo'));
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (activeTab === 'studio') {
          handleStudioRedo();
        } else {
          document.dispatchEvent(new CustomEvent('app-shortcut-redo'));
        }
        return;
      }

      const key = e.key.toLowerCase();

      // Help/Shortcuts modal trigger ( ? key )
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        return;
      }

      // Tab Switch Shortcuts: 1-5
      if (key === '1') { e.preventDefault(); setActiveTab('studio'); return; }
      if (key === '2') { e.preventDefault(); setActiveTab('stickers'); return; }
      if (key === '3') { e.preventDefault(); setActiveTab('backgrounds'); return; }
      if (key === '4') { e.preventDefault(); setActiveTab('animations'); return; }
      if (key === '5') { e.preventDefault(); setActiveTab('community'); return; }

      // WiFi Connect trigger
      if (key === 'c') {
        e.preventDefault();
        handleConnectWifiLive();
        return;
      }

      // Mode-specific Custom Events Dispatches
      if (activeTab !== 'studio') {
        if (['p', 'e', 'k', 'f', 'g', 'h', 'v', 's', 'i', 'x', 'j', 'u', ' ', 'a', 'd', '[', ']', 'r', 'o', 'l'].includes(key)) {
          e.preventDefault();

          let eventName = '';
          if (key === 'p') eventName = 'app-shortcut-paint';
          else if (key === 'e') eventName = 'app-shortcut-eraser';
          else if (key === 'k') eventName = 'app-shortcut-clear';
          else if (key === 'f') eventName = 'app-shortcut-fill';
          else if (key === 'g') eventName = 'app-shortcut-fill-all';
          else if (key === 'h') eventName = 'app-shortcut-mirror-h';
          else if (key === 'v') eventName = 'app-shortcut-mirror-v';
          else if (key === 's') eventName = 'app-shortcut-save';
          else if (key === 'i') eventName = 'app-shortcut-import-image';
          else if (key === 'x') eventName = 'app-shortcut-export-json';
          else if (key === 'j') eventName = 'app-shortcut-import-json';
          else if (key === 'u') eventName = 'app-shortcut-share';
          else if (key === ' ') eventName = 'app-shortcut-play-pause';
          else if (key === 'a') eventName = 'app-shortcut-add-frame';
          else if (key === 'd') eventName = 'app-shortcut-duplicate';
          else if (key === '[') eventName = 'app-shortcut-prev-frame';
          else if (key === ']') eventName = 'app-shortcut-next-frame';
          else if (key === 'r') eventName = 'app-shortcut-rect';
          else if (key === 'o') eventName = 'app-shortcut-circle';
          else if (key === 'l') eventName = 'app-shortcut-line';

          if (eventName) {
            document.dispatchEvent(new CustomEvent(eventName));
          }
          return;
        }
        return;
      }

      // New Scene
      if (key === 'n') {
        e.preventDefault();
        handleAddNewScene();
        return;
      }

      // Duplicate Scene
      if (key === 'd') {
        e.preventDefault();
        handleDuplicateCurrentScene();
        return;
      }

      // Save Layout Design
      if (key === 's') {
        e.preventDefault();
        handleSaveScene();
        return;
      }

      // Duplicate Widget
      if (key === 'w' && selectedWidgetId) {
        e.preventDefault();
        handleDuplicateWidget(selectedWidgetId);
        return;
      }

      // Move / Delete selected widgets
      if (!selectedWidgetId) return;
      if (!activeScene) return;
      const widget = activeScene.widgets.find(w => w.id === selectedWidgetId);
      if (!widget) return;

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          handleDeleteWidget(selectedWidgetId);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleKeyboardMoveWidget(selectedWidgetId, widget.x, widget.y - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleKeyboardMoveWidget(selectedWidgetId, widget.x, widget.y + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleKeyboardMoveWidget(selectedWidgetId, widget.x - 1, widget.y);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleKeyboardMoveWidget(selectedWidgetId, widget.x + 1, widget.y);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    activeTab,
    selectedWidgetId,
    activeScene,
    scenes,
    currentSceneIdx,
    studioHistory,
    studioRedoStack,
    espIp,
    isConnectedWifiLive,
    wifiSocket,
    brightness
  ]);

  const handleKeyboardMoveWidget = (id: string, newX: number, newY: number) => {
    if (!activeScene) return;
    pushToStudioHistory();
    const updatedWidgets = activeScene.widgets.map(w => {
      if (w.id === id) {
        if (w.type === 'clock' || (w.type === 'weather' && (w as any).formatMode === 'predefined')) {
          return { ...w, x: 0, y: 0, width: 80, height: 16 };
        }
        return { ...w, x: newX, y: newY };
      }
      return w;
    });
    const updatedScenes = [...scenes];
    updatedScenes[currentSceneIdx] = {
      ...activeScene,
      widgets: updatedWidgets
    };
    setScenes(updatedScenes);
    saveAllToStorage(updatedScenes, stickers, backgrounds, animations);
  };

  const handleResetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all scenes, stickers, and backgrounds to default factory configurations? This will delete your custom designs.")) {
      pushToStudioHistory();
      localStorage.removeItem('pixel_studio_scenes');
      localStorage.removeItem('pixel_studio_stickers');
      localStorage.removeItem('pixel_studio_backgrounds');
      localStorage.removeItem('pixel_studio_animations');

      setScenes(DEFAULT_SCENES);
      setStickers(DEFAULT_STICKERS);
      setBackgrounds(DEFAULT_BACKGROUNDS);
      setAnimations(DEFAULT_ANIMATIONS);
      setCurrentSceneIdx(0);
      setSelectedWidgetId(null);

      window.showToast('Workspace reset to default templates successfully!', 'success');
    }
  };

  // Sync to local storage on changes
  const saveAllToStorage = (updatedScenes: Scene[], updatedStickers: Sticker[], updatedBgs: BackgroundPreset[], updatedAnims: AnimationPreset[]) => {
    localStorage.setItem('pixel_studio_scenes', JSON.stringify(updatedScenes));
    localStorage.setItem('pixel_studio_stickers', JSON.stringify(updatedStickers));
    localStorage.setItem('pixel_studio_backgrounds', JSON.stringify(updatedBgs));
    localStorage.setItem('pixel_studio_animations', JSON.stringify(updatedAnims));
  };

  const handleSaveCredentials = () => {
    localStorage.setItem('pixel_studio_wifi_ssid', wifiSsid);
    localStorage.setItem('pixel_studio_wifi_pass', wifiPass);
    localStorage.setItem('pixel_studio_ntp_server', ntpServer);
    localStorage.setItem('pixel_studio_tz_info', tzInfo);
    localStorage.setItem('pixel_studio_owm_key', owmKey);
    localStorage.setItem('pixel_studio_owm_city', owmCity);
    localStorage.setItem('pixel_studio_owm_country', owmCountry);
    localStorage.setItem('pixel_studio_yt_api_key', ytApiKey);
    localStorage.setItem('pixel_studio_yt_channel_id', ytChannelId);
    setShowCredentialsModal(false);
    window.showToast('Configurations saved locally!', 'success');
  };

  const handleSaveScene = () => {
    const updated = [...scenes];
    updated[currentSceneIdx] = {
      ...updated[currentSceneIdx],
      createdAt: Date.now()
    };
    setScenes(updated);
    saveAllToStorage(updated, stickers, backgrounds, animations);
    window.showToast('Current studio scene configuration saved locally!', 'success');
  };



  // Widget manipulation
  const handleAddWidget = (type: WidgetType) => {
    if (!activeScene) return;
    pushToStudioHistory();

    let newWidget: Widget;
    const baseFields = {
      id: `${type}-${Date.now()}`,
      type,
      name: `${type.toUpperCase()} Layer`,
      x: 5,
      y: 4,
      width: 8,
      height: 8,
      zIndex: activeScene.widgets.length + 1
    };

    if (type === 'text') {
      newWidget = {
        ...baseFields,
        width: 70,
        text: 'HELLO',
        fontSize: 1,
        shadow: false,
        shadowColor: '#000000',
        alignment: 'left',
        scrollEffect: 'left',
        scrollSpeed: 4,
        color: '#6366f1',
        fontFamily: 'standard'
      } as Widget;
    } else if (type === 'sticker') {
      const defaultSticker = stickers[0] || DEFAULT_STICKERS[0];
      newWidget = {
        ...baseFields,
        stickerId: defaultSticker.id,
        pixelData: defaultSticker.pixels,
        width: defaultSticker.width,
        height: defaultSticker.height
      } as Widget;
    } else if (type === 'background') {
      newWidget = {
        ...baseFields,
        x: 0,
        y: 0,
        width: 80,
        height: 16,
        zIndex: 0, // Put bg at bottom
        bgType: 'solid',
        colors: ['#030712']
      } as Widget;
    } else if (type === 'time') {
      newWidget = {
        ...baseFields,
        width: 32,
        format: 'HH:MM',
        color: '#10b981',
        shadow: false,
        shadowColor: '#000000',
        fontSize: 1,
        scrollEffect: 'none',
        fontFamily: 'bold'
      } as Widget;
    } else if (type === 'date') {
      newWidget = {
        ...baseFields,
        width: 45,
        format: 'DD/MM/YYYY',
        color: '#3b82f6',
        shadow: false,
        shadowColor: '#000000',
        fontSize: 1,
        scrollEffect: 'none',
        fontFamily: 'standard'
      } as Widget;
    } else if (type === 'weather') {
      newWidget = {
        ...baseFields,
        x: 0,
        y: 0,
        width: 80,
        height: 16,
        param: 'clear',
        color: '#f59e0b',
        shadow: true,
        shadowColor: '#000000',
        fontSize: 1,
        scrollEffect: 'none',
        fontFamily: 'standard',
        iconX: 2,
        iconY: 0,
        textX: 22,
        textY: 0,
        tempColor: '#facc15',
        tempColorMode: 'followBrief',
        tempFontFamily: 'standard',
        tempFontSize: 1,
        tempShadow: true,
        tempShadowColorMode: 'auto',
        tempShadowColor: '#000000',
        humiColor: '#94a3b8',
        humiColorMode: 'followBrief',
        humiFontFamily: 'standard',
        humiFontSize: 1,
        humiShadow: true,
        humiShadowColorMode: 'auto',
        humiShadowColor: '#000000',
        humiX: 58,
        humiY: 0,
        briefColor: '#ffffff',
        briefColorMode: 'followBrief',
        briefFontFamily: 'bold',
        briefFontSize: 1,
        briefShadow: true,
        briefShadowColorMode: 'auto',
        briefShadowColor: '#000000',
        briefX: 22,
        briefY: 8,
      } as Widget;
    } else if (type === 'clock') {
      newWidget = {
        ...baseFields,
        x: 0,
        y: 0,
        width: 80,
        height: 16,
        color: '#ffffff',
        shadow: true,
        shadowColor: '#000000',
        fontSize: 1,
        fontFamily: 'bold',
        timeOfDayOverride: 'auto',
        bgX: 10,
        bgY: 8,
        dateX: 20,
        dateY: 0,
        timeX: 20,
        timeY: 8,
        dateFormat: 'DD MMM',
        timeFormat: 'HH:MM',
        dateColor: '#ffffff',
        timeColor: '#ffffff',
        dateColorMode: 'custom',
        timeColorMode: 'custom',
        dateFontFamily: 'standard',
        timeFontFamily: 'bold',
        dateFontSize: 1,
        timeFontSize: 1,
        dateShadow: true,
        timeShadow: true,
        dateShadowColorMode: 'auto',
        timeShadowColorMode: 'auto',
        dateShadowColor: '#000000',
        timeShadowColor: '#000000'
      } as Widget;
    } else if (type === 'weather-temp') {
      newWidget = {
        ...baseFields,
        type: 'weather-temp',
        x: 22, y: 0,
        width: 35, height: 8,
        color: '#facc15',
        shadow: true,
        shadowColor: '#000000',
        fontSize: 1,
        scrollEffect: 'none',
        fontFamily: 'standard',
      } as Widget;
    } else if (type === 'weather-humi') {
      newWidget = {
        ...baseFields,
        type: 'weather-humi',
        x: 58, y: 0,
        width: 22, height: 8,
        color: '#94a3b8',
        shadow: true,
        shadowColor: '#000000',
        fontSize: 1,
        scrollEffect: 'none',
        fontFamily: 'standard',
      } as Widget;
    } else if (type === 'weather-brief') {
      newWidget = {
        ...baseFields,
        type: 'weather-brief',
        x: 22, y: 8,
        width: 58, height: 8,
        color: '#ffffff',
        shadow: true,
        shadowColor: '#000000',
        fontSize: 1,
        scrollEffect: 'none',
        fontFamily: 'bold',
      } as Widget;
    } else if (type === 'timer') {
      newWidget = {
        ...baseFields,
        width: 30,
        durationSeconds: 300,
        color: '#ec4899',
        shadow: false,
        shadowColor: '#000000',
        fontSize: 1,
        scrollEffect: 'none',
        fontFamily: 'bold'
      } as Widget;
    } else if (type === 'shape') {
      newWidget = {
        ...baseFields,
        shapeType: 'rect',
        color: '#EA580C',
        borderColor: '#00000000',
        borderWidth: 1,
        filled: true,
        width: 10,
        height: 10
      } as Widget;
    } else if (type === 'youtube-sub') {
      newWidget = {
        ...baseFields,
        x: 0,
        y: 0,
        width: 35, // default layout width
        height: 8,  // default layout height
        color: '#ffffff',
        shadow: true,
        shadowColor: '#000000',
        shadowColorMode: 'auto',
        fontSize: 1,
        scrollEffect: 'none',
        fontFamily: 'bold',
        iconX: 0,
        iconY: 0,
        textX: 0,
        textY: 0,
        format: 'short'
      } as Widget;
    } else {
      newWidget = {
        ...baseFields,
        animType: 'prebuilt',
        prebuiltId: 'stars',
        width: 15,
        height: 16,
        color: '#ffffff',
        shadow: false,
        shadowColor: '#000000',
        fontSize: 1,
        scrollEffect: 'none',
        fontFamily: 'bold',
      } as Widget;
    }

    pushToStudioHistory();
    const updatedScenes = [...scenes];
    updatedScenes[currentSceneIdx] = {
      ...activeScene,
      widgets: [...activeScene.widgets, newWidget]
    };
    setScenes(updatedScenes);
    setSelectedWidgetId(newWidget.id);
    saveAllToStorage(updatedScenes, stickers, backgrounds, animations);
  };

  const handleUpdateWidget = (updated: Widget) => {
    if (!activeScene) return;
    pushToStudioHistory();
    const updatedWidgets = activeScene.widgets.map(w => {
      if (w.id === updated.id) {
        let target = updated;
        if (target.type === 'clock' || (target.type === 'weather' && (target as any).formatMode === 'predefined')) {
          target = { ...target, x: 0, y: 0, width: 80, height: 16 };
        } else if (target.type === 'weather' && (target as any).formatMode !== 'predefined') {
          if (w.type === 'weather' && (w as any).formatMode === 'predefined') {
            target = { ...target, width: 30, height: 8 };
          }
        }

        return target;
      }
      return w;
    });
    const updatedScenes = [...scenes];
    updatedScenes[currentSceneIdx] = {
      ...activeScene,
      widgets: updatedWidgets
    };
    setScenes(updatedScenes);
    saveAllToStorage(updatedScenes, stickers, backgrounds, animations);
  };

  const handleUpdateWidgetPosition = (id: string, x: number, y: number) => {
    if (!activeScene) return;
    const updatedWidgets = activeScene.widgets.map(w => {
      if (w.id === id) {
        if (w.type === 'clock' || (w.type === 'weather' && (w as any).formatMode === 'predefined')) {
          return { ...w, x: 0, y: 0, width: 80, height: 16 };
        }
        return { ...w, x, y };
      }
      return w;
    });
    const updatedScenes = [...scenes];
    updatedScenes[currentSceneIdx] = {
      ...activeScene,
      widgets: updatedWidgets
    };
    setScenes(updatedScenes);
  };

  const handleDeleteWidget = (id: string) => {
    if (!activeScene) return;
    pushToStudioHistory();
    const updatedWidgets = activeScene.widgets.filter(w => w.id !== id);
    const updatedScenes = [...scenes];
    updatedScenes[currentSceneIdx] = {
      ...activeScene,
      widgets: updatedWidgets
    };
    setScenes(updatedScenes);
    setSelectedWidgetId(null);
    saveAllToStorage(updatedScenes, stickers, backgrounds, animations);
  };

  // Scene CRUD
  const handleAddNewScene = () => {
    pushToStudioHistory();
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name: `Scene Layout ${scenes.length + 1}`,
      widgets: [
        {
          id: `bg-${Date.now()}`,
          type: 'background',
          name: 'Solid Dark BG',
          x: 0,
          y: 0,
          width: 80,
          height: 16,
          zIndex: 0,
          bgType: 'solid',
          colors: ['#0f172a']
        }
      ],
      createdAt: Date.now()
    };
    const nextScenes = [...scenes, newScene];
    setScenes(nextScenes);
    setCurrentSceneIdx(nextScenes.length - 1);
    saveAllToStorage(nextScenes, stickers, backgrounds, animations);
  };





  const handleDuplicateCurrentScene = () => {
    if (!activeScene) return;
    pushToStudioHistory();
    const duplicatedWidgets = activeScene.widgets.map(w => ({
      ...w,
      id: `${w.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    }));
    const newScene: Scene = {
      ...activeScene,
      id: `scene-${Date.now()}`,
      name: `${activeScene.name} Copy`,
      widgets: duplicatedWidgets,
      createdAt: Date.now()
    };
    const nextScenes = [...scenes];
    nextScenes.splice(currentSceneIdx + 1, 0, newScene);
    setScenes(nextScenes);
    setCurrentSceneIdx(currentSceneIdx + 1);
    saveAllToStorage(nextScenes, stickers, backgrounds, animations);
  };

  const handleDuplicateWidget = (id: string) => {
    if (!activeScene) return;
    const widget = activeScene.widgets.find(w => w.id === id);
    if (!widget) return;

    pushToStudioHistory();

    const duplicatedWidget = {
      ...widget,
      id: `${widget.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${widget.name} Copy`,
      x: Math.min(80 - widget.width, widget.x + 2),
      y: Math.min(16 - widget.height, widget.y + 2),
      zIndex: activeScene.widgets.length + 1
    };

    if (widget.type === 'background' || (widget.type === 'animation' && widget.width === 80)) {
      duplicatedWidget.x = widget.x;
      duplicatedWidget.y = widget.y;
    }

    const updatedWidgets = [...activeScene.widgets, duplicatedWidget];
    const updatedScenes = [...scenes];
    updatedScenes[currentSceneIdx] = {
      ...activeScene,
      widgets: updatedWidgets
    };

    setScenes(updatedScenes);
    setSelectedWidgetId(duplicatedWidget.id);
    saveAllToStorage(updatedScenes, stickers, backgrounds, animations);
  };

  // Hardware Connection Triggers
  // Hardware Connection Triggers
  const handleConnectWifiLive = () => {
    if (isConnectedWifiLive && wifiSocket) {
      const socket = wifiSocket;
      setWifiSocket(null);
      setIsConnectedWifiLive(false);
      setIsConnectingWifiLive(false);
      setLiveMode('off');
      socket.close();
    } else {
      if (!espIp.trim()) {
        window.showToast('Please enter your signboard ESP32 IP address first.', 'error');
        return;
      }
      setIsConnectingWifiLive(true);
      try {
        const socket = new WebSocket(`ws://${espIp}:81`);
        socket.binaryType = 'arraybuffer';

        socket.onopen = () => {
          setIsConnectedWifiLive(true);
          setIsConnectingWifiLive(false);
          setWifiSocket(socket);
          setLiveMode('wifi');
          console.log('WebSocket Live Connected!');
        };

        socket.onclose = () => {
          setIsConnectedWifiLive(false);
          setIsConnectingWifiLive(false);
          setWifiSocket(null);
          setLiveMode('off');
          console.log('WebSocket Live Connection Closed');
        };

        socket.onerror = (err) => {
          console.error('WebSocket Error:', err);
          window.showToast('WebSocket connection failed. Verify the ESP32 IP address and local network status.', 'error');
          setIsConnectedWifiLive(false);
          setIsConnectingWifiLive(false);
          setWifiSocket(null);
          setLiveMode('off');
        };
      } catch (e) {
        console.error('Failed to instantiate WebSocket:', e);
        setIsConnectingWifiLive(false);
      }
    }
  };

  const handleFrameUpdate = async (rgbBuffer: Uint8Array) => {
    if (isStreamingFrameRef.current) return;

    if (liveMode === 'wifi' && isConnectedWifiLive && wifiSocket && wifiSocket.readyState === WebSocket.OPEN) {
      if (wifiSocket.bufferedAmount > 3840 * 2) {
        return;
      }
      isStreamingFrameRef.current = true;
      try {
        // Apply brightness scaling to the buffer sent to the board
        const scaledBuffer = new Uint8Array(rgbBuffer.length);
        const scale = brightness / 255;
        for (let i = 0; i < rgbBuffer.length; i++) {
          scaledBuffer[i] = Math.floor(rgbBuffer[i] * scale);
        }
        wifiSocket.send(scaledBuffer.buffer as ArrayBuffer);
      } catch (err) {
        console.error('WiFi stream write failed:', err);
      } finally {
        isStreamingFrameRef.current = false;
      }
    }
  };

  // Asset builders delegates
  const handleSaveSticker = (newSticker: Sticker) => {
    const nextStickers = [...stickers, newSticker];
    setStickers(nextStickers);
    saveAllToStorage(scenes, nextStickers, backgrounds, animations);
  };

  const handleDeleteSticker = (id: string) => {
    const nextStickers = stickers.filter(s => s.id !== id);
    setStickers(nextStickers);
    saveAllToStorage(scenes, nextStickers, backgrounds, animations);
  };

  const handleSaveBackground = (newBg: BackgroundPreset) => {
    const nextBgs = [...backgrounds, newBg];
    setBackgrounds(nextBgs);
    saveAllToStorage(scenes, stickers, nextBgs, animations);
  };

  const handleDeleteBackground = (id: string) => {
    const nextBgs = backgrounds.filter(b => b.id !== id);
    setBackgrounds(nextBgs);
    saveAllToStorage(scenes, stickers, nextBgs, animations);
  };

  const handleSaveAnimation = (newAnim: AnimationPreset) => {
    const nextAnims = [...animations, newAnim];
    setAnimations(nextAnims);
    saveAllToStorage(scenes, stickers, backgrounds, nextAnims);
  };

  const handleDeleteAnimation = (id: string) => {
    const nextAnims = animations.filter(a => a.id !== id);
    setAnimations(nextAnims);
    saveAllToStorage(scenes, stickers, backgrounds, nextAnims);
  };

  const handlePublishToCommunity = async (type: 'scene' | 'sticker' | 'background' | 'animation', data: any) => {
    try {
      let collectionName = '';
      let payload = {};

      if (type === 'sticker') {
        collectionName = 'community_stickers';
        payload = {
          name: data.name,
          width: data.width,
          height: data.height,
          pixels: data.pixels,
          createdAt: Date.now()
        };
      } else if (type === 'background') {
        collectionName = 'community_backgrounds';
        payload = {
          name: data.name,
          bgType: data.bgType,
          colors: data.colors,
          cornerRadius: data.cornerRadius || 0,
          depthEffect: data.depthEffect || false,
          animationEffect: data.animationEffect || 'none',
          width: data.width || 80,
          height: data.height || 16,
          pixels: data.pixels || null,
          createdAt: Date.now()
        };
      } else if (type === 'animation') {
        collectionName = 'community_animations';
        payload = {
          name: data.name,
          animType: data.animType,
          prebuiltId: data.prebuiltId || null,
          frames: data.frames || null,
          width: data.width,
          height: data.height,
          frameRate: data.frameRate,
          createdAt: Date.now()
        };
      } else if (type === 'scene') {
        collectionName = 'community_scenes';
        payload = {
          name: data.name,
          widgets: data.widgets,
          createdAt: Date.now()
        };
      }

      await addDoc(collection(db, collectionName), payload);
      window.showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} published successfully to Community Hub!`, 'success');

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#06b6d4', '#ec4899']
      });
    } catch (error) {
      console.error("Error publishing to community:", error);
      window.showToast('Failed to publish to community hub.', 'error');
    }
  };

  const handleDownloadSticker = (st: Sticker) => {
    if (stickers.some(s => s.id === st.id)) {
      window.showToast('Sticker already downloaded!', 'info');
      return;
    }
    handleSaveSticker(st);
    window.showToast('Downloaded sticker added to Local Library!', 'success');
  };

  const handleDownloadBackground = (bg: BackgroundPreset) => {
    if (backgrounds.some(b => b.id === bg.id)) {
      window.showToast('Background already downloaded!', 'info');
      return;
    }
    handleSaveBackground(bg);
    window.showToast('Downloaded background added to Local Library!', 'success');
  };

  const handleDownloadAnimation = (an: AnimationPreset) => {
    if (animations.some(a => a.id === an.id)) {
      window.showToast('Animation already downloaded!', 'info');
      return;
    }
    handleSaveAnimation(an);
    window.showToast('Downloaded animation added to Local Library!', 'success');
  };

  const handleDownloadScene = (sc: Scene) => {
    if (scenes.some(s => s.id === sc.id)) {
      window.showToast('Scene already downloaded!', 'info');
      return;
    }

    // Parse scene widgets to import any local custom stickers, backgrounds, or animations
    const importedStickers = [...stickers];
    const importedBackgrounds = [...backgrounds];
    const importedAnimations = [...animations];
    let countImported = 0;

    sc.widgets.forEach(w => {
      if (w.type === 'sticker' && w.pixelData && w.stickerId) {
        if (!importedStickers.some(s => s.id === w.stickerId)) {
          importedStickers.push({
            id: w.stickerId,
            name: `${sc.name} Sticker ${++countImported}`,
            width: w.width,
            height: w.height,
            pixels: w.pixelData
          });
        }
      } else if (w.type === 'background' && w.pixelData && w.backgroundId) {
        if (!importedBackgrounds.some(b => b.id === w.backgroundId)) {
          importedBackgrounds.push({
            id: w.backgroundId,
            name: `${sc.name} Background`,
            bgType: 'pixels',
            colors: [],
            width: w.width,
            height: w.height,
            pixels: w.pixelData
          });
        }
      } else if (w.type === 'animation' && w.frames && w.customAnimId) {
        if (!importedAnimations.some(a => a.id === w.customAnimId)) {
          importedAnimations.push({
            id: w.customAnimId,
            name: `${sc.name} Animation`,
            animType: 'custom',
            width: w.width,
            height: w.height,
            frameRate: w.frameRate || 10,
            frames: w.frames
          });
        }
      }
    });

    const nextScenes = [...scenes, sc];
    setScenes(nextScenes);
    setStickers(importedStickers);
    setBackgrounds(importedBackgrounds);
    setAnimations(importedAnimations);

    saveAllToStorage(nextScenes, importedStickers, importedBackgrounds, importedAnimations);
    window.showToast('Downloaded scene and its custom assets added to library!', 'success');
  };

  // Exporter Action
  const triggerCodeDownload = () => {
    const code = generateArduinoCode({
      wifiSsid,
      wifiPass,
      ntpServer,
      tzInfo,
      owmKey,
      owmCity,
      owmCountry,
      ytApiKey,
      ytChannelId,
      scenes,
      stickers,
      brightness
    });

    const element = document.createElement("a");
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "firmware.ino";
    document.body.appendChild(element);
    element.click();
    element.remove();
    setShowExportModal(false);
  };

  // Navigation Menu Renderer
  const renderNavBar = () => (
    <div className="top-nav-container">
      <button 
        onClick={() => setActiveTab('studio')}
        className={`nav-tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
      >
        <Monitor size={14} /> Studio Twin <kbd>1</kbd>
      </button>
      <button 
        onClick={() => setActiveTab('stickers')}
        className={`nav-tab-btn ${activeTab === 'stickers' ? 'active' : ''}`}
      >
        <StickerIcon size={14} /> Sticker Paint <kbd>2</kbd>
      </button>
      <button 
        onClick={() => setActiveTab('backgrounds')}
        className={`nav-tab-btn ${activeTab === 'backgrounds' ? 'active' : ''}`}
      >
        <Image size={14} /> Backgrounds <kbd>3</kbd>
      </button>
      <button 
        onClick={() => setActiveTab('animations')}
        className={`nav-tab-btn ${activeTab === 'animations' ? 'active' : ''}`}
      >
        <Flame size={14} /> Animations <kbd>4</kbd>
      </button>
      <button 
        onClick={() => setActiveTab('community')}
        className={`nav-tab-btn ${activeTab === 'community' ? 'active' : ''}`}
      >
        <Sparkles size={14} className="text-amber-500" /> Community <kbd>5</kbd>
      </button>
    </div>
  );

  return (
    <div className="app-container">
      {/* 1. Header Navigation Bar */}
      <header className="glass-panel app-header">
        <div className="logo-section">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt="Pixel Studio Logo"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              display: 'block'
            }}
          />
          <div>
            <h1 className="logo-text-title rainbow-text">PIXEL STUDIO</h1>
            <p className="logo-text-subtitle">Signboard Control Center</p>
          </div>
        </div>

        {/* Connection & General Controls */}
        <div className="header-actions-group">
          {/* Status Display (Offline/Online/Connecting) */}
          <div className="connection-status-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(0, 0, 0, 0.03)', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.04)', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
            <span className="status-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: isConnectedWifiLive ? '#10b981' : (isConnectingWifiLive ? '#d97706' : '#ef4444'), boxShadow: isConnectedWifiLive ? '0 0 8px #10b981' : (isConnectingWifiLive ? '0 0 8px #d97706' : 'none') }} />
            <span>{isConnectedWifiLive ? 'Online' : (isConnectingWifiLive ? 'Connecting...' : 'Offline')}</span>
          </div>

          {/* Connection Controls (IP Input & Connect/Disconnect Button) */}
          <div className="connection-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 0, 0, 0.03)', padding: '4px 4px 4px 12px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.04)' }}>
            <Wifi size={14} style={{ color: 'var(--primary)' }} />
            <input
              type="text"
              placeholder="ESP32 IP..."
              value={espIp}
              onChange={(e) => {
                const ip = e.target.value;
                setEspIp(ip);
                localStorage.setItem('pixel_studio_esp_ip', ip);
              }}
              className="glass-input-inline"
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '11px', width: '90px', padding: '0 4px', color: 'var(--text-main)', fontWeight: 600 }}
            />
            <button
              onClick={handleConnectWifiLive}
              disabled={isConnectingWifiLive}
              className="btn btn-pill"
              style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '12px', background: isConnectedWifiLive ? 'var(--danger)' : (isConnectingWifiLive ? 'var(--accent)' : 'var(--primary)'), color: '#fff', border: 'none', transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
            >
              {isConnectedWifiLive ? 'Disconnect' : (isConnectingWifiLive ? 'Connecting...' : 'Connect')} <kbd style={{ padding: '1px 3px', fontSize: '8px', marginLeft: '2px', borderBottom: '1px solid rgba(0,0,0,0.2)' }}>C</kbd>
            </button>
          </div>

          {/* Global Brightness Slider */}
          <div className="connection-pill" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 0, 0, 0.03)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>BRIGHTNESS</span>
            <input
              type="range"
              min="0"
              max="255"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="slider-input"
              style={{ width: '70px', height: '4px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '10px', fontFamily: 'monospace', width: '20px', color: 'var(--text-muted)', textAlign: 'right', fontWeight: 600 }}>{brightness}</span>
          </div>

          <button
            onClick={() => setShowShortcutsModal(true)}
            className="btn btn-secondary btn-circle"
            style={{ padding: '8px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Keyboard Shortcuts Guide (Press ?)"
          >
            <HelpCircle size={14} />
          </button>

          <button
            onClick={() => setShowCredentialsModal(true)}
            className="btn btn-secondary btn-circle"
            style={{ padding: '8px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Configure Credentials"
          >
            <Settings size={14} />
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="btn btn-primary btn-pill"
          >
            <Download size={14} /> Export Firmware
          </button>
        </div>
      </header>

      {/* 2. Main Tab Viewports */}
      <main className="app-workspace">
        {activeTab === 'studio' && (
          <div className="studio-grid-layout">
            {/* LEFT COLUMN: Layers & Add Tool widgets */}
            <section className="glass-panel workspace-panel">
              <div className="scrollable-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 className="panel-header">
                    <span>Scenes List</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={handleAddNewScene}
                        className="btn btn-secondary"
                        style={{ padding: '3px 6px', fontSize: '10px', borderRadius: '4px' }}
                        title="New scene (Press N)"
                      >
                        <Plus size={10} />
                      </button>
                      <button
                        onClick={handleResetToDefaults}
                        className="btn btn-danger"
                        style={{ padding: '3px 6px', fontSize: '10px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}
                        title="Reset all data to defaults"
                      >
                        Reset
                      </button>
                    </div>
                  </h3>
                  <div className="scenes-list-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', maxHeight: '180px', overflowY: 'auto' }}>
                    {scenes.map((sc, i) => (
                      <div
                        key={sc.id}
                        onClick={() => setCurrentSceneIdx(i)}
                        className={`layer-list-item ${currentSceneIdx === i ? 'selected' : ''}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 10px',
                          cursor: draggedSceneIdx === i ? 'grabbing' : 'grab',
                          opacity: draggedSceneIdx === i ? 0.4 : 1,
                        }}
                        draggable={renamingSceneIdx !== i}
                        onDragStart={(e) => handleSceneDragStart(e, i)}
                        onDragOver={handleSceneDragOver}
                        onDrop={(e) => handleSceneDrop(e, i)}
                        onDragEnd={handleSceneDragEnd}
                      >
                        {renamingSceneIdx === i ? (
                          <input
                            type="text"
                            value={renamingSceneValue}
                            onChange={(e) => setRenamingSceneValue(e.target.value)}
                            onBlur={() => {
                              if (renamingSceneValue.trim()) {
                                const updated = [...scenes];
                                updated[i] = { ...updated[i], name: renamingSceneValue };
                                setScenes(updated);
                                saveAllToStorage(updated, stickers, backgrounds, animations);
                              }
                              setRenamingSceneIdx(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              } else if (e.key === 'Escape') {
                                setRenamingSceneIdx(null);
                              }
                            }}
                            autoFocus
                            className="glass-input"
                            style={{ padding: '2px 6px', fontSize: '12px', height: '24px', width: '120px' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', opacity: 0.6 }}>{i + 1}.</span>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: 600 }}>{sc.name}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePublishScene(sc);
                            }}
                            disabled={publishingSceneId === sc.id}
                            className="btn btn-secondary"
                            style={{
                              padding: '4px',
                              borderRadius: '4px',
                              color: publishedSceneIds.has(sc.id) ? '#10b981' : 'var(--secondary)',
                              background: publishedSceneIds.has(sc.id) ? 'rgba(16, 185, 129, 0.08)' : ''
                            }}
                            title="Publish scene to Community Hub"
                          >
                            {publishingSceneId === sc.id ? (
                              <div className="spinner-border animate-spin" style={{ width: '10px', height: '10px', border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                            ) : publishedSceneIds.has(sc.id) ? (
                              <Check size={10} />
                            ) : (
                              <Share2 size={10} />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingSceneIdx(i);
                              setRenamingSceneValue(sc.name);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '4px', borderRadius: '4px' }}
                            title="Rename scene"
                          >
                            <Edit size={10} />
                          </button>
                          <button
                            onClick={() => {
                              setCurrentSceneIdx(i);
                              pushToStudioHistory();
                              const targetScene = scenes[i];
                              const duplicatedWidgets = targetScene.widgets.map(w => ({
                                ...w,
                                id: `${w.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
                              }));
                              const newScene: Scene = {
                                ...targetScene,
                                id: `scene-${Date.now()}`,
                                name: `${targetScene.name} Copy`,
                                widgets: duplicatedWidgets,
                                createdAt: Date.now()
                              };
                              const nextScenes = [...scenes];
                              nextScenes.splice(i + 1, 0, newScene);
                              setScenes(nextScenes);
                              setCurrentSceneIdx(i + 1);
                              saveAllToStorage(nextScenes, stickers, backgrounds, animations);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '4px', borderRadius: '4px' }}
                            title="Duplicate scene"
                          >
                            <Copy size={10} />
                          </button>
                          <button
                            onClick={() => {
                              if (scenes.length <= 1) return;
                              pushToStudioHistory();
                              const nextScenes = scenes.filter((_, idx) => idx !== i);
                              setScenes(nextScenes);
                              setCurrentSceneIdx(0);
                              saveAllToStorage(nextScenes, stickers, backgrounds, animations);
                            }}
                            disabled={scenes.length <= 1}
                            className="btn btn-danger"
                            style={{ padding: '4px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}
                            title="Delete scene"
                          >
                            <Trash size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Toolset */}
                <div>
                  <h3 className="panel-header">Add Widgets</h3>
                  <div className="widget-adder-grid">
                    {([
                      { type: 'text', Icon: Type, label: 'Text', desc: 'Static or scrolling text label' },
                      { type: 'date', Icon: CalendarDays, label: 'Date', desc: 'Live date display' },
                      { type: 'time', Icon: Clock, label: 'Time', desc: 'Live time display' },
                      { type: 'clock', Icon: CloudSun, label: 'Clock', desc: 'Animated day/night clock face' },
                      { type: 'timer', Icon: Timer, label: 'Timer', desc: 'Countdown timer widget' },
                      { type: 'weather', Icon: Cloud, label: 'Weather', desc: 'Full animated weather face' },
                      { type: 'weather-temp', Icon: Thermometer, label: 'Temp', desc: 'Temperature readout only' },
                      { type: 'weather-humi', Icon: Droplets, label: 'Humidity', desc: 'Humidity readout only' },
                      { type: 'weather-brief', Icon: Wind, label: 'Brief', desc: 'Weather description only' },
                      { type: 'youtube-sub', Icon: Youtube, label: 'YouTube', desc: 'YouTube subscriber count widget' },
                      { type: 'sticker', Icon: StickerIcon, label: 'Sticker', desc: 'Custom pixel-art sticker' },
                      { type: 'background', Icon: GalleryHorizontal, label: 'Background', desc: 'Background image or gradient' },
                      { type: 'animation', Icon: Clapperboard, label: 'Animation', desc: 'Prebuilt looping animation' },
                      { type: 'shape', Icon: Square, label: 'Shape', desc: 'Rectangle, line or ellipse' },
                    ] as const).map(({ type, Icon, label, desc }) => (
                      <button
                        key={type}
                        onClick={() => handleAddWidget(type as any)}
                        className="widget-add-btn"
                        title={desc}
                      >
                        <span className="btn-tooltip">{desc}</span>
                        <span className="btn-icon-wrap"><Icon size={14} /></span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Layer hierarchy */}
                <div>
                  <h3 className="panel-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Layers size={12} /> Layers List</span>
                  </h3>
                  <div className="layers-list-group">
                    {[...(activeScene?.widgets || [])].sort((a, b) => b.zIndex - a.zIndex).map((widget) => (
                      <div
                        key={widget.id}
                        onClick={() => setSelectedWidgetId(widget.id)}
                        className={`layer-list-item ${selectedWidgetId === widget.id ? 'selected' : ''}`}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}
                      >
                        {renamingWidgetId === widget.id ? (
                          <input
                            type="text"
                            value={renamingWidgetValue}
                            onChange={(e) => setRenamingWidgetValue(e.target.value)}
                            onBlur={() => {
                              if (renamingWidgetValue.trim()) {
                                const updatedWidgets = activeScene.widgets.map(w => w.id === widget.id ? { ...w, name: renamingWidgetValue } : w);
                                const updatedScenes = [...scenes];
                                updatedScenes[currentSceneIdx] = {
                                  ...activeScene,
                                  widgets: updatedWidgets
                                };
                                setScenes(updatedScenes);
                                saveAllToStorage(updatedScenes, stickers, backgrounds, animations);
                              }
                              setRenamingWidgetId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              } else if (e.key === 'Escape') {
                                setRenamingWidgetId(null);
                              }
                            }}
                            autoFocus
                            className="glass-input"
                            style={{ padding: '2px 6px', fontSize: '11px', height: '22px', width: '100px' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{widget.name}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingWidgetId(widget.id);
                              setRenamingWidgetValue(widget.name);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '4px', borderRadius: '4px' }}
                            title="Rename layer"
                          >
                            <Edit size={10} />
                          </button>
                          <button
                            onClick={() => handleDuplicateWidget(widget.id)}
                            className="btn btn-secondary"
                            style={{ padding: '4px', borderRadius: '4px' }}
                            title="Duplicate layer"
                          >
                            <Copy size={10} />
                          </button>
                          <button
                            onClick={() => handleDeleteWidget(widget.id)}
                            className="btn btn-danger"
                            style={{ padding: '4px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}
                            title="Delete layer"
                          >
                            <Trash size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={handleStudioUndo}
                  disabled={studioHistory.length === 0}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px' }}
                >
                  <Undo size={12} /> Undo
                </button>
                <button
                  onClick={handleStudioRedo}
                  disabled={studioRedoStack.length === 0}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px' }}
                >
                  <Redo size={12} /> Redo
                </button>
              </div>

              <button
                onClick={handleSaveScene}
                className="btn btn-primary"
                style={{ marginTop: '8px', width: '100%' }}
              >
                Save Layout Design
              </button>
            </section>

            {/* CENTER COLUMN: Digital Twin Simulator */}
            <section className="center-canvas-area">
              {renderNavBar()}
              <DigitalTwin
                widgets={activeScene?.widgets || []}
                stickers={stickers}
                selectedWidgetId={selectedWidgetId}
                onSelectWidget={setSelectedWidgetId}
                onUpdateWidgetPosition={handleUpdateWidgetPosition}
                onFrameUpdate={handleFrameUpdate}
                onDragStart={pushToStudioHistory}
                onDragEnd={() => saveAllToStorage(scenes, stickers, backgrounds, animations)}
                ytSubCount={ytSubCount}
              />
            </section>

            {/* RIGHT COLUMN: Property configurator */}
            <section className="glass-panel workspace-panel" style={{ height: '100%', overflow: 'hidden' }}>
              <PropertiesPanel
                selectedWidget={activeScene?.widgets.find(w => w.id === selectedWidgetId) || null}
                stickers={stickers}
                backgrounds={backgrounds}
                animations={animations}
                onUpdateWidget={handleUpdateWidget}
              />
            </section>
          </div>
        )}

        {activeTab === 'stickers' && (
          <StickerBuilder
            stickers={stickers}
            onSaveSticker={handleSaveSticker}
            onDeleteSticker={handleDeleteSticker}
            onPublishToCommunity={(_, d) => {
              handleSaveSticker(d);
              handlePublishToCommunity('sticker', d);
            }}
            navBar={renderNavBar()}
          />
        )}

        {activeTab === 'backgrounds' && (
          <BackgroundBuilder
            backgrounds={backgrounds}
            onSaveBackground={handleSaveBackground}
            onDeleteBackground={handleDeleteBackground}
            onPublishToCommunity={(_, d) => {
              handleSaveBackground(d);
              handlePublishToCommunity('background', d);
            }}
            navBar={renderNavBar()}
          />
        )}

        {activeTab === 'animations' && (
          <AnimationBuilder
            animations={animations}
            onSaveAnimation={handleSaveAnimation}
            onDeleteAnimation={handleDeleteAnimation}
            onPublishToCommunity={(_, d) => {
              handleSaveAnimation(d);
              handlePublishToCommunity('animation', d);
            }}
            navBar={renderNavBar()}
          />
        )}

        {activeTab === 'community' && (
          <CommunityMarketplace
            onDownloadSticker={handleDownloadSticker}
            onDownloadBackground={handleDownloadBackground}
            onDownloadAnimation={handleDownloadAnimation}
            onDownloadScene={handleDownloadScene}
            navBar={renderNavBar()}
          />
        )}
      </main>

      <footer className="app-footer">
        <div>
          © 2026 <a href="https://www.makerbrains.com" target="_blank" rel="noopener noreferrer">Maker Brains</a> All rights reserved. | contact: <a href="mailto:mukeshdiy1@gmail.com">mukeshdiy1@gmail.com</a>
        </div>
        <div>
          Made with ❤️ by <a href="https://www.linkedin.com/in/mukeshsankhla/" target="_blank" rel="noopener noreferrer">Mukesh Sankhla</a>
        </div>
      </footer>

      {/* 3. Export Code Dialog Box Modal */}
      {showExportModal && (
        <div className="modal-backdrop-layer">
          <div className="glass-panel modal-dialog-box">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
              <Cpu className="text-indigo-500" size={18} /> Export Arduino Sketch
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>This will compile your customized scenes, scrolling text options, stickers data, and WiFi settings into a ready-to-flash `firmware.ino` sketch.</p>

            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.04)', fontSize: '11px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p><span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>SSID:</span> {wifiSsid}</p>
              <p><span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>OWM Key:</span> {owmKey.substring(0, 8)}...</p>
              <p><span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>OWM City:</span> {owmCity}, {owmCountry}</p>
              <p><span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>YouTube Key:</span> {ytApiKey ? `${ytApiKey.substring(0, 8)}...` : 'Not Set'}</p>
              <p><span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>YouTube Channel:</span> {ytChannelId}</p>
              <p><span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>NTP Server:</span> {ntpServer}</p>
              <p><span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>Total Scenes:</span> {scenes.length}</p>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowExportModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={triggerCodeDownload}
                className="btn btn-primary btn-pill"
              >
                <Download size={14} /> Download Sketch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Credentials Settings Modal */}
      {showCredentialsModal && (
        <div className="modal-backdrop-layer">
          <div className="glass-panel modal-dialog-box" style={{ maxWidth: '520px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
              <Settings className="text-indigo-500" size={18} /> Device Credentials & APIs
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Specify network details and API keys used in the generated firmware sketch.</p>

            <div className="credentials-inputs-grid">
              <div className="prop-field">
                <label className="prop-label">WiFi SSID</label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="prop-field">
                <label className="prop-label">WiFi Password</label>
                <input
                  type="password"
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="prop-field full-span-grid">
                <label className="prop-label">OpenWeatherMap API Key</label>
                <input
                  type="text"
                  value={owmKey}
                  onChange={(e) => setOwmKey(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="prop-field full-span-grid">
                <label className="prop-label">YouTube API Key</label>
                <input
                  type="text"
                  value={ytApiKey}
                  onChange={(e) => setYtApiKey(e.target.value)}
                  className="glass-input"
                  placeholder="Enter Google Cloud API Key..."
                />
              </div>
              <div className="prop-field full-span-grid">
                <label className="prop-label">YouTube Channel ID</label>
                <input
                  type="text"
                  value={ytChannelId}
                  onChange={(e) => setYtChannelId(e.target.value)}
                  className="glass-input"
                  placeholder="e.g. UCFYguRGMmGpH493PDX5WmBA"
                />
              </div>
              <div className="prop-field">
                <label className="prop-label">NTP Server</label>
                <input
                  type="text"
                  value={ntpServer}
                  onChange={(e) => setNtpServer(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="prop-field">
                <label className="prop-label">OWM Target City</label>
                <input
                  type="text"
                  value={owmCity}
                  onChange={(e) => setOwmCity(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="prop-field">
                <label className="prop-label">Country Code</label>
                <input
                  type="text"
                  value={owmCountry}
                  onChange={(e) => setOwmCountry(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="prop-field full-span-grid">
                <label className="prop-label">Timezone Rule (TZ)</label>
                <input
                  type="text"
                  value={tzInfo}
                  onChange={(e) => setTzInfo(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                onClick={handleSaveCredentials}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Save Configurations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="modal-backdrop-layer" onClick={() => setShowShortcutsModal(false)}>
          <div className="glass-panel modal-dialog-box" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '12px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                <HelpCircle size={20} style={{ color: 'var(--primary)' }} /> Keyboard Shortcuts Guide
              </h3>
              <button onClick={() => setShowShortcutsModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                Close [Esc]
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxHeight: '420px', overflowY: 'auto', paddingRight: '8px', fontSize: '12px' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '14px', marginBottom: '10px', color: 'var(--primary)' }}>Global Navigation</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Studio Workspace Tab</span> <kbd>1</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sticker Builder Tab</span> <kbd>2</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Background Builder Tab</span> <kbd>3</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Animation Builder Tab</span> <kbd>4</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Community Marketplace Tab</span> <kbd>5</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Toggle Shortcuts Guide</span> <kbd>?</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Toggle WiFi Connection</span> <kbd>C</kbd></p>
                </div>

                <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '14px', marginTop: '16px', marginBottom: '10px', color: 'var(--primary)' }}>Studio Mode</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Add New Scene</span> <kbd>N</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Duplicate Scene</span> <kbd>D</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Save Layout Design</span> <kbd>S</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Duplicate Selected Widget</span> <kbd>W</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delete Selected Widget</span> <kbd>Del / Backspace</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Move Widget</span> <kbd>Arrows ↑↓←→</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Undo Action</span> <kbd>Ctrl + Z</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Redo Action</span> <kbd>Ctrl + Y</kbd></p>
                </div>
              </div>

              <div>
                <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '14px', marginBottom: '10px', color: 'var(--primary)' }}>Builder Modes (Sticker/BG)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Select Paint Brush</span> <kbd>P</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Select Eraser Tool</span> <kbd>E</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Select Rectangle Shape</span> <kbd>R</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Select Circle Shape</span> <kbd>O</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Select Line Shape</span> <kbd>L</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Clear Grid Canvas</span> <kbd>K</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Select Flood Fill</span> <kbd>F</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fill Entire Grid</span> <kbd>G</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Toggle Mirror H</span> <kbd>H</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Toggle Mirror V</span> <kbd>V</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Save Asset</span> <kbd>S</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Import Image</span> <kbd>I</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Export JSON</span> <kbd>X</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Import JSON</span> <kbd>J</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Publish to Community Hub</span> <kbd>U</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Undo Drawing Stroke</span> <kbd>Ctrl + Z</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Redo Drawing Stroke</span> <kbd>Ctrl + Y</kbd></p>
                </div>

                <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '14px', marginTop: '16px', marginBottom: '10px', color: 'var(--primary)' }}>Animation Builder</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Play / Pause Timeline</span> <kbd>Space</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Add New Frame</span> <kbd>A</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Duplicate Active Frame</span> <kbd>D</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Previous Frame</span> <kbd>[</kbd></p>
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Next Frame</span> <kbd>]</kbd></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
