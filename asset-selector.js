/**
 * Asset Selector - UI overlay for choosing player models and visual assets
 * -------------------------------------------------------------------------
 * Renders a full-screen main menu where users pick:
 *   - Pacman model, Ghost model, Font family, Audio settings, Visual style
 *
 * Import as: import * as AssetSelector from './asset-selector.js'
 * Usage:     AssetSelector.showAssetSelector((prefs) => { ... start game ... })
 */

import * as Assets from './asset-manager.js';

let selectorActive = false;
let mainMenuShown = false;
let activeSection = 'pacman';

// ── Reduced Motion Detection ────────────────────────────────────────────
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Card Style Maps ─────────────────────────────────────────────────────

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

const GHOST_CARD_STYLES = {
  classic:  { gradient: 'linear-gradient(135deg, #FF1744 0%, #D50000 100%)', emoji: '👻', bg: '#2a0a0a' },
  inky:     { gradient: 'linear-gradient(135deg, #00E5FF 0%, #00B8D4 100%)', emoji: '👻', bg: '#0a2025' },
  blueGhost:{ gradient: 'linear-gradient(135deg, #448AFF 0%, #2962FF 100%)', emoji: '👻', bg: '#0a1530' },
  pinky:    { gradient: 'linear-gradient(135deg, #FF80AB 0%, #FF4081 100%)', emoji: '👻', bg: '#2a0a18' },
  candy:    { gradient: 'linear-gradient(135deg, #FFD740 0%, #FF6D00 100%)', emoji: '🍬', bg: '#2a1a00' },
};

const PACMAN_GROUPS = [
  { id: 'builtin', label: 'Classic / Built-in', ids: ['classic'] },
  { id: 'official', label: '3D Models', ids: ['yellow', 'robo', 'girl', 'pixel', 'rockin', 'pacManExtract', 'robotPac'] },
  { id: 'crossover', label: 'Crossover Characters', ids: ['pinkyPac', 'inkyPac', 'bluePac', 'candyPac', 'pinkyExtract'] },
];
const GHOST_GROUPS = [
  { id: 'builtin', label: 'Classic / Built-in', ids: ['classic'] },
  { id: 'official', label: '3D Ghost Models', ids: ['inky', 'blueGhost', 'pinky', 'candy'] },
];

// ── Particle System ─────────────────────────────────────────────────────

function spawnParticles(card) {
  if (prefersReducedMotion) return;
  const rect = card.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'sparkle-particle';
    const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.5;
    const dist = 30 + Math.random() * 40;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const size = 4 + Math.random() * 6;
    p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:radial-gradient(circle,#FFD700,#FFA500);border-radius:50%;pointer-events:none;z-index:10000;box-shadow:0 0 ${size}px rgba(255,215,0,0.8);animation:sparkle-fly 0.6s ease-out forwards;--dx:${dx}px;--dy:${dy}px;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

// ── Animated Background ─────────────────────────────────────────────────

function createFloatingPellets(overlay) {
  const canvas = document.createElement('canvas');
  canvas.className = 'floating-pellets-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  overlay.insertBefore(canvas, overlay.firstChild);
  const ctx = canvas.getContext('2d');
  let pellets = [];
  let animId = null;
  function resize() { canvas.width = overlay.offsetWidth; canvas.height = overlay.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < 25; i++) {
    pellets.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: 2 + Math.random() * 3, vx: (Math.random() - 0.5) * 0.4, vy: -0.2 - Math.random() * 0.3, alpha: 0.15 + Math.random() * 0.25, pulse: Math.random() * Math.PI * 2 });
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pellets) {
      p.x += p.vx; p.y += p.vy; p.pulse += 0.02;
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,215,0,${a})`; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,215,0,${a * 0.2})`; ctx.fill();
    }
    animId = requestAnimationFrame(animate);
  }
  animate();
  return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
}

// ── Keyboard Navigation ─────────────────────────────────────────────────

function setupKeyboardNav(overlay) {
  function getAllFocusable() {
    return [...overlay.querySelectorAll('.asset-tab, .toolbar-btn, .asset-card, .music-track-btn, .style-btn, .control-mode-btn, .asset-start-btn, input[type="checkbox"]')]
      .filter(el => el.offsetParent !== null);
  }
  overlay.addEventListener('keydown', (e) => {
    const focusable = getAllFocusable();
    const current = document.activeElement;
    const idx = focusable.indexOf(current);
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        e.preventDefault();
        const next = idx < focusable.length - 1 ? idx + 1 : 0;
        focusable[next]?.focus();
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        e.preventDefault();
        const prev = idx > 0 ? idx - 1 : focusable.length - 1;
        focusable[prev]?.focus();
        break;
      }
      case 'Enter':
      case ' ': {
        if (current && current !== document.body) { e.preventDefault(); current.click(); }
        break;
      }
      case 'Escape': { e.preventDefault(); closeSelector(); break; }
      case '1': case '2': case '3': case '4': case '5': {
        const tabs = overlay.querySelectorAll('.asset-tab');
        const tabIdx = parseInt(e.key) - 1;
        if (tabs[tabIdx]) { tabs[tabIdx].click(); tabs[tabIdx].focus(); }
        break;
      }
    }
  });
  overlay.querySelectorAll('.asset-card, .style-btn, .control-mode-btn').forEach(el => {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
  });
}

// ── Sound Preview ───────────────────────────────────────────────────────

let currentPreviewAudio = null;
let currentPreviewBtn = null;
function stopPreview() {
  if (currentPreviewAudio) { currentPreviewAudio.pause(); currentPreviewAudio.currentTime = 0; currentPreviewAudio = null; }
  if (currentPreviewBtn) { currentPreviewBtn.classList.remove('playing'); currentPreviewBtn.textContent = '▶'; currentPreviewBtn = null; }
}

function createTrackList() {
  const container = document.createElement('div');
  container.className = 'music-track-list';
  const label = document.createElement('div');
  label.className = 'section-title';
  label.style.marginTop = 'min(16px, 2vh)';
  label.textContent = 'Music Tracks (Preview)';
  container.appendChild(label);
  for (const track of Assets.MUSIC_TRACKS) {
    const row = document.createElement('div'); row.className = 'music-track';
    const name = document.createElement('span'); name.className = 'music-track-name'; name.textContent = track.name;
    const btn = document.createElement('button'); btn.className = 'music-track-btn'; btn.textContent = '▶';
    btn.addEventListener('click', () => {
      if (currentPreviewBtn === btn) { stopPreview(); return; }
      stopPreview();
      const audio = new Audio(); audio.preload = 'none'; audio.src = track.path; audio.volume = 0.5;
      audio.play().then(() => { audio.preload = 'auto'; }).catch(() => {});
      currentPreviewAudio = audio; currentPreviewBtn = btn;
      btn.classList.add('playing'); btn.textContent = '⏸';
      audio.onended = () => { btn.classList.remove('playing'); btn.textContent = '▶'; if (currentPreviewBtn === btn) { currentPreviewAudio = null; currentPreviewBtn = null; } };
    });
    row.appendChild(name); row.appendChild(btn); container.appendChild(row);
  }
  const sfxLabel = document.createElement('div'); sfxLabel.className = 'section-title'; sfxLabel.style.marginTop = 'min(16px, 2vh)'; sfxLabel.textContent = 'Sound Effects (Preview)';
  container.appendChild(sfxLabel);
  for (const [id, sfx] of Object.entries(Assets.SFX)) {
    const row = document.createElement('div'); row.className = 'music-track';
    const name = document.createElement('span'); name.className = 'music-track-name'; name.textContent = sfx.name;
    const btn = document.createElement('button'); btn.className = 'music-track-btn'; btn.textContent = '▶';
    btn.addEventListener('click', () => {
      stopPreview();
      const audio = new Audio(); audio.preload = 'none'; audio.src = sfx.path; audio.volume = 0.7;
      audio.play().then(() => { audio.preload = 'auto'; }).catch(() => {});
      currentPreviewAudio = audio; currentPreviewBtn = btn;
      btn.classList.add('playing'); btn.textContent = '⏸';
      audio.onended = () => { btn.classList.remove('playing'); btn.textContent = '▶'; if (currentPreviewBtn === btn) { currentPreviewAudio = null; currentPreviewBtn = null; } };
    });
    row.appendChild(name); row.appendChild(btn); container.appendChild(row);
  }
  return container;
}

// ── Drag to Reorder ─────────────────────────────────────────────────────

function enableDragReorder(grid) {
  let dragSrc = null;
  grid.querySelectorAll('.asset-card').forEach(card => {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', (e) => { dragSrc = card; card.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', card.dataset.id); });
    card.addEventListener('dragend', () => { card.classList.remove('dragging'); grid.querySelectorAll('.asset-card').forEach(c => c.classList.remove('drag-over')); dragSrc = null; });
    card.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; card.classList.add('drag-over'); });
    card.addEventListener('dragleave', () => { card.classList.remove('drag-over'); });
    card.addEventListener('drop', (e) => {
      e.preventDefault(); card.classList.remove('drag-over');
      if (dragSrc && dragSrc !== card) {
        const allCards = [...grid.querySelectorAll('.asset-card')];
        const fromIdx = allCards.indexOf(dragSrc);
        const toIdx = allCards.indexOf(card);
        if (fromIdx < toIdx) card.after(dragSrc); else card.before(dragSrc);
      }
    });
  });
}

// ── CSS Styles ──────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById('asset-selector-styles')) return;
  const style = document.createElement('style');
  style.id = 'asset-selector-styles';
  style.textContent = `
    @keyframes assetFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes sparkle-fly { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; } }
    @keyframes card-wobble { 0% { transform: perspective(600px) rotateY(0deg); } 25% { transform: perspective(600px) rotateY(6deg); } 75% { transform: perspective(600px) rotateY(-6deg); } 100% { transform: perspective(600px) rotateY(0deg); } }
    @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 4px rgba(255,215,0,0.3); } 50% { box-shadow: 0 0 12px rgba(255,215,0,0.6); } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; } .floating-pellets-canvas { display: none; } }

    .asset-selector-overlay { position: fixed; inset: 0; z-index: 9999; background: radial-gradient(ellipse at 50% 20%, #0d1b2a 0%, #000 70%); display: flex; align-items: center; justify-content: center; overflow-y: auto; font-family: 'Press Start 2P', 'VT323', monospace; animation: assetFadeIn 0.4s ease; }
    .asset-selector-overlay.fading-out { opacity: 0; transition: opacity 0.4s ease; }
    .asset-selector-container { position: relative; width: min(95vw, 700px); max-height: 92vh; overflow-y: auto; background: linear-gradient(180deg, #0d1b2a 0%, #0a0e1a 100%); border: 2px solid #1b2838; border-radius: 16px; padding: min(24px, 3vw) min(20px, 2.5vw); box-shadow: 0 0 60px rgba(0, 100, 255, 0.15), 0 4px 30px rgba(0,0,0,0.8); color: #e0e0e0; z-index: 1; }
    .asset-selector-container::-webkit-scrollbar { width: 6px; }
    .asset-selector-container::-webkit-scrollbar-thumb { background: #1b2838; border-radius: 3px; }
    .asset-selector-header { text-align: center; margin-bottom: min(20px, 2.5vh); }
    .asset-selector-title { font-size: clamp(24px, 6vw, 48px); color: #FFD700; text-shadow: 0 0 20px rgba(255, 215, 0, 0.4), 2px 2px 0 #000; margin: 0; letter-spacing: 4px; }
    .asset-selector-subtitle { font-size: clamp(10px, 2vw, 16px); color: #8899aa; margin: 6px 0 0 0; letter-spacing: 2px; }
    .asset-toolbar { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 8px; }
    .toolbar-btn { padding: 4px 10px; border: 1px solid #1b2838; border-radius: 6px; background: #0d1b2a; color: #8899aa; font-family: inherit; font-size: clamp(7px, 1.2vw, 10px); cursor: pointer; transition: all 0.2s; }
    .toolbar-btn:hover { border-color: #3a6a9a; color: #b0c0d0; }
    .toolbar-btn.active { border-color: #FFD700; color: #FFD700; }
    .toolbar-btn:focus { outline: none; border-color: #88aacc; box-shadow: 0 0 0 2px rgba(136, 170, 204, 0.4); }
    .asset-selector-tabs { position: sticky; top: 0; z-index: 99; display: flex; gap: 4px; margin-bottom: min(16px, 2vh); overflow-x: auto; padding: 8px 0; background: linear-gradient(180deg, #0d1b2a 0%, #0d1b2a 80%, transparent 100%); }
    .asset-tab { flex: 1; min-width: 0; padding: min(10px, 1.5vh) min(8px, 1vw); border: 2px solid #1b2838; border-radius: 8px; background: #0d1b2a; color: #8899aa; font-family: inherit; font-size: clamp(8px, 1.5vw, 13px); cursor: pointer; transition: all 0.2s ease; text-align: center; white-space: nowrap; }
    .asset-tab:hover { background: #162a40; color: #b0c0d0; border-color: #2a4a6a; }
    .asset-tab.active { background: linear-gradient(135deg, #1a3a5c 0%, #0d2040 100%); color: #FFD700; border-color: #FFD700; box-shadow: 0 0 12px rgba(255, 215, 0, 0.2); }
    .asset-tab:focus { outline: none; border-color: #88aacc; box-shadow: 0 0 0 2px rgba(136, 170, 204, 0.4); }
    .asset-section { margin-bottom: min(16px, 2vh); }
    .section-title { font-size: clamp(12px, 2.5vw, 18px); color: #FFD700; margin: 0 0 min(10px, 1.5vh) 0; padding-bottom: 6px; border-bottom: 1px solid #1b2838; letter-spacing: 1px; }
    .group-label { font-size: clamp(9px, 1.5vw, 12px); color: #4a6a8a; margin: 12px 0 6px 0; padding-left: 4px; letter-spacing: 1px; text-transform: uppercase; }
    .group-label:first-child { margin-top: 0; }
    .asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(140px, 40vw), 1fr)); gap: min(10px, 1.5vw); }
    .asset-grid-small { grid-template-columns: repeat(auto-fill, minmax(min(100px, 28vw), 1fr)); }
    .asset-selector-container.compact .asset-grid { grid-template-columns: repeat(auto-fill, minmax(min(200px, 60vw), 1fr)); }
    .asset-selector-container.compact .asset-card { flex-direction: row; padding: 8px 12px; gap: 10px; }
    .asset-selector-container.compact .asset-card-icon { width: 36px; height: 36px; font-size: 18px; margin-bottom: 0; flex-shrink: 0; }
    .asset-selector-container.compact .asset-card-desc, .asset-selector-container.compact .asset-card-sample { display: none; }
    .asset-card { position: relative; background: #0d1b2a; border: 2px solid #1b2838; border-radius: 12px; padding: min(14px, 2vw) min(10px, 1.5vw); cursor: pointer; transition: all 0.25s ease; text-align: center; overflow: hidden; display: flex; flex-direction: column; align-items: center; gap: 6px; user-select: none; }
    .asset-card:hover { border-color: #3a6a9a; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0, 100, 255, 0.15); animation: card-wobble 0.5s ease; }
    .asset-card.selected { border-color: #FFD700; box-shadow: 0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.05); background: linear-gradient(180deg, rgba(255, 215, 0, 0.08) 0%, #0d1b2a 100%); }
    .asset-card:focus { outline: none; border-color: #88aacc; box-shadow: 0 0 0 3px rgba(136, 170, 204, 0.4); transform: translateY(-2px); }
    .asset-card:focus.selected { border-color: #FFD700; box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.2); }
    .asset-card.dragging { opacity: 0.5; transform: scale(0.95); }
    .asset-card.drag-over { border-color: #FFD700; box-shadow: 0 0 12px rgba(255, 215, 0, 0.3); }
    .asset-card-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); transition: transform 0.2s ease; }
    .asset-card:hover .asset-card-icon { transform: scale(1.1); }
    .asset-card-name { font-size: clamp(9px, 1.8vw, 13px); color: #e0e0e0; font-weight: bold; line-height: 1.3; }
    .asset-card-desc { font-size: clamp(7px, 1.3vw, 10px); color: #6a7a8a; line-height: 1.3; }
    .asset-card-sample { font-size: clamp(10px, 1.8vw, 14px); color: #b0c0d0; margin-top: 4px; }
    .asset-badge { position: absolute; top: 6px; right: 6px; background: linear-gradient(135deg, #00E676, #00C853); color: #000; font-size: 8px; font-weight: bold; padding: 2px 6px; border-radius: 4px; letter-spacing: 1px; }
    .asset-check { position: absolute; bottom: 6px; right: 6px; width: 22px; height: 22px; background: #FFD700; color: #000; border-radius: 50%; display: none; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4); }
    .asset-card.selected .asset-check { display: flex; }
    .asset-card-image { padding: 8px; }
    .asset-thumb { width: 100%; height: 60px; object-fit: contain; border-radius: 6px; image-rendering: pixelated; background: rgba(0,0,0,0.3); padding: 4px; }
    .font-preview-box { background: #0a0e1a; border: 2px solid #1b2838; border-radius: 12px; padding: min(16px, 2vw); margin-top: min(12px, 1.5vh); }
    .font-preview { color: #FFD700; font-size: clamp(14px, 3vw, 22px); line-height: 1.6; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); }
    .audio-settings { display: flex; flex-direction: column; gap: min(12px, 1.5vh); }
    .audio-toggle { display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 10px 14px; background: #0d1b2a; border: 1px solid #1b2838; border-radius: 8px; transition: border-color 0.2s; }
    .audio-toggle:hover { border-color: #3a6a9a; }
    .audio-toggle input[type="checkbox"] { width: 20px; height: 20px; accent-color: #FFD700; cursor: pointer; }
    .toggle-label { color: #e0e0e0; font-size: clamp(10px, 2vw, 14px); }
    .audio-note { color: #6a7a8a; font-size: clamp(8px, 1.5vw, 12px); margin: 8px 0 0 0; }
    .music-track-list { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
    .music-track { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #0d1b2a; border: 1px solid #1b2838; border-radius: 8px; transition: all 0.2s; }
    .music-track:hover { border-color: #3a6a9a; }
    .music-track-name { flex: 1; color: #e0e0e0; font-size: clamp(9px, 1.5vw, 12px); }
    .music-track-btn { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #FFD700; background: transparent; color: #FFD700; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
    .music-track-btn:hover { background: #FFD700; color: #000; }
    .music-track-btn:focus { outline: none; box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.5); }
    .music-track-btn.playing { background: #FFD700; color: #000; animation: pulse-glow 1s ease-in-out infinite; }
    .style-toggle-group { display: flex; gap: min(12px, 1.5vw); }
    .style-btn { flex: 1; background: #0d1b2a; border: 2px solid #1b2838; border-radius: 12px; padding: min(16px, 2vw) min(12px, 1.5vw); cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; gap: 6px; color: #8899aa; }
    .style-btn:hover { border-color: #3a6a9a; background: #121e30; }
    .style-btn.active { border-color: #FFD700; background: linear-gradient(180deg, rgba(255, 215, 0, 0.08) 0%, #0d1b2a 100%); color: #FFD700; box-shadow: 0 0 16px rgba(255, 215, 0, 0.2); }.style-btn:focus { 
    outline: none; 
    border-color: #88aacc; 
    box-shadow: 0 0 0 2px rgba(136, 170, 204, 0.4); 
}

    .style-btn-icon { font-size: clamp(24px, 5vw, 36px); }
    .style-btn-label { font-size: clamp(11px, 2vw, 15px); font-weight: bold; color: inherit; }
    .style-btn-desc { font-size: clamp(7px, 1.3vw, 10px); color: #6a7a8a; text-align: center; }
    .asset-start-btn { display: block; width: 100%; margin-top: min(20px, 3vh); padding: min(16px, 2.5vh) min(24px, 3vw); background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000; border: none; border-radius: 12px; font-family: inherit; font-size: clamp(16px, 3.5vw, 24px); font-weight: bold; cursor: pointer; letter-spacing: 3px; text-shadow: 0 1px 0 rgba(255,255,255,0.3); box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3); transition: all 0.2s ease; }
    .asset-start-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 30px rgba(255, 215, 0, 0.5); filter: brightness(1.1); }
    .asset-start-btn:focus { outline: none; box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.5), 0 6px 30px rgba(255, 215, 0, 0.5); }
    .asset-start-btn:active { transform: translateY(0); box-shadow: 0 2px 10px rgba(255, 215, 0, 0.3); }
  `;
  document.head.appendChild(style);
}

// ── Main Entry Point ────────────────────────────────────────────────────

export function showAssetSelector(onStart) {
  if (selectorActive) return;
  selectorActive = true;
  mainMenuShown = true;
  injectStyles();
  const prefs = Assets.loadPreferences();

  const overlay = document.createElement('div');
  overlay.id = 'asset-selector-overlay';
  overlay.className = 'asset-selector-overlay';
  overlay.innerHTML = `
    <div class="asset-selector-container" id="asset-container">
      <div class="asset-selector-header">
        <h1 class="asset-selector-title">PAC-MAN 3D</h1>
        <p class="asset-selector-subtitle">Choose Your Assets</p>
      </div>
      <div class="asset-toolbar">
        <button class="toolbar-btn" id="compact-toggle" title="Toggle compact view">▦ Compact</button>
        <button class="toolbar-btn active" id="expand-toggle" title="Toggle detailed view">⊞ Detailed</button>
      </div>
      <div class="asset-selector-tabs">
        <button class="asset-tab active" data-section="pacman">Pac-Man</button>
        <button class="asset-tab" data-section="ghost">Ghost</button>
        <button class="asset-tab" data-section="font">Font</button>
        <button class="asset-tab" data-section="audio">Audio</button>
        <button class="asset-tab" data-section="style">Style</button>
      </div>
      <div class="asset-section" data-section="pacman">
        <div id="pacman-grid-container"></div>
        <h2 class="section-title" style="margin-top:min(16px,2vh);">Pac-Man Image (HUD)</h2>
        <div class="asset-grid asset-grid-small" id="pacman-image-grid"></div>
      </div>
      <div class="asset-section" data-section="ghost" style="display:none;">
        <div id="ghost-grid-container"></div>
        <h2 class="section-title" style="margin-top:min(16px,2vh);">Ghost Image (HUD)</h2>
        <div class="asset-grid asset-grid-small" id="ghost-image-grid"></div>
      </div>
      <div class="asset-section" data-section="font" style="display:none;">
        <h2 class="section-title">Game Font</h2>
        <div class="asset-grid" id="font-grid"></div>
        <div class="font-preview-box">
          <p id="font-preview-text" class="font-preview">0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>SCORE: 10000  HIGH: 99999<br/>GAME OVER</p>
        </div>
      </div>
      <div class="asset-section" data-section="audio" style="display:none;">
        <h2 class="section-title">Audio Settings</h2>
        <div class="audio-settings">
          <label class="audio-toggle"><input type="checkbox" id="music-toggle" ${prefs.musicEnabled ? 'checked' : ''} /><span class="toggle-label">Background Music</span></label>
          <label class="audio-toggle"><input type="checkbox" id="sfx-toggle" ${prefs.sfxEnabled ? 'checked' : ''} /><span class="toggle-label">Sound Effects</span></label>
        </div>
        <div id="track-list-container"></div>
      </div>
      <div class="asset-section" data-section="style" style="display:none;">
        <h2 class="section-title">Visual Style</h2>
        <div class="style-toggle-group">
          <button class="style-btn ${prefs.style === 'legacy' ? 'active' : ''}" data-style="legacy"><span class="style-btn-icon">🟡</span><span class="style-btn-label">Legacy</span><span class="style-btn-desc">Classic sphere models, retro look</span></button>
          <button class="style-btn ${prefs.style === 'new' ? 'active' : ''}" data-style="new"><span class="style-btn-icon">🚀</span><span class="style-btn-label">New</span><span class="style-btn-desc">3D models, modern visuals</span></button>
        </div>
        <h2 class="section-title" style="margin-top:20px;">Controls</h2>
        <p class="section-desc">Choose how to control Pac-Man on mobile</p>
        <div class="style-toggle-group">
          <button class="style-btn control-mode-btn ${prefs.controlMode === 'joystick' ? 'active' : ''}" data-control="joystick"><span class="style-btn-icon">🕹️</span><span class="style-btn-label">Joystick</span><span class="style-btn-desc">Virtual thumbstick on screen</span></button>
          <button class="style-btn control-mode-btn ${prefs.controlMode === 'gyro' ? 'active' : ''}" data-control="gyro"><span class="style-btn-icon">📱</span><span class="style-btn-label">Tilt</span><span class="style-btn-desc">Tilt your phone to steer</span></button>
          <button class="style-btn control-mode-btn ${prefs.controlMode === 'both' ? 'active' : ''}" data-control="both"><span class="style-btn-icon">🎮</span><span class="style-btn-label">Both</span><span class="style-btn-desc">Joystick + tilt together</span></button>
        </div>
        <h2 class="section-title" style="margin-top:min(20px,3vh);">Splash Screen Image</h2>
        <p style="color:#6a7a8a;font-size:clamp(9px,1.8vw,13px);margin:0 0 min(12px,1.5vh) 0;">Background image shown on the intro splash</p>
        <div class="asset-grid asset-grid-small" id="splash-image-grid"></div>
      </div>
      <button id="asset-start-btn" class="asset-start-btn">▶ START GAME</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Animated background
  if (!prefersReducedMotion) { _cleanupPellets = createFloatingPellets(overlay); }

  // Keyboard navigation
  setupKeyboardNav(overlay);

  // Intro sound
  try { const a = new Audio(Assets.SFX.intro.path); a.volume = 0.5; a.play().catch(() => {}); } catch (e) {}

  // ── Populate grids ──

  // Pac-Man models (grouped)
  const pacmanContainer = document.getElementById('pacman-grid-container');
  for (const group of PACMAN_GROUPS) {
    const gl = document.createElement('div'); gl.className = 'group-label'; gl.textContent = group.label;
    pacmanContainer.appendChild(gl);
    const grid = document.createElement('div'); grid.className = 'asset-grid';
    for (const id of group.ids) {
      const model = Assets.PACMAN_MODELS[id];
      if (!model) continue;
      grid.appendChild(createModelCard(id, model, 'pacman', prefs.pacmanModel));
    }
    enableDragReorder(grid);
    pacmanContainer.appendChild(grid);
  }

  // Ghost models (grouped)
  const ghostContainer = document.getElementById('ghost-grid-container');
  for (const group of GHOST_GROUPS) {
    const gl = document.createElement('div'); gl.className = 'group-label'; gl.textContent = group.label;
    ghostContainer.appendChild(gl);
    const grid = document.createElement('div'); grid.className = 'asset-grid';
    for (const id of group.ids) {
      const model = Assets.GHOST_MODELS[id];
      if (!model) continue;
      grid.appendChild(createModelCard(id, model, 'ghost', prefs.ghostModel));
    }
    enableDragReorder(grid);
    ghostContainer.appendChild(grid);
  }

  // Images
  const pacImageGrid = document.getElementById('pacman-image-grid');
  for (const [id, img] of Object.entries(Assets.PACMAN_IMAGES)) pacImageGrid.appendChild(createImageCard(id, img, 'pacmanImage', prefs.pacmanImage));
  const ghostImageGrid = document.getElementById('ghost-image-grid');
  for (const [id, img] of Object.entries(Assets.GHOST_IMAGES)) ghostImageGrid.appendChild(createImageCard(id, img, 'ghostImage', prefs.ghostImage));

  // Fonts
  const fontGrid = document.getElementById('font-grid');
  for (const [id, font] of Object.entries(Assets.FONTS)) fontGrid.appendChild(createFontCard(id, font, prefs.font));

  // Splash images
  const splashGrid = document.getElementById('splash-image-grid');
  if (splashGrid) for (const [id, img] of Object.entries(Assets.SPLASH_IMAGES || Assets.INTRO_IMAGES)) splashGrid.appendChild(createImageCard(id, img, 'splashImage', prefs.splashImage));

  // Audio track list
  document.getElementById('track-list-container').appendChild(createTrackList());

  // Font preview
  updateFontPreview(prefs.font);

  // ── Events ──

  overlay.querySelectorAll('.asset-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      overlay.querySelectorAll('.asset-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const section = tab.dataset.section;
      overlay.querySelectorAll('.asset-section').forEach(s => s.style.display = 'none');
      const target = overlay.querySelector(`.asset-section[data-section="${section}"]`);
      if (target) target.style.display = 'block';
      activeSection = section;
      stopPreview();
    });
  });

  overlay.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      prefsRef.style = btn.dataset.style;
    });
  });

  // Control mode toggle buttons
  overlay.querySelectorAll('.control-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.control-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      prefsRef.controlMode = btn.dataset.control;
    });
  });

  const container = document.getElementById('asset-container');
  const compactBtn = document.getElementById('compact-toggle');
  const expandBtn = document.getElementById('expand-toggle');
  compactBtn.addEventListener('click', () => { container.classList.add('compact'); compactBtn.classList.add('active'); expandBtn.classList.remove('active'); });
  expandBtn.addEventListener('click', () => { container.classList.remove('compact'); expandBtn.classList.add('active'); compactBtn.classList.remove('active'); });

  document.getElementById('asset-start-btn').addEventListener('click', () => {
    const finalPrefs = collectPreferences();
    Assets.savePreferences(finalPrefs);
    closeSelector();
    onStart(finalPrefs);
  });
}

let _cleanupPellets = null;

function closeSelector() {
  stopPreview();
  if (_cleanupPellets) { _cleanupPellets(); _cleanupPellets = null; }
  const overlay = document.getElementById('asset-selector-overlay');
  if (overlay) {
    overlay.classList.add('fading-out');
    setTimeout(() => { overlay.remove(); selectorActive = false; }, 400);
  }
}

// ── Card Creators ───────────────────────────────────────────────────────

function createModelCard(id, model, type, selectedId) {
  const div = document.createElement('div');
  div.className = `asset-card ${id === selectedId ? 'selected' : ''}`;
  div.dataset.id = id;
  div.dataset.type = type;
  const styleMap = type === 'pacman' ? PACMAN_CARD_STYLES : GHOST_CARD_STYLES;
  const cardStyle = styleMap[id] || { gradient: 'linear-gradient(135deg, #555 0%, #333 100%)', emoji: type === 'pacman' ? '🟡' : '👻', bg: '#1a1a1a' };
  const badge = model.type === 'builtin' ? '' : '<span class="asset-badge">3D</span>';
  div.style.background = cardStyle.bg;
  div.innerHTML = `<div class="asset-card-icon" style="background:${cardStyle.gradient};">${cardStyle.emoji}</div><div class="asset-card-name">${model.name}</div><div class="asset-card-desc">${model.description}</div>${badge}<div class="asset-check">✓</div>`;
  div.addEventListener('click', () => {
    const grid = div.closest('.asset-grid');
    grid.querySelectorAll('.asset-card').forEach(c => c.classList.remove('selected'));
    div.classList.add('selected');
    spawnParticles(div);
    prefsRef[type === 'pacman' ? 'pacmanModel' : 'ghostModel'] = id;
  });
  return div;
}

const prefsRef = Assets.loadPreferences();

function createImageCard(id, img, type, selectedId) {
  const div = document.createElement('div');
  div.className = `asset-card asset-card-image ${id === selectedId ? 'selected' : ''}`;
  div.dataset.id = id;
  div.dataset.type = type;
  div.innerHTML = `<img src="${img.path}" alt="${img.name}" class="asset-thumb" onerror="this.style.display='none'" /><div class="asset-card-name">${img.name}</div><div class="asset-check">✓</div>`;
  div.addEventListener('click', () => {
    const grid = div.closest('.asset-grid');
    grid.querySelectorAll('.asset-card').forEach(c => c.classList.remove('selected'));
    div.classList.add('selected');
    spawnParticles(div);
    prefsRef[type] = id;
  });
  return div;
}

function createFontCard(id, font, selectedId) {
  const div = document.createElement('div');
  div.className = `asset-card ${id === selectedId ? 'selected' : ''}`;
  div.dataset.id = id;
  div.innerHTML = `<div class="asset-card-name" style="font-family:'${font.family}',monospace;font-size:clamp(14px,2.5vw,20px);color:#FFD700;">${font.name}</div><div class="asset-card-desc">${font.description}</div><div class="asset-card-sample" style="font-family:'${font.family}',monospace;">Aa Bb 123</div><div class="asset-check">✓</div>`;
  div.addEventListener('click', () => {
    const grid = div.closest('.asset-grid');
    grid.querySelectorAll('.asset-card').forEach(c => c.classList.remove('selected'));
    div.classList.add('selected');
    spawnParticles(div);
    prefsRef.font = id;
    updateFontPreview(id);
  });
  return div;
}

function updateFontPreview(fontId) {
  const font = Assets.FONTS[fontId];
  if (!font) return;
  const preview = document.getElementById('font-preview-text');
  if (preview) preview.style.fontFamily = `'${font.family}', monospace`;
}

function collectPreferences() {
  const musicToggle = document.getElementById('music-toggle');
  const sfxToggle = document.getElementById('sfx-toggle');
  return { ...prefsRef, musicEnabled: musicToggle ? musicToggle.checked : true, sfxEnabled: sfxToggle ? sfxToggle.checked : true, controlMode: prefsRef.controlMode || 'both' };
}

export function isSelectorActive() { return selectorActive; }
export function wasMainMenuShown() { return mainMenuShown; }
