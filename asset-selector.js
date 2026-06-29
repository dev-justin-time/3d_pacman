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

/**
 * Build and show the full asset selection overlay.
 * Calls `onStart(preferences)` when the user clicks Start Game.
 */
export function showAssetSelector(onStart) {
  if (selectorActive) return;
  selectorActive = true;
  mainMenuShown = true;

  const prefs = Assets.loadPreferences();

  const overlay = document.createElement('div');
  overlay.id = 'asset-selector-overlay';
  overlay.className = 'asset-selector-overlay';    overlay.innerHTML = `
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
        <p style="color:#888;font-size:min(0.85em,2.5vw);margin:0 0 min(12px,1.5vh) 0;">Background image shown on the intro splash</p>
        <div class="asset-grid asset-grid-small" id="splash-image-grid"></div>
      </div>`;

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

function createModelCard(id, model, type, selectedId) {
  const div = document.createElement('div');
  div.className = `asset-card ${id === selectedId ? 'selected' : ''}`;
  div.dataset.id = id;
  div.dataset.type = type;

  const icon = type === 'pacman' ? '🟡' : '👻';
  const badge = model.type === 'builtin' ? '' : '<span class="asset-badge">3D</span>';

  div.innerHTML = `
    <div class="asset-card-icon">${icon}</div>
    <div class="asset-card-name">${model.name}</div>
    <div class="asset-card-desc">${model.description}</div>
    ${badge}
    <div class="asset-check">✓</div>
  `;

  div.addEventListener('click', () => {
    const grid = div.closest('.asset-grid');
    grid.querySelectorAll('.asset-card').forEach(c => c.classList.remove('selected'));
    div.classList.add('selected');
    prefsRef[type === 'pacman' ? 'pacmanModel' : 'ghostModel'] = id;
  });

  return div;
}

// Mutable prefs reference for live updates
const prefsRef = Assets.loadPreferences();

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

function createFontCard(id, font, selectedId) {
  const div = document.createElement('div');
  div.className = `asset-card ${id === selectedId ? 'selected' : ''}`;
  div.dataset.id = id;

  div.innerHTML = `
    <div class="asset-card-name" style="font-family:'${font.family}',monospace;font-size:1.2em;">${font.name}</div>
    <div class="asset-card-desc">${font.description}</div>
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
