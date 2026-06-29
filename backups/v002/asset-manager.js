/**
 * Asset Manager - Central registry for all game assets
 * ----------------------------------------------------------
 * Catalogs fonts, 3D models, images, SFX, and music tracks.
 * Provides loading helpers and user preference storage.
 *
 * Import as: import * as Assets from './asset-manager.js'
 */

// ─── Fonts ──────────────────────────────────────────────────────────────────

export const FONTS = {
  pacfontZEBZ: {
    name: 'Pacfont ZEBZ',
    path: 'assets/fonts/Pacfont-ZEBZ.ttf',
    family: 'Pacfont-ZEBZ',
    description: 'Classic Pac-Man arcade font'
  },
  pacfontGood: {
    name: 'Pacfont Good',
    path: 'assets/fonts/PacfontGood-yYye.ttf',
    family: 'PacfontGood',
    description: 'Pac-Man font variant'
  },
  fantasmytas: {
    name: 'Fantasmytas St',
    path: 'assets/fonts/FantasmytasSt-8YDJ.ttf',
    family: 'Fantasmytas',
    description: 'Playful rounded display font'
  },
  pressStart2P: {
    name: 'Press Start 2P',
    path: 'assets/fonts/PressStart2P-Regular.ttf',
    family: 'Press Start 2P',
    description: 'Classic pixel arcade font'
  },
  vt323: {
    name: 'VT323',
    path: 'assets/fonts/VT323-Regular.ttf',
    family: 'VT323',
    description: 'Retro terminal-style font'
  },
  pixelifySans: {
    name: 'Pixelify Sans',
    path: 'assets/fonts/PixelifySans-Regular.ttf',
    family: 'Pixelify Sans',
    description: 'Modern pixel-perfect font'
  }
};

// ─── 3D Models ──────────────────────────────────────────────────────────────

/**
 * Pacman model definitions.
 * Each entry: { id, name, path (without extension), description, type }
 */
export const PACMAN_MODELS = {
  classic: {
    id: 'classic',
    name: 'Classic Sphere',
    description: 'Original geometric pac-man (no model needed)',
    path: null,
    type: 'builtin'
  },
  yellow: {
    id: 'yellow',
    name: 'Yellow Pac-Man',
    path: 'assets/models/pacman/yellow',
    description: 'Yellow pac-man 3D model',
    type: 'gltf'
  },
  robo: {
    id: 'robo',
    name: 'Robot Pac-Man',
    path: 'assets/models/pacman/robo',
    description: 'Robot-style pac-man',
    type: 'gltf'
  },
  girl: {
    id: 'girl',
    name: 'Girl Pac-Man',
    path: 'assets/models/pacman/girl_pacman_animated/girl_pacman_animated',
    description: 'Animated girl pac-man character',
    type: 'gltf'
  },
  pixel: {
    id: 'pixel',
    name: 'Pixel Pac-Man',
    path: 'assets/models/pacman/pac_man_pixels/pixel',
    description: 'Pixel art style pac-man',
    type: 'gltf'
  },
  rockin: {
    id: 'rockin',
    name: "Rock 'n Roll Pac-Man",
    path: 'assets/models/pacman/pac_n_roll/rockinpm',
    description: 'Rock and roll themed pac-man',
    type: 'gltf'
  },
  pinkyPac: {
    id: 'pinkyPac',
    name: 'Pinky Pac-Man',
    path: 'assets/models/ghost/pinky/scene',
    description: 'Pinky character pac-man model',
    type: 'gltf'
  },
  inkyPac: {
    id: 'inkyPac',
    name: 'Inky Pac-Man',
    path: 'assets/models/ghost/inky',
    description: 'Inky the blue ghost as pac-man',
    type: 'gltf'
  },
  bluePac: {
    id: 'bluePac',
    name: 'Blue Ghost Pac-Man',
    path: 'assets/models/ghost/blue_ghost/blue',
    description: 'Blue ghost character as pac-man',
    type: 'gltf'
  },
  candyPac: {
    id: 'candyPac',
    name: 'Candy Pac-Man',
    path: 'assets/models/ghost/candy_monsters/candy',
    description: 'Candy monster as pac-man',
    type: 'gltf'
  },
  pacManExtract: {
    id: 'pacManExtract',
    name: 'Pac-Man (Extract)',
    path: 'assets/models/pacman/pac_man/scene',
    description: 'Pac-Man model extracted from character pack',
    type: 'gltf'
  },
  robotPac: {
    id: 'robotPac',
    name: 'Robot Pac-Man v2',
    path: 'assets/models/pacman/robot_pac-man/scene',
    description: 'Robot pac-man variant from character pack',
    type: 'gltf'
  },
  pinkyExtract: {
    id: 'pinkyExtract',
    name: 'Pinky Extract',
    path: 'assets/models/ghost/pinky/scene',
    description: 'Pinky ghost model (extracted copy)',
    type: 'gltf'
  }
};

export const GHOST_MODELS = {
  classic: {
    id: 'classic',
    name: 'Classic Sphere',
    description: 'Original geometric ghost (no model needed)',
    path: null,
    type: 'builtin'
  },
  inky: {
    id: 'inky',
    name: 'Inky (Blue Ghost)',
    path: 'assets/models/ghost/inky',
    description: 'Inky the blue ghost with animated eyes',
    type: 'gltf'
  },
  blueGhost: {
    id: 'blueGhost',
    name: 'Blue Ghost Character',
    path: 'assets/models/ghost/blue_ghost/blue',
    description: 'Blue ghost character model',
    type: 'gltf'
  },
  pinky: {
    id: 'pinky',
    name: 'Pinky Ghost',
    path: 'assets/models/ghost/pinky/scene',
    description: 'Pinky the pink ghost',
    type: 'gltf'
  },
  candy: {
    id: 'candy',
    name: 'Candy Monsters',
    path: 'assets/models/ghost/candy_monsters/candy',
    description: 'Candy-colored ghost monsters',
    type: 'gltf'
  }
};

// ─── Images ──────────────────────────────────────────────────────────────────

export const GHOST_IMAGES = {
  kinky: { name: 'Kinky Ghost', path: 'assets/images/ghost/kinky.png' },
  pinky: { name: 'Pinky Ghost', path: 'assets/images/ghost/pinky.png' },
  rinky: { name: 'Rinky Ghost', path: 'assets/images/ghost/rinky.png' },
  stinky: { name: 'Stinky Ghost', path: 'assets/images/ghost/stinky.png' }
};

export const PACMAN_IMAGES = {
  pacmanGif: { name: 'Pac-Man GIF', path: 'assets/images/pacman/PacMan.gif' },
  pacDeath: { name: 'Pac-Man Death', path: 'assets/images/pacman/pac-death.gif' }
};

export const INTRO_IMAGES = {
  arnold: { name: 'Arnold', path: 'assets/images/intro/arnold.gif' },
  cherry: { name: 'Cherry', path: 'assets/images/intro/cherry.png' },
  danceBanana: { name: 'Dance Banana', path: 'assets/images/intro/dance-banana.gif' },
  grapes: { name: 'Grapes', path: 'assets/images/intro/Grapes.png' },
  loadingBack: { name: 'Loading Back', path: 'assets/images/intro/loading-back.png' },
  loadingBackPng: { name: 'Loading Back PNG', path: 'assets/images/intro/loading-back.png' },
  loadingBackPlus: { name: 'Loading Back Plus', path: 'assets/images/intro/loading-plus-back.png' },
  oo: { name: 'OO', path: 'assets/images/intro/oo.gif' },
  untitled: { name: 'Untitled', path: 'assets/images/intro/Untitled.gif' }
};

export const SPLASH_IMAGES = {
  loadingBack: { name: 'Loading Screen', path: 'assets/images/intro/loading-back.png' },
  loadingBackPlus: { name: 'Loading Screen Plus', path: 'assets/images/intro/loading-plus-back.png' },
  pacmanClassic: { name: 'Pac-Man Classic', path: 'assets/images/icon/pac-man-classic.jpg' },
  arnold: { name: 'Arnold', path: 'assets/images/intro/arnold.gif' },
  cherry: { name: 'Cherry', path: 'assets/images/intro/cherry.png' },
  danceBanana: { name: 'Dance Banana', path: 'assets/images/intro/dance-banana.gif' },
  grapes: { name: 'Grapes', path: 'assets/images/intro/Grapes.png' },
  untitled: { name: 'Untitled', path: 'assets/images/intro/Untitled.gif' }
};

export const ICON_IMAGES = {
  pacmanClassic: { name: 'Pac-Man Classic', path: 'assets/images/icon/pac-man-classic.jpg' }
};

/**
 * Get all images as a flat array.
 */
export function getAllImages() {
  return [
    ...Object.values(GHOST_IMAGES),
    ...Object.values(PACMAN_IMAGES),
    ...Object.values(INTRO_IMAGES),
    ...Object.values(ICON_IMAGES),
    ...Object.values(MISC_IMAGES)
  ];
}

// ─── Sound Effects ──────────────────────────────────────────────────────────

/** Additional images found in asset directories */
export const MISC_IMAGES = {
  pacMaze: { name: 'Pac-Maze', path: 'assets/images/misc/Pac-Maze.webp' }
};

export const SFX = {
  wakka: { name: 'Wakka (Dot Eat)', path: 'assets/audio/sfx/wakka.wav' },
  beginning: { name: 'Level Start', path: 'assets/audio/sfx/pacman_beginning.wav' },
  death: { name: 'Death', path: 'assets/audio/sfx/pacman_death.wav' },
  extraPac: { name: 'Extra Pac (Win)', path: 'assets/audio/sfx/pacman_extrapac.wav' },
  intermission: { name: 'Intermission (Pause)', path: 'assets/audio/sfx/pacman_intermission.wav' },
  ghostSfx: { name: 'Ghost Sound', path: 'assets/audio/sfx/GHOST .mp3' },
  intro: { name: 'Intro', path: 'assets/audio/sfx/intro.wav' },
  pacGhost: { name: 'Pac-Man Ghost', path: 'assets/audio/sfx/PAC MAN GHOST.mp3' },
  powerPellet: { name: 'Power Pellet', path: 'assets/audio/sfx/pac-man-power-pellet.mp3' }
};

// ─── Background Music ───────────────────────────────────────────────────────

export const MUSIC_TRACKS = [
  { id: 'arcade', name: 'Arcade', path: 'assets/audio/music/Arcade.mp3' },
  { id: 'elevator', name: 'Elevator Music', path: 'assets/audio/music/Elevator Music.mp3' },
  { id: 'fadingExit', name: 'Fading Exit', path: 'assets/audio/music/Fading Exit.mp3' },
  { id: 'insertCoin', name: 'Insert Coin', path: 'assets/audio/music/Insert Coin.mp3' },
  { id: 'pixelheart', name: 'Pixelheart', path: 'assets/audio/music/Pixelheart.mp3' },
  { id: 'stepUp1', name: 'Step Up V1', path: 'assets/audio/music/STEP UP BY JUSTIN TIME V1.mp3' },
  { id: 'stepUp2', name: 'Step Up (1)', path: 'assets/audio/music/STEP UP BY JUSTIN TIME 1.mp3' },
  { id: 'vividVictory', name: 'Vivid Victory', path: 'assets/audio/music/Vivid Victory.mp3' },
  { id: 'volt', name: 'Volt', path: 'assets/audio/music/Volt.mp3' }
];

/**
 * Get all music track paths (for backward compatibility).
 */
export function getMusicPlaylist() {
  return MUSIC_TRACKS.map(t => t.path);
}

// ─── User Preference Storage ────────────────────────────────────────────────

const STORAGE_KEY = 'pacman-asset-preferences';

const DEFAULT_PREFERENCES = {
  pacmanModel: 'classic',
  ghostModel: 'classic',
  font: 'pacfontZEBZ',
  ghostImage: 'kinky',
  pacmanImage: 'pacmanGif',
  style: 'new',
  splashImage: 'loadingBack',
  musicEnabled: true,
  sfxEnabled: true
};

/**
 * Load saved asset preferences from localStorage.
 */
export function loadPreferences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (e) {
    console.warn('Could not load asset preferences', e);
  }
  return { ...DEFAULT_PREFERENCES };
}

/**
 * Save asset preferences to localStorage.
 */
export function savePreferences(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Could not save asset preferences', e);
  }
}

/**
 * Load all fonts into the document via @font-face injection.
 * Call once at startup.
 */
export function loadFonts() {
  const style = document.createElement('style');
  let css = '';
  for (const [key, font] of Object.entries(FONTS)) {
    css += `
@font-face {
  font-family: '${font.family}';
  src: url('${font.path}') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`;
  }
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Preload an image and return a promise that resolves with an Image element.
 */
export function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// ─── 3D Model Loading ───────────────────────────────────────────────────────

/**
 * Sketchfab models export .gltf files that reference "scene.bin" inside,
 * but the actual binary files have different names (e.g. inky.bin, robo.bin).
 * This loader fetches the .gltf, patches the buffer URI to match the real filename,
 * then parses it with the GLTFLoader.
 *
 * @param {string} gltfPath - Path to the .gltf file (without extension)
 * @param {GLTFLoader} loader - A THREE.js GLTFLoader instance
 * @param {function} onLoad - Callback with the loaded GLTF result
 * @param {function} onProgress - Optional progress callback
 * @param {function} onError - Optional error callback
 */
export function loadSketchfabModel(gltfPath, loader, onLoad, onProgress, onError) {
  const fullPath = gltfPath + '.gltf';
  const binPath = gltfPath + '.bin';

  // Extract directory for setting the loader's base path (needed for texture resolution)
  const normalized = gltfPath.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  const directory = lastSlash >= 0 ? normalized.substring(0, lastSlash + 1) : '';
  
  // Extract just the filename for the bin
  const binFilename = binPath.replace(/\\/g, '/').split('/').pop();

  // Save and restore previous loader path to avoid race conditions between concurrent model loads
  const previousPath = loader._currentPath || loader.path || '';

  // Helper to set loader path for this model
  function setModelPath() {
    if (directory) {
      loader.setPath(directory);
    } else {
      loader.setPath('');
    }
  }

  // Fetch the gltf text
  fetch(fullPath)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status} loading ${fullPath}`);
      return res.text();
    })
    .then(gltfText => {
      // Parse JSON to check/modify buffer URIs
      const gltfJson = JSON.parse(gltfText);
      let needsPatch = false;

      if (gltfJson.buffers) {
        for (const buf of gltfJson.buffers) {
          if (buf.uri && buf.uri !== binFilename && buf.uri.endsWith('.bin')) {
            console.log(`Patching buffer URI from "${buf.uri}" to "${binFilename}"`);
            buf.uri = binFilename;
            needsPatch = true;
          }
        }
      }

      // Set the base path so textures resolve relative to the original GLTF directory
      setModelPath();

      if (needsPatch) {
        // Serialize modified JSON to a blob and load from it
        const blob = new Blob([JSON.stringify(gltfJson)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        loader.load(url, function(gltf) {
          // Revoke blob URL after a microtask to let THREE.js finish reading
          setTimeout(function() { URL.revokeObjectURL(url); }, 100);
          loader.setPath(previousPath);
          onLoad(gltf);
        }, onProgress, function(err) {
          setTimeout(function() { URL.revokeObjectURL(url); }, 100);
          loader.setPath(previousPath);
          // Fallback: try direct load with the patched approach via re-fetch
          console.warn('Blob load failed, trying direct load with same path:', err);
          setModelPath();
          loader.load(fullPath, function(gltf) {
            loader.setPath(previousPath);
            onLoad(gltf);
          }, onProgress, function(err2) {
            loader.setPath(previousPath);
            if (onError) onError(err2);
          });
        });
      } else {
        // No patch needed, load directly
        loader.load(fullPath, function(gltf) {
          loader.setPath(previousPath);
          onLoad(gltf);
        }, onProgress, function(err) {
          loader.setPath(previousPath);
          if (onError) onError(err);
        });
      }
    })
    .catch(function(err) {
      console.warn('Fetch-based model loading failed, trying direct load:', err);
      setModelPath();
      loader.load(fullPath, function(gltf) {
        loader.setPath(previousPath);
        onLoad(gltf);
      }, onProgress, function(err2) {
        loader.setPath(previousPath);
        if (onError) onError(err2);
      });
    });
}
