/**
 * Asset Selector - UI overlay for choosing player models and visual assets
 * -------------------------------------------------------------------------
 * Renders a full-screen main menu where users pick:
 *   - Pacman model (classic, girl, pixel, rockin, yellow, robo, pinky)
 *   - Ghost model (classic, inky, blue ghost, pinky ghost)
 *   - Font family
 *   - Start Game button
 *
 * Import as: import * as AssetSelector from './asset-selector.js'
 * Usage:     AssetSelector.showAssetSelector((prefs) => { ... start game ... })
 */

import * as Assets from './asset-manager.js';

let selectorActive = false;
let mainMenuShown = false;

// Which section (tab) is currently visible
let activeSection = 'pacman';

/** Color gradients for each pacman model card */
const PACMAN_CARD_STYLES = {
  classic:  { gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', emoji: '🟡', bg: '#2a2000' },
  yellow:   { gradient: 'linear-gradient(135deg, #FFE135 0%, #FFC107 100%)', emoji: '🟡', bg: '#2a2500' },
  robo:     { gradient: 'linear-gradient(135deg, #78909c 0%, #455a64 100%)', emoji: '🤖', bg: '#1a2025' },
  girl:     { gradient: 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)', emoji: '💃', bg: '#2a1020' },
  pixel:    { gradient: 'linear-gradient(135deg, #00E676 0%, #00C853 100%)', emoji: '👾', bg: '#0a2a15' },
  rockin:   { gradient: 'linear-gradient(135deg, #E040FB 0%, #7B1FA2 100%)', emoji: '🎸', bg: '#200a2a' },
  pinkyPac: { gradient: 'linear-gradient(135deg, #FF80AB 0%, #F50057 100%)', emoji: '💗', bg: '#2a0a15' },
  inkyPac:  { gradient: 'linear-gradient(135deg, #40C4FF 0%, #0091EA 100%)', emoji: '💙', bg: '#0a1a2a' },
  bluePac:  { gradient: 'linear-gradient(135deg, #448AFF 0%, #2962FF 100%)', emoji: '🔵', bg: '#0a1530' },
  candyPac: { gradient: 'linear-gradient(135deg, #FF6E40 0%, #FF3D00 100%)', emoji: '🍬', bg: '#2a150a' },
  pacManExtract: { gradient: 'linear-gradient(135deg, #FFD740 0%, #FF6F00 100%)', emoji: '🎮', bg: '#2a1a00' },
  robotPac: { gradient: 'linear-gradient(135deg, #B0BEC5 0%, #546E7A 100%)', emoji: '🦾', bg: '#151a1e' },
  pinkyExtract: { gradient: 'linear-gradient(135deg, #F48FB1 0%, #EC407A 100%)', emoji: '🩷', bg: '#2a1020' },
};

/** Color gradients for each ghost model card */
const GHOST_CARD_STYLES = {
  classic:  { gradient: 'linear-gradient(135deg, #FF1744 0%, #D50000 100%)', emoji: '👻', bg: '#2a0a0a' },
  inky:     { gradient: 'linear-gradient(135deg, #00E5FF 0%, #00B8D4 100%)', emoji: '👻', bg: '#0a2025' },
  blueGhost:{ gradient: 'linear-gradient(135deg, #448AFF 0%, #2962FF 100%)', emoji: '👻', bg: '#0a1530' },
  pinky:    { gradient: 'linear-gradient(135deg, #FF80AB 0%, #FF4081 100%)', emoji: '👻', bg: '#2a0a18' },
  candy:    { gradient: 'linear-gradient(135deg, #FFD740 0%, #FF6D00 100%)', emoji: '🍬', bg: '#2a1a00' },
};

/**
 * Inject the stylesheet for the asset selector.
 * Only injects once per page load.
 */
function injectStyles() {
  if (document.getElementById('asset-selector-styles')) return;
  const style = document.createElement('style');
  style.id = 'asset-selector-styles';
  style.textContent = `
    /* ── Overlay ──────────────────────────────────────── */
    .asset-selector-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: radial-gradient(ellipse at 50% 20%, #0d1b2a 0%, #000 70%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-y: auto;
      font-family: 'Press Start 2P', 'VT323', monospace;
      animation: assetFadeIn 0.4s ease;
    }
    .asset-selector-overlay.fading-out {
      opacity: 0;
      transition: opacity 0.4s ease;
    }
    @keyframes assetFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* ── Container ────────────────────────────────────── */
    .asset-selector-container {
      width: min(95vw, 700px);
      max-height: 92vh;
      overflow-y: auto;
      background: linear-gradient(180deg, #0d1b2a 0%, #0a0e1a 100%);
      border: 2px solid #1b2838;
      border-radius: 16px;
      padding: min(24px, 3vw) min(20px, 2.5vw);
      box-shadow: 0 0 60px rgba(0, 100, 255, 0.15), 0 4px 30px rgba(0,0,0,0.8);
      color: #e0e0e0;
    }
    .asset-selector-container::-webkit-scrollbar {
      width: 6px;
    }
    .asset-selector-container::-webkit-scrollbar-thumb {
      background: #1b2838;
      border-radius: 3px;
    }

    /* ── Header ───────────────────────────────────────── */
    .asset-selector-header {
      text-align: center;
      margin-bottom: min(20px, 2.5vh);
    }
    .asset-selector-title {
      font-size: clamp(24px, 6vw, 48px);
      color: #FFD700;
      text-shadow: 0 0 20px rgba(255, 215, 0, 0.4), 2px 2px 0 #000;
      margin: 0;
      letter-spacing: 4px;
    }
    .asset-selector-subtitle {
      font-size: clamp(10px, 2vw, 16px);
      color: #8899aa;
      margin: 6px 0 0 0;
      letter-spacing: 2px;
    }

    /* ── Tabs ──────────────────────────────────────────── */
    .asset-selector-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: min(16px, 2vh);
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .asset-tab {
      flex: 1;
      min-width: 0;
      padding: min(10px, 1.5vh) min(8px, 1vw);
      border: 2px solid #1b2838;
      border-radius: 8px;
      background: #0d1b2a;
      color: #8899aa;
      font-family: inherit;
      font-size: clamp(8px, 1.5vw, 13px);
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
      white-space: nowrap;
    }
    .asset-tab:hover {
      background: #162a40;
      color: #b0c0d0;
      border-color: #2a4a6a;
    }
    .asset-tab.active {
      background: linear-gradient(135deg, #1a3a5c 0%, #0d2040 100%);
      color: #FFD700;
      border-color: #FFD700;
      box-shadow: 0 0 12px rgba(255, 215, 0, 0.2);
    }

    /* ── Sections ──────────────────────────────────────── */
    .asset-section {
      margin-bottom: min(16px, 2vh);
    }
    .section-title {
      font-size: clamp(12px, 2.5vw, 18px);
      color: #FFD700;
      margin: 0 0 min(10px, 1.5vh) 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #1b2838;
      letter-spacing: 1px;
    }

    /* ── Asset Grid ───────────────────────────────────── */
    .asset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(140px, 40vw), 1fr));
      gap: min(10px, 1.5vw);
    }
    .asset-grid-small {
      grid-template-columns: repeat(auto-fill, minmax(min(100px, 28vw), 1fr));
    }

    /* ── Asset Card ────────────────────────────────────── */
    .asset-card {
      position: relative;
      background: #0d1b2a;
      border: 2px solid #1b2838;
      border-radius: 12px;
      padding: min(14px, 2vw) min(10px, 1.5vw);
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .asset-card:hover {
      border-color: #3a6a9a;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 100, 255, 0.15);
    }
    .asset-card.selected {
      border-color: #FFD700;
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.05);
      background: linear-gradient(180deg, rgba(255, 215, 0, 0.08) 0%, #0d1b2a 100%);
    }

    /* Card icon (gradient circle with emoji) */
    .asset-card-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin-bottom: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      transition: transform 0.2s ease;
    }
    .asset-card:hover .asset-card-icon {
      transform: scale(1.1);
    }

    .asset-card-name {
      font-size: clamp(9px, 1.8vw, 13px);
      color: #e0e0e0;
      font-weight: bold;
      line-height: 1.3;
    }
    .asset-card-desc {
      font-size: clamp(7px, 1.3vw, 10px);
      color: #6a7a8a;
      line-height: 1.3;
    }

    /* 3D badge */
    .asset-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      background: linear-gradient(135deg, #00E676, #00C853);
      color: #000;
      font-size: 8px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 1px;
    }

    /* Checkmark on selected card */
    .asset-check {
      position: absolute;
      bottom: 6px;
      right: 6px;
      width: 22px;
      height: 22px;
      background: #FFD700;
      color: #000;
      border-radius: 50%;
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4);
    }
    .asset-card.selected .asset-check {
      display: flex;
    }

    /* ── Image Card (for HUD images & splash images) ──── */
    .asset-card-image {
      padding: 8px;
    }
    .asset-thumb {
      width: 100%;
      height: 60px;
      object-fit: contain;
      border-radius: 6px;
      image-rendering: pixelated;
      background: rgba(0,0,0,0.3);
      padding: 4px;
    }

    /* ── Font Preview ──────────────────────────────────── */
    .font-preview-box {
      background: #0a0e1a;
      border: 2px solid #1b2838;
      border-radius: 12px;
      padding: min(16px, 2vw);
      margin-top: min(12px, 1.5vh);
    }
    .font-preview {
      color: #FFD700;
      font-size: clamp(14px, 3vw, 22px);
      line-height: 1.6;
      margin: 0;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    }

    /* ── Audio Section ─────────────────────────────────── */
    .audio-settings {
      display: flex;
      flex-direction: column;
      gap: min(12px, 1.5vh);
    }
    .audio-toggle {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 10px 14px;
      background: #0d1b2a;
      border: 1px solid #1b2838;
      border-radius: 8px;
      transition: border-color 0.2s;
    }
    .audio-toggle:hover {
      border-color: #3a6a9a;
    }
    .audio-toggle input[type="checkbox"] {
      width: 20px;
      height: 20px;
      accent-color: #FFD700;
      cursor: pointer;
    }
    .toggle-label {
      color: #e0e0e0;
      font-size: clamp(10px, 2vw, 14px);
    }
    .audio-note {
      color: #6a7a8a;
      font-size: clamp(8px, 1.5vw, 12px);
      margin: 8px 0 0 0;
    }

    /* ── Style Toggle ──────────────────────────────────── */
    .style-toggle-group {
      display: flex;
      gap: min(12px, 1.5vw);
    }
    .style-btn {
      flex: 1;
      background: #0d1b2a;
      border: 2px solid #1b2838;
      border-radius: 12px;
      padding: min(16px, 2vw) min(12px, 1.5vw);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: #8899aa;
    }
    .style-btn:hover {
      border-color: #3a6a9a;
      background: #121e30;
    }
    .style-btn.active {
      border-color: #FFD700;
      background: linear-gradient(180deg, rgba(255, 215, 0, 0.08) 0%, #0d1b2a 100%);
      color: #FFD700;
      box-shadow: 0 0 16px rgba(255, 215, 0, 0.2);
    }
    .style-btn-icon {
      font-size: clamp(24px, 5vw, 36px);
    }
    .style-btn-label {
      font-size: clamp(11px, 2vw, 15px);
      font-weight: bold;
      color: inherit;
    }
    .style-btn-desc {
      font-size: clamp(7px, 1.3vw, 10px);
      color: #6a7a8a;
      text-align: center;
    }

    /* ── Start Button ──────────────────────────────────── */
    .asset-start-btn {
      display: block;
      width: 100%;
      margin-top: min(20px, 3vh);
      padding: min(16px, 2.5vh) min(24px, 3vw);
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
      color: #000;
      border: none;
      border-radius: 12px;
      font-family: inherit;
      font-size: clamp(16px, 3.5vw, 24px);
      font-weight: bold;
      cursor: pointer;
      letter-spacing: 3px;
      text-shadow: 0 1px 0 rgba(255,255,255,0.3);
      box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
      transition: all 0.2s ease;
    }
    .asset-start-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 30px rgba(255, 215, 0, 0.5);
      filter: brightness(1.1);
    }
    .asset-start-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Build and show the full asset selection overlay.
 * Calls `onStart(preferences)` when the user clicks Start Game.
 */
export function showAssetSelector(onStart) {
  if (selectorActive) return;
  selectorActive = true;
  mainMenuShown = true;

  // Inject CSS styles
  injectStyles();

  const prefs = Assets.loadPreferences();

  const overlay = document.createElement('div');
  overlay.id = 'asset-selector-overlay';
  overlay.className = 'asset-selector-overlay';
  overlay.innerHTML = `
    <div class="asset-selector-container">
      <div class="asset-selector-header">
        <h1 class="asset-selector-title">PAC-MAN 3D</h1>
        <p class="asset-selector-subtitle">Choose Your Assets</p>
      </div>

      <!-- Tab Navigation -->
      <div class="asset-selector-tabs">
        <button class="asset-tab active" data-section="pacman">Pac-Man</button>
        <button class="asset-tab" data-section="ghost">Ghost</button>
        <button class="asset-tab" data-section="font">Font</button>
        <button class="asset-tab" data-section="audio">Audio</button>
        <button class="asset-tab" data-section="style">Style</button>
      </div>

      <!-- Pac-Man Model Section -->
      <div class="asset-section" data-section="pacman">
        <h2 class="section-title">Pac-Man Model</h2>
        <div class="asset-grid" id="pacman-grid"></div>

        <h2 class="section-title" style="margin-top:min(16px,2vh);">Pac-Man Image (HUD)</h2>
        <div class="asset-grid asset-grid-small" id="pacman-image-grid"></div>
      </div>

      <!-- Ghost Model Section -->
      <div class="asset-section" data-section="ghost" style="display:none;">
        <h2 class="section-title">Ghost Model</h2>
        <div class="asset-grid" id="ghost-grid"></div>

        <h2 class="section-title" style="margin-top:min(16px,2vh);">Ghost Image (HUD)</h2>
        <div class="asset-grid asset-grid-small" id="ghost-image-grid"></div>
      </div>

      <!-- Font Section -->
      <div class="asset-section" data-section="font" style="display:none;">
        <h2 class="section-title">Game Font</h2>
        <div class="asset-grid" id="font-grid"></div>
        <div class="font-preview-box">
          <p id="font-preview-text" class="font-preview">
            0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>
            SCORE: 10000  HIGH: 99999<br/>
            GAME OVER
          </p>
        </div>
      </div>

      <!-- Audio Section -->
      <div class="asset-section" data-section="audio" style="display:none;">
        <h2 class="section-title">Audio Settings</h2>
        <div class="audio-settings">
          <label class="audio-toggle">
            <input type="checkbox" id="music-toggle" ${prefs.musicEnabled ? 'checked' : ''} />
            <span class="toggle-label">Background Music</span>
          </label>
          <label class="audio-toggle">
            <input type="checkbox" id="sfx-toggle" ${prefs.sfxEnabled ? 'checked' : ''} />
            <span class="toggle-label">Sound Effects</span>
          </label>
          <p class="audio-note">Music tracks: ${Assets.MUSIC_TRACKS.length} available</p>
        </div>
      </div>

      <!-- Style Section -->
      <div class="asset-section" data-section="style" style="display:none;">
        <h2 class="section-title">Visual Style</h2>
        <div class="style-toggle-group">
          <button class="style-btn ${prefs.style === 'legacy' ? 'active' : ''}" data-style="legacy">
            <span class="style-btn-icon">🟡</span>
            <span class="style-btn-label">Legacy</span>
            <span class="style-btn-desc">Classic sphere models, retro look</span>
          </button>
          <button class="style-btn ${prefs.style === 'new' ? 'active' : ''}" data-style="new">
            <span class="style-btn-icon">🚀</span>
            <span class="style-btn-label">New</span>
            <span class="style-btn-desc">3D models, modern visuals</span>
          </button>
        </div>

        <h2 class="section-title" style="margin-top:min(20px,3vh);">Splash Screen Image</h2>
        <p style="color:#6a7a8a;font-size:clamp(9px,1.8vw,13px);margin:0 0 min(12px,1.5vh) 0;">Background image shown on the intro splash</p>
        <div class="asset-grid asset-grid-small" id="splash-image-grid"></div>
      </div>

      <!-- Start Button -->
      <button id="asset-start-btn" class="asset-start-btn">▶ START GAME</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Play intro sound when the menu appears
  try {
    const introAudio = new Audio(Assets.SFX.intro.path);
    introAudio.volume = 0.5;
    introAudio.play().catch(() => {});
  } catch (e) {
    // Audio not available, skip
  }

  // ── Populate asset grids ──

  // Pac-Man models
  const pacmanGrid = document.getElementById('pacman-grid');
  for (const [id, model] of Object.entries(Assets.PACMAN_MODELS)) {
    const card = createModelCard(id, model, 'pacman', prefs.pacmanModel);
    pacmanGrid.appendChild(card);
  }

  // Ghost models
  const ghostGrid = document.getElementById('ghost-grid');
  for (const [id, model] of Object.entries(Assets.GHOST_MODELS)) {
    const card = createModelCard(id, model, 'ghost', prefs.ghostModel);
    ghostGrid.appendChild(card);
  }

  // Pac-Man images
  const pacImageGrid = document.getElementById('pacman-image-grid');
  for (const [id, img] of Object.entries(Assets.PACMAN_IMAGES)) {
    const card = createImageCard(id, img, 'pacmanImage', prefs.pacmanImage);
    pacImageGrid.appendChild(card);
  }

  // Ghost images
  const ghostImageGrid = document.getElementById('ghost-image-grid');
  for (const [id, img] of Object.entries(Assets.GHOST_IMAGES)) {
    const card = createImageCard(id, img, 'ghostImage', prefs.ghostImage);
    ghostImageGrid.appendChild(card);
  }

  // Fonts
  const fontGrid = document.getElementById('font-grid');
  for (const [id, font] of Object.entries(Assets.FONTS)) {
    const card = createFontCard(id, font, prefs.font);
    fontGrid.appendChild(card);
  }

  // Splash images
  const splashGrid = document.getElementById('splash-image-grid');
  if (splashGrid) {
    for (const [id, img] of Object.entries(Assets.SPLASH_IMAGES || Assets.INTRO_IMAGES)) {
      const card = createImageCard(id, img, 'splashImage', prefs.splashImage);
      splashGrid.appendChild(card);
    }
  }

  // Update font preview
  updateFontPreview(prefs.font);

  // ── Events ──

  // Tab switching
  overlay.querySelectorAll('.asset-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      overlay.querySelectorAll('.asset-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const section = tab.dataset.section;
      overlay.querySelectorAll('.asset-section').forEach(s => s.style.display = 'none');
      const target = overlay.querySelector(`.asset-section[data-section="${section}"]`);
      if (target) target.style.display = 'block';
      activeSection = section;
    });
  });

  // Style toggle
  overlay.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      prefsRef.style = btn.dataset.style;
    });
  });

  // Start button
  const startBtn = document.getElementById('asset-start-btn');
  startBtn.addEventListener('click', () => {
    const finalPrefs = collectPreferences();
    Assets.savePreferences(finalPrefs);
    closeSelector();
    onStart(finalPrefs);
  });
}

function closeSelector() {
  const overlay = document.getElementById('asset-selector-overlay');
  if (overlay) {
    overlay.classList.add('fading-out');
    setTimeout(() => {
      overlay.remove();
      selectorActive = false;
    }, 400);
  }
}

/**
 * Create a model card with color-coded gradient icon and thumbnail.
 */
function createModelCard(id, model, type, selectedId) {
  const div = document.createElement('div');
  div.className = `asset-card ${id === selectedId ? 'selected' : ''}`;
  div.dataset.id = id;
  div.dataset.type = type;

  const styleMap = type === 'pacman' ? PACMAN_CARD_STYLES : GHOST_CARD_STYLES;
  const cardStyle = styleMap[id] || { gradient: 'linear-gradient(135deg, #555 0%, #333 100%)', emoji: type === 'pacman' ? '🟡' : '👻', bg: '#1a1a1a' };
  const badge = model.type === 'builtin' ? '' : '<span class="asset-badge">3D</span>';

  // Set card background tint
  div.style.background = cardStyle.bg;

  div.innerHTML = `
    <div class="asset-card-icon" style="background:${cardStyle.gradient};">${cardStyle.emoji}</div>
    <div class="asset-card-name">${model.name}</div>
    <div class="asset-card-desc">${model.description}</div>
    ${badge}
    <div class="asset-check">✓</div>
  `;

  // If model has a GLTF path, try to load a small 3D preview thumbnail
  if (model.path && model.type === 'gltf') {
    const iconEl = div.querySelector('.asset-card-icon');
    loadModelThumbnail(model.path, iconEl, cardStyle);
  }

  div.addEventListener('click', () => {
    const grid = div.closest('.asset-grid');
    grid.querySelectorAll('.asset-card').forEach(c => c.classList.remove('selected'));
    div.classList.add('selected');
    prefsRef[type === 'pacman' ? 'pacmanModel' : 'ghostModel'] = id;
  });

  return div;
}

/**
 * Attempt to load a model's thumbnail image.
 * Tries common thumbnail patterns, falls back to the styled emoji icon.
 */
function loadModelThumbnail(modelPath, iconEl, cardStyle) {
  // Try to find a preview image near the model
  const basePath = modelPath.replace(/\\/g, '/');
  const thumbnailPaths = [
    basePath + '.png',
    basePath + '.jpg',
    basePath.replace(/\/scene$/, '/preview.png'),
    basePath.replace(/\/scene$/, '/screenshot.png'),
  ];

  // Also try the GLTF directory for any image files
  const lastSlash = basePath.lastIndexOf('/');
  if (lastSlash >= 0) {
    const dir = basePath.substring(0, lastSlash + 1);
    thumbnailPaths.push(dir + 'preview.png', dir + 'screenshot.png', dir + 'thumb.png');
  }

  let loaded = false;
  for (const src of thumbnailPaths) {
    const img = new Image();
    img.onload = () => {
      if (loaded) return;
      loaded = true;
      // Replace emoji with actual thumbnail
      iconEl.textContent = '';
      iconEl.style.background = `url("${src}") center/cover no-repeat, ${cardStyle.gradient}`;
      iconEl.style.backgroundSize = 'cover';
    };
    img.onerror = () => {}; // Silently ignore missing thumbnails
    img.src = src;
  }
}

// Mutable prefs reference for live updates
const prefsRef = Assets.loadPreferences();

/**
 * Create an image card with actual image thumbnail.
 */
function createImageCard(id, img, type, selectedId) {
  const div = document.createElement('div');
  div.className = `asset-card asset-card-image ${id === selectedId ? 'selected' : ''}`;
  div.dataset.id = id;
  div.dataset.type = type;

  div.innerHTML = `
    <img src="${img.path}" alt="${img.name}" class="asset-thumb" onerror="this.style.display='none'" />
    <div class="asset-card-name">${img.name}</div>
    <div class="asset-check">✓</div>
  `;

  div.addEventListener('click', () => {
    const grid = div.closest('.asset-grid');
    grid.querySelectorAll('.asset-card').forEach(c => c.classList.remove('selected'));
    div.classList.add('selected');
    prefsRef[type] = id;
  });

  return div;
}

/**
 * Create a font card with the font name rendered in its own font.
 */
function createFontCard(id, font, selectedId) {
  const div = document.createElement('div');
  div.className = `asset-card ${id === selectedId ? 'selected' : ''}`;
  div.dataset.id = id;

  div.innerHTML = `
    <div class="asset-card-name" style="font-family:'${font.family}',monospace;font-size:clamp(14px,2.5vw,20px);color:#FFD700;">${font.name}</div>
    <div class="asset-card-desc">${font.description}</div>
    <div class="asset-card-sample" style="font-family:'${font.family}',monospace;font-size:clamp(10px,1.8vw,14px);color:#b0c0d0;margin-top:4px;">Aa Bb 123</div>
    <div class="asset-check">✓</div>
  `;

  div.addEventListener('click', () => {
    const grid = div.closest('.asset-grid');
    grid.querySelectorAll('.asset-card').forEach(c => c.classList.remove('selected'));
    div.classList.add('selected');
    prefsRef.font = id;
    updateFontPreview(id);
  });

  return div;
}

function updateFontPreview(fontId) {
  const font = Assets.FONTS[fontId];
  if (!font) return;
  const preview = document.getElementById('font-preview-text');
  if (preview) {
    preview.style.fontFamily = `'${font.family}', monospace`;
  }
}

function collectPreferences() {
  const musicToggle = document.getElementById('music-toggle');
  const sfxToggle = document.getElementById('sfx-toggle');
  return {
    ...prefsRef,
    musicEnabled: musicToggle ? musicToggle.checked : true,
    sfxEnabled: sfxToggle ? sfxToggle.checked : true
  };
}

/**
 * Check if the selector is currently active.
 */
export function isSelectorActive() {
  return selectorActive;
}

/**
 * Returns whether the main menu was shown this session.
 */
export function wasMainMenuShown() {
  return mainMenuShown;
}
