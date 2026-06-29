import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LEVELS } from './levels.js';
import { CHALLENGE_LEVELS } from './challenge-levels.js';
import { FRUITS, FRUIT_SPEED, FRUIT_DURATION, FRUIT_FADE_DURATION, FRUIT_ONCE_PER_LEVEL } from './fruit.js';
import * as Assets from './asset-manager.js';
import * as AssetSelector from './asset-selector.js';

// Load fonts into the document via @font-face injection
Assets.loadFonts();
import * as PuterIntegration from './puter-integration.js';

// ─── UI Scaling (must be defined before any constant that calls upx()) ──

/** Reference viewport dimension for scaling (600px = 1x scale) */
const UI_REFERENCE = 600;

/**
 * Returns the current UI scale factor based on viewport size.
 * Uses the smaller dimension for consistent results on landscape/portrait.
 * Min 0.5 (tiny screens), Max 1.3 (large desktops).
 */
function getUIScale() {
    return Math.min(1.3, Math.max(0.5, Math.min(window.innerWidth, window.innerHeight) / UI_REFERENCE));
}

/**
 * Scale a pixel value by the current UI scale factor.
 */
function upx(px) {
    return Math.round(px * getUIScale());
}

/* The virtual joystick's on-screen radius in pixels */
/* @tweakable The virtual joystick's on-screen radius in pixels */
const JOYSTICK_RADIUS = upx(48);
/* The thumb's maximum distance from center in pixels */
const JOYSTICK_RANGE = upx(36);
/* Opacity of the joystick control (0 = transparent, 1 = opaque) */
const JOYSTICK_OPACITY = 0.6;
/* Minimum joystick movement to register direction (0.0 - 1.0) */
const JOYSTICK_DEADZONE = 0.20;
/* Controls the player's move speed multiplier when using joystick */
const JOYSTICK_SPEED_MULTIPLIER = 1;
/* Enable or disable debug printing of joystick info */
const JOYSTICK_DEBUG = false;

/* Enable gyroscope tilt controls on mobile? */
/* @tweakable Enable gyroscope tilt controls on mobile */
const ENABLE_GYRO = true;
/* Gyroscope sensitivity (how much tilt maps to movement) */
/* @tweakable Gyroscope tilt sensitivity (0.1 = subtle, 1.0 = very responsive) */
const GYRO_SENSITIVITY = 0.5;
/* Gyroscope deadzone - minimum tilt angle to register (degrees) */
/* @tweakable Gyroscope deadzone in degrees */
const GYRO_DEADZONE = 5;
/* Gyroscope max tilt angle for full speed (degrees) */
/* @tweakable Gyroscope max tilt angle for full speed (degrees) */
const GYRO_MAX_TILT = 30;

/* Maze walls opacity (0: invisible, 1: opaque) */
/* @tweakable Maze walls opacity (0: invisible, 1: opaque) */
const MAZE_OPACITY = 0.5;
/* Maze wall color */
const WALL_COLOR = "#314ABD";

/* Power pellet mode duration, in seconds */
/* @tweakable Power pellet mode duration, in seconds */
const POWER_PELLET_DURATION = 10;

/* Volume of dot/gameplay effects (0.0-1.0) */
/* @tweakable Volume of dot/gameplay effects (0.0-1.0) */
const SOUND_VOLUME = 0.5;
/* Ghost ambient sound volume (0.0-1.0) */
/* @tweakable Ghost ambient sound volume (0.0-1.0) */
const GHOST_AMBIENT_VOLUME = 0.2;
/* Background music playlist - list of available music tracks */
/* @tweakable Playlist of background music tracks (must be site assets as .mp3) */
let MUSIC_PLAYLIST = Assets.getMusicPlaylist();
/* @tweakable Background music volume (0.0-1.0) */
const BACKGROUND_MUSIC_VOLUME = 0.3;
/* @tweakable Number of seconds for crossfade between tracks in playlist */
const MUSIC_CROSSFADE_TIME = 1.5;
/* @tweakable If true, repeat background music playlist; else stop after one cycle */
const MUSIC_REPEAT_PLAYLIST = true;
/* Music volume reduction when paused (multiplier of normal volume) */
const PAUSED_MUSIC_VOLUME_MULTIPLIER = 0.4;
/* Elevator music fade-out time when game ends (seconds) */
const ELEVATOR_MUSIC_FADE_OUT = 2.0;

/* Score for eating a regular dot */
/* @tweakable Score for eating a regular dot */
const SCORE_DOT = 10;
/* Score for eating a power pellet */
/* @tweakable Score for eating a power pellet */
const SCORE_POWER_PELLET = 50;
/* Score for eating a ghost */
/* @tweakable Score for eating a ghost */
const SCORE_GHOST = 200;
/* Level completion score bonus */
/* @tweakable Level completion score bonus */
const SCORE_LEVEL_COMPLETE = 1000;
/* Enable consecutive ghost bonus multiplier */
/* @tweakable Should consecutive ghost eat bonuses multiply ("2x, 4x, 8x...") */
const GHOST_SCORE_MULTIPLIER = true;

/* Should the virtual joystick be shown on mobile? */
const ENABLE_JOYSTICK = true;

/* Number of player lives at the start of every level */
/* @tweakable Number of player lives at the start of every level */
const PLAYER_START_LIVES = 3;

/* Paddle width for virtual joystick (not visible, for tweakable set) */
const PADDLE_WIDTH = 40; 

/* Ghost colors, in sequence [red, cyan, pink, orange] */
const GHOST_COLORS = ['#FF0000', '#00FFDE', '#FFB8DE', '#FFB847'];

/* How long to wait before respawning ghosts (seconds) */
const GHOST_RESPAWN_TIME = 8;

/* Maximum ghosts on screen at once */
/* @tweakable Number of ghosts allowed on screen (max) */
const MAX_GHOSTS = 4;

/* The Z-height of the spot light above the maze */
const SPOTLIGHT_HEIGHT = 50;
/* Spotlight intensity (0.0-1.0) */
/* @tweakable Spot light intensity */
const SPOTLIGHT_INTENSITY = 0.5;
/* Spotlight color */
const SPOTLIGHT_COLOR = '#FFFFFF';

/* Score label font size (px) */
const SCORE_FONT_SIZE = upx(24);

/* HUD minimap corner square width/height (pixels) */
const HUD_SIZE = upx(200);

/* HUD minimap offset from bottom/left (pixels) */
const HUD_MARGIN = upx(10);

/* HUD minimap object scale */
const HUD_OBJECT_SCALE = 2.5;

/* Score text color */
const SCORE_COLOR = '#FFD700';

/* Legacy arcade font for numbers — always Press Start 2P regardless of selected font */
const LEGACY_NUMBER_FONT = "'Press Start 2P', monospace";

/* How long text messages are visible on the screen (ms) */
/* @tweakable How long the 'You died' or 'Game Over' overlay message is displayed (ms) */
const TEXT_DISPLAY_DURATION = 2200;

/* Winning text display duration (seconds) */
const WON_TEXT_TIME = 3;

/* Game over message display duration (seconds) */
const GAME_OVER_MSG_TIME = 4;

/* Pause overlay opacity */
const PAUSE_OVERLAY_OPACITY = 0.7;

/* "Play Again" button font size (in px) */
const PLAY_AGAIN_BUTTON_FONT_SIZE = upx(34);
/* "Play Again" button color */
const PLAY_AGAIN_BUTTON_COLOR = '#FFD700';
/* "Play Again" button background color */
const PLAY_AGAIN_BUTTON_BG = '#111d33';
/* "Play Again" button border radius (px) */
const PLAY_AGAIN_BUTTON_BORDER_RADIUS = upx(18);
/* "Play Again" overlay opacity (0-invisible, 1-opaque) */
const PLAY_AGAIN_OVERLAY_OPACITY = 0.90;
/* How many seconds before showing "Play Again" button after game over */
const PLAY_AGAIN_SHOW_DELAY = 2;

/* Delay to restart after dying (seconds) */
const RESPAWN_DELAY = 2.0;

/* Initial player speed */
/* @tweakable Initial player speed (units/sec) */
const PACMAN_SPEED = 2;
/* Ghost speed */
/* @tweakable Ghost speed (units/sec) */
const GHOST_SPEED = 1.5;
/* Pacman radius for collisions */
const PACMAN_RADIUS = 0.25;
/* Ghost radius for collisions */
const GHOST_RADIUS = PACMAN_RADIUS * 1.25;

/* Jump height, how high Pacman jumps in units */
/* @tweakable Pacman jump height */
const JUMP_HEIGHT = 0.8;
/* Jump duration in seconds */
const JUMP_DURATION = 0.5;
/* Jump cooldown in seconds (prevent jump spam) */
const JUMP_COOLDOWN = 1.0;
/* Jump speed boost - speed multiplier while jumping */
const JUMP_SPEED_BOOST = 1.4;
/* Should Pacman rotate when jumping? */
const JUMP_ROTATE = true;
/* Degrees of rotation when jumping */
/* @tweakable Amount of rotation (degrees) during a jump */
const JUMP_ROTATION_DEGREES = 720;
/* Gravity effect multiplier during the fall portion of jump */
const JUMP_GRAVITY_MULTIPLIER = 1.0;
/* Camera height offset during jump */
const JUMP_CAMERA_HEIGHT_OFFSET = 2.5;

/* Jump indicator text color */
const JUMP_INDICATOR_COLOR = '#FFD700';
/* Jump indicator background opacity (0-1) */
const JUMP_INDICATOR_BG_OPACITY = 0.5;
/* Jump indicator cooldown color */
const JUMP_INDICATOR_COOLDOWN_COLOR = '#aaaaaa';
/* Jump indicator position from bottom (px) */
const JUMP_INDICATOR_BOTTOM = upx(20);
/* Jump indicator position from right (px) */
const JUMP_INDICATOR_RIGHT = upx(20);
/* Jump indicator font size (px) */
const JUMP_INDICATOR_FONT_SIZE = upx(18);
/* Jump indicator text padding (px) */
const JUMP_INDICATOR_PADDING = upx(8) + 'px ' + upx(15) + 'px';

/* Size of dots (regular pellets) */
const DOT_RADIUS = 0.05;
/* Power pellet size multiplier relative to dots */
/* @tweakable Power pellet size multiplier */
const POWER_PELLET_SIZE_MULTIPLIER = 2;
/* Dot color */
/* @tweakable Dot color */
const DOT_COLOR = '#FFD9B9';

/* Particle effect count when eating a ghost */
const GHOST_EATEN_PARTICLE_COUNT = 15;
/* Particle effect duration when eating a ghost (seconds) */
const GHOST_EATEN_PARTICLE_DURATION = 0.8;
/* Particle size multiplier relative to ghost radius */
const GHOST_PARTICLE_SIZE_MULTIPLIER = 0.2;
/* Particle gravity effect strength */
const GHOST_PARTICLE_GRAVITY = 2.0;

/* Pacman animation speed modifier */
const PACMAN_ANIMATION_SPEED = 1.0;

/* Ghost movement randomness (0: predictable, 1: very random) */
/* @tweakable Ghost movement randomness (0: predictable, 1: very random) */
const GHOST_MOVEMENT_RANDOMNESS = 0.65;
/* Ghost eye size multiplier when afraid */
const GHOST_AFRAID_EYE_MULTIPLIER = 1.2;
/* Ghost flash rate when power pellet is nearly expired (flashes per second) */
const GHOST_AFRAID_FLASH_RATE = 4;

/* Elevator music fade-in time (seconds) */
const ELEVATOR_MUSIC_FADE_IN = 1.5;

/* Menu button hover brightness increase (1.0 = no change) */
const MENU_BUTTON_HOVER_BRIGHTNESS = 1.30;
/* Play Again button hover brightness increase */
const PLAY_AGAIN_BUTTON_HOVER_BRIGHTNESS = 1.15;
/* Menu button hover brightness increase */
const MENU_BACK_BUTTON_HOVER_BRIGHTNESS = 1.19;

/* Pacman death animation speed */
const PACMAN_DEATH_ANIMATION_SPEED = 1.0;

/* Pause button size (px) */
const PAUSE_BUTTON_SIZE = upx(50);
/* Pause button font size (px) */
const PAUSE_BUTTON_FONT_SIZE = upx(24);
/* Pause button background color */
const PAUSE_BUTTON_BG = '#21265B';
/* Pause button text color */
const PAUSE_BUTTON_COLOR = '#FFD700';

/* High score name input maximum length */
const HIGH_SCORE_NAME_MAX_LENGTH = 3;
/* Default high score name if none entered */
const HIGH_SCORE_DEFAULT_NAME = 'AAA';

// Global audio initialization variables
let audioInitialized = false;
let wakkaSound, ghostAmbientSound, beginningSound, deathSound, extraPacSound, intermissionSound, powerPelletSound, ghostSfxSound;
let playlistAudios = []; // Audio objects for playlist
let playlistCurrentIndex = -1;
let playlistAudioIsFading = false;

// Current asset selection preferences
let assetPrefs = Assets.loadPreferences();
let _currentScene = null;
let _pacmanModelCache = {};
let _ghostModelCache = {};
let assetSelectorCallback = null;

/**
 * Plays the next track in the playlist, randomly.
 * Previous track fades out, next fades in.
 */
function playRandomFromPlaylist() {
    if (playlistAudios.length === 0) {
        // initialize playlist audio objects
        playlistAudios = MUSIC_PLAYLIST.map(path => {
            const audio = new Audio(path);
            audio.loop = false;
            audio.volume = 0;
            return audio;
        });
    }

    // Stop all tracks first (except one fading out if applicable)
    playlistAudios.forEach((a, i) => {
        if (i !== playlistCurrentIndex || !playlistAudioIsFading) {
            a.pause();
            a.currentTime = 0;
        }
    });

    // Pick a random index that's not the last played
    let nextIndex;
    do {
        nextIndex = Math.floor(Math.random() * playlistAudios.length);
    } while (playlistAudios.length > 1 && nextIndex === playlistCurrentIndex);
    playlistCurrentIndex = Math.min(nextIndex, playlistAudios.length - 1); // Ensure index is valid
    const audio = playlistAudios[playlistCurrentIndex];

    // Set main volume (may be modified by pause etc)
    audio.volume = 0;
    audio.loop = false;

    // Fade in new track
    audio.play().then(() => {
        // crossfade in
        let t = 0;
        playlistAudioIsFading = true;
        const fadeInterval = setInterval(() => {
            t += 0.1;
            audio.volume = Math.min(BACKGROUND_MUSIC_VOLUME, (t / MUSIC_CROSSFADE_TIME) * BACKGROUND_MUSIC_VOLUME);
            if (audio.volume >= BACKGROUND_MUSIC_VOLUME - 0.01) {
                audio.volume = BACKGROUND_MUSIC_VOLUME;
                playlistAudioIsFading = false;
                clearInterval(fadeInterval);
            }
        }, 100);
    }).catch(() => {});

    // When this audio finishes, play a new random song unless one is already fading in
    audio.onended = () => {
        // next only if repeat or still not at end
        if (MUSIC_REPEAT_PLAYLIST) {
            // Give a short gap before next track for effect
            setTimeout(() => playRandomFromPlaylist(), 250);
        }
    };
}

/**
 * Stops all music in the playlist, fading out if requested.
 */
function stopAllPlaylistMusic(fade = true) {
    playlistAudios.forEach(audio => {
        if (!audio.paused) {
            if (fade) {
                let t = audio.volume, volStart = t;
                const fadeOut = setInterval(() => {
                    t -= (volStart / (MUSIC_CROSSFADE_TIME * 10));
                    audio.volume = Math.max(0, t);
                    if (audio.volume <= 0.01) {
                        audio.pause();
                        audio.currentTime = 0;
                        clearInterval(fadeOut);
                    }
                }, 100);
            } else {
                audio.pause();
                audio.currentTime = 0;
                audio.volume = 0;
            }
        }
    });
}

/**
 * Set the playlist music volume (for fading during pause, etc)
 */
function setPlaylistVolume(vol) {
    playlistAudios.forEach(audio => {
        audio.volume = Math.max(0, Math.min(vol, 1));
    });
}

// Global audio initialization function
function initAudio() {
    if (audioInitialized) return;

    if (Audio) {
        wakkaSound = new Audio(Assets.SFX.wakka.path);
        wakkaSound.volume = SOUND_VOLUME;

        ghostAmbientSound = new Audio(Assets.SFX.pacGhost.path);
        ghostAmbientSound.volume = GHOST_AMBIENT_VOLUME;
        ghostAmbientSound.loop = true;

        beginningSound = new Audio(Assets.SFX.beginning.path);
        beginningSound.volume = SOUND_VOLUME;

        deathSound = new Audio(Assets.SFX.death.path);
        deathSound.volume = SOUND_VOLUME;

        extraPacSound = new Audio(Assets.SFX.extraPac.path);
        extraPacSound.volume = SOUND_VOLUME;

        intermissionSound = new Audio(Assets.SFX.intermission.path);
        intermissionSound.volume = SOUND_VOLUME;

        powerPelletSound = new Audio(Assets.SFX.powerPellet.path);
        powerPelletSound.volume = SOUND_VOLUME;

        ghostSfxSound = new Audio(Assets.SFX.ghostSfx.path);
        ghostSfxSound.volume = GHOST_AMBIENT_VOLUME;
        
        // Intro sound (not auto-played; used for menu ambiance)
        const introSound = new Audio(Assets.SFX.intro.path);
        introSound.volume = SOUND_VOLUME;

        // Play a random song from the playlist and fade it in
        if (assetPrefs.musicEnabled) {
            playRandomFromPlaylist();
        }

        audioInitialized = true;
    } else {
        console.error("Audio not supported in this browser.");
    }
}

// ─── Level Progression Tracking ────────────────────────────────────────────

const PROGRESS_KEY = 'pacman-level-progress';
const HIGHSCORES_KEY = 'pacman-highscores';

/**
 * Load the set of completed (mastered) level indices from localStorage.
 * @returns {number[]} Array of completed level indices
 */
function loadCompletedLevels() {
    try {
        const saved = localStorage.getItem(PROGRESS_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
}

/**
 * Mark a level as completed and persist.
 * @param {number} levelIdx - The level index that was completed
 */
function markLevelCompleted(levelIdx) {
    const completed = loadCompletedLevels();
    if (!completed.includes(levelIdx)) {
        completed.push(levelIdx);
        try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(completed)); } catch (e) {}
    }
}

/**
 * Returns the next level the player should play — the first unmastered level.
 * If all levels are mastered, returns the last level index.
 * @param {number} totalLevels - Total number of levels available
 * @returns {number} The next level index to play
 */
function getNextUnlockedLevel(totalLevels) {
    const completed = loadCompletedLevels();
    for (let i = 0; i < totalLevels; i++) {
        if (!completed.includes(i)) return i;
    }
    return totalLevels - 1; // All mastered, play last
}

/**
 * Check if a level has been mastered (completed at least once).
 * @param {number} levelIdx
 * @returns {boolean}
 */
function isLevelMastered(levelIdx) {
    return loadCompletedLevels().includes(levelIdx);
}

// ─── Device Detection ──────────────────────────────────────────────────────

/**
 * Detect if the user is on a mobile device.
 * Uses both user agent and touch/viewport checks.
 * @returns {boolean}
 */
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|Mobile/i.test(navigator.userAgent)
        || ('ontouchstart' in window && window.innerWidth <= 900);
}

// ─── Extra Life System ─────────────────────────────────────────────────────

/**
 * Calculate the score threshold for the next extra life.
 * Levels 1-50: every 10,000 points. After level 50: every 20,000 points.
 * @param {number} currentLevelIndex - 0-based level index
 * @param {number} livesAwardedSoFar - How many extra lives already awarded this game
 * @returns {number} Score at which the next extra life is awarded
 */
function getExtraLifeThreshold(currentLevelIndex, livesAwardedSoFar) {
    const interval = currentLevelIndex < 50 ? 10000 : 20000;
 return interval * (livesAwardedSoFar + 1);
}

(function () {
    // Constants
    var PELLET_RADIUS = DOT_RADIUS * POWER_PELLET_SIZE_MULTIPLIER;
    var UP = new THREE.Vector3(0, 0, 1);
    var LEFT = new THREE.Vector3(-1, 0, 0);
    var TOP = new THREE.Vector3(0, 1, 0);
    var RIGHT = new THREE.Vector3(1, 0, 0);
    var BOTTOM = new THREE.Vector3(0, -1, 0);

    let currentLevelIndex = 0;

    // Audio elements (all static site assets)
    let isPaused = false;
    let currentScore = 0;
    let scoreMultiplier = 1;
    let highScores = [];

    /**
     * Updates the score and the score display.
     * @param {number} amount Amount to add to the score (can be negative)
     */
    /* @tweakable Should score update instantly or with animation (true: animate, false: instant) */
    const SCORE_UPDATE_ANIMATE = false;
    function updateScore(amount) {
        if (typeof amount === 'number') {
            currentScore += amount;
        }
        // Clamp to at least zero
        if (currentScore < 0) currentScore = 0;
        // Update display (if exists)
        let scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) scoreDisplay.innerHTML = 'SCORE: ' + currentScore;
    }

    /* @tweakable Duration (seconds) for transient overlay text like "You won" or "+200" */
    const SHOW_TEXT_DURATION = 1.6;

    /**
     * Show a transient centered text overlay.
     * @param {string} text - The text to show
     * @param {number} scale - visual scale multiplier (approx)
     * @param {number} now - current time in seconds (performance.now()/1000)
     */
    function showText(text, scale, now) {
        try {
            const id = 'pacman-transient-text';
            let el = document.getElementById(id);
            if (!el) {
                el = document.createElement('div');
                el.id = id;
                el.style.position = 'fixed';
                el.style.left = '50%';
                el.style.top = '30%';
                el.style.transform = 'translate(-50%, -50%)';
                el.style.zIndex = 5000;
                el.style.pointerEvents = 'none';
                el.style.textAlign = 'center';
                el.style.padding = '8px 18px';
                el.style.borderRadius = '10px';
                el.style.fontFamily = LEGACY_NUMBER_FONT;
                document.body.appendChild(el);
            }
            el.textContent = text;
            el.style.color = '#fff';
            el.style.background = 'rgba(0,0,0,0.45)';
            el.style.fontWeight = '800';
            el.style.fontSize = Math.max(18, Math.floor(28 * (scale || 1))) + 'px';
            el.style.opacity = '1';
            el.style.transition = `opacity ${SHOW_TEXT_DURATION / 2}s ease, transform ${SHOW_TEXT_DURATION / 2}s ease`;
            el.style.transform = 'translate(-50%, -50%) scale(1.0)';

            // Force reflow so transition applies when we fade
            void el.offsetWidth;

            // Fade and move up after a moment
            setTimeout(() => {
                el.style.opacity = '0';
                el.style.transform = 'translate(-50%, -60%) scale(0.98)';
            }, SHOW_TEXT_DURATION * 400);

            // Remove after duration
            setTimeout(() => {
                if (el && el.parentElement) el.parentElement.removeChild(el);
            }, SHOW_TEXT_DURATION * 1000);
        } catch (e) {
            // Fail silently if DOM operations error out
            console.warn('showText error', e);
        }
    }

    // Load audio assets and highscores (static, not streamed)
    function initGame() {
        try {
            const savedScores = localStorage.getItem(HIGHSCORES_KEY);
            if (savedScores) highScores = JSON.parse(savedScores);
        } catch (e) { highScores = []; }
        while (highScores.length < 10) highScores.push({ name: '---', score: 0 });
        highScores.sort((a, b) => b.score - a.score);
    }

    /**
     * Check if a score qualifies for the top-10 high scores.
     * @param {number} score
     * @returns {boolean}
     */
    function qualifiesForHighScore(score) {
        const lowest = highScores[9]?.score ?? 0;
        return score > lowest || highScores.length < 10;
    }

    /**
     * Show an in-game HTML high score entry overlay (replaces browser prompt()).
     * Shows the current high score table, highlights the player's new entry,
     * and provides a text input for the player's name.
     * @param {number} score - The score to save
     * @param {function} onComplete - Called after the score is saved (or skipped)
     */
    function showHighScoreEntry(score, onComplete) {
        // First check if it qualifies
        if (!qualifiesForHighScore(score)) {
            if (onComplete) onComplete();
            return;
        }

        const overlay = document.createElement('div');
        const hsFontFamily = LEGACY_NUMBER_FONT;

        overlay.id = 'highscore-entry-overlay';
        overlay.style.position = 'fixed';
        overlay.style.left = '0'; overlay.style.top = '0';
        overlay.style.width = '100vw'; overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.9)';
        overlay.style.zIndex = '3000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontFamily = hsFontFamily;

        const box = document.createElement('div');
        box.style.background = '#111';
        box.style.color = '#FFD700';
        box.style.borderRadius = upx(20) + 'px';
        box.style.padding = upx(36) + 'px ' + upx(44) + 'px';
        box.style.boxShadow = '0 4px 30px #000c';
        box.style.textAlign = 'center';
        box.style.maxWidth = upx(400) + 'px';
        box.style.width = '90vw';

        // Title
        const title = document.createElement('div');
        title.textContent = '🏆 NEW HIGH SCORE!';
        title.style.fontSize = upx(32) + 'px';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = upx(8) + 'px';
        title.style.color = '#FFD700';
        box.appendChild(title);

        const scoreLine = document.createElement('div');
        scoreLine.textContent = 'Score: ' + score;
        scoreLine.style.fontSize = upx(24) + 'px';
        scoreLine.style.marginBottom = upx(24) + 'px';
        scoreLine.style.color = '#fff';
        box.appendChild(scoreLine);

        // Name input label
        const inputLabel = document.createElement('div');
        inputLabel.textContent = 'Enter your name (' + HIGH_SCORE_NAME_MAX_LENGTH + ' chars):';
        inputLabel.style.fontSize = upx(16) + 'px';
        inputLabel.style.color = '#aaa';
        inputLabel.style.marginBottom = upx(10) + 'px';
        box.appendChild(inputLabel);

        // Name input
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = HIGH_SCORE_NAME_MAX_LENGTH;
        input.value = HIGH_SCORE_DEFAULT_NAME;
        input.style.fontSize = upx(28) + 'px';
        input.style.textAlign = 'center';
        input.style.width = upx(180) + 'px';
        input.style.padding = upx(10) + 'px ' + upx(15) + 'px';
        input.style.border = '2px solid #FFD700';
        input.style.borderRadius = upx(10) + 'px';
        input.style.background = '#222';
        input.style.color = '#FFD700';
        input.style.fontWeight = 'bold';
        input.style.textTransform = 'uppercase';
        input.style.letterSpacing = upx(4) + 'px';
        input.style.outline = 'none';
        input.style.marginBottom = upx(20) + 'px';
        box.appendChild(input);

        // Auto-select and focus
        setTimeout(() => { input.focus(); input.select(); }, 100);

        // Submit button
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'SAVE';
        submitBtn.style.fontSize = upx(20) + 'px';
        submitBtn.style.padding = upx(12) + 'px ' + upx(40) + 'px';
        submitBtn.style.background = '#FFD700';
        submitBtn.style.color = '#111';
        submitBtn.style.border = 'none';
        submitBtn.style.borderRadius = upx(10) + 'px';
        submitBtn.style.fontWeight = 'bold';
        submitBtn.style.cursor = 'pointer';
        submitBtn.style.marginBottom = upx(20) + 'px';
        submitBtn.onmouseenter = () => submitBtn.style.filter = `brightness(${MENU_BUTTON_HOVER_BRIGHTNESS})`;
        submitBtn.onmouseleave = () => submitBtn.style.filter = '';
        box.appendChild(submitBtn);

        // High score table preview
        const tableTitle = document.createElement('div');
        tableTitle.textContent = 'HIGH SCORES';
        tableTitle.style.fontSize = upx(18) + 'px';
        tableTitle.style.fontWeight = 'bold';
        tableTitle.style.marginTop = upx(20) + 'px';
        tableTitle.style.marginBottom = upx(10) + 'px';
        tableTitle.style.color = '#FFD700';
        box.appendChild(tableTitle);

        const tableContainer = document.createElement('div');
        tableContainer.id = 'hs-table-preview';
        box.appendChild(tableContainer);

        function renderTablePreview(highlightScore) {
            tableContainer.innerHTML = '';
            const tbl = document.createElement('table');
            tbl.style.width = '100%';
            tbl.style.borderCollapse = 'collapse';
            const hdr = document.createElement('tr');
            ['RANK', 'NAME', 'SCORE'].forEach(t => {
                const th = document.createElement('th');
                th.textContent = t;
                th.style.padding = upx(4) + 'px ' + upx(12) + 'px';
                th.style.fontSize = upx(14) + 'px';
                hdr.appendChild(th);
            });
            tbl.appendChild(hdr);
            // Insert the new score temporarily for preview
            const tempScores = [...highScores, { name: input.value || HIGH_SCORE_DEFAULT_NAME, score: score, _new: true }];
            tempScores.sort((a, b) => b.score - a.score);
            tempScores.slice(0, 10).forEach((s, idx) => {
                const row = document.createElement('tr');
                if (s._new) {
                    row.style.background = 'rgba(255,215,0,0.15)';
                    row.style.color = '#FFD700';
                    row.style.fontWeight = 'bold';
                }
                row.style.textAlign = 'center';
                [idx + 1, s.name, s.score].forEach(t => {
                    const td = document.createElement('td');
                    td.textContent = t;
                    td.style.padding = upx(3) + 'px ' + upx(12) + 'px';
                    td.style.fontSize = upx(14) + 'px';
                    row.appendChild(td);
                });
                tbl.appendChild(row);
            });
            tableContainer.appendChild(tbl);
        }
        renderTablePreview(score);

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        function doSave() {
            const name = (input.value || HIGH_SCORE_DEFAULT_NAME).substring(0, HIGH_SCORE_NAME_MAX_LENGTH).toUpperCase();
            highScores.push({ name, score });
            highScores.sort((a, b) => b.score - a.score);
            highScores = highScores.slice(0, 10);
            try { localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(highScores)); } catch (e) {}
            // Also submit to Puter cloud leaderboard if available
            PuterIntegration.submitScore(score, name).catch(() => {});
            overlay.style.transition = 'opacity 0.3s ease';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                if (onComplete) onComplete();
            }, 300);
        }

        // Update preview as user types
        input.addEventListener('input', () => {
            input.value = input.value.toUpperCase();
            renderTablePreview(score);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); doSave(); }
        });
        submitBtn.onclick = doSave;
    }

    function createPauseButton() {
        const btn = document.createElement('button');
        btn.innerText = "⏸️";
        btn.style.position = 'fixed';
        btn.style.top = '10px';
        btn.style.right = '10px';
        btn.style.zIndex = '100';
        btn.style.background = PAUSE_BUTTON_BG;
        btn.style.color = PAUSE_BUTTON_COLOR;
        btn.style.border = 'none';
        btn.style.borderRadius = '8px';
        btn.style.fontSize = PAUSE_BUTTON_FONT_SIZE + 'px';
        btn.style.width = PAUSE_BUTTON_SIZE + 'px';
        btn.style.height = PAUSE_BUTTON_SIZE + 'px';
        btn.style.cursor = 'pointer';
        btn.onclick = () => {
            if (!audioInitialized) {
                initAudio();
            }

            isPaused = !isPaused;
            btn.innerText = isPaused ? "▶️" : "⏸️";
            if (isPaused) {
                intermissionSound.currentTime = 0;
                intermissionSound.play();
                wakkaSound.pause();
                ghostAmbientSound.pause();
                // Set playlist music volume lower when paused
                setPlaylistVolume(BACKGROUND_MUSIC_VOLUME * PAUSED_MUSIC_VOLUME_MULTIPLIER);
            } else {
                intermissionSound.pause();
                setPlaylistVolume(BACKGROUND_MUSIC_VOLUME);
                if (document.body.classList.contains('ghost-vulnerable')) {
                    ghostAmbientSound.play();
                }
            }
        };
        document.body.appendChild(btn);
    }

    /**
     * Show a countdown overlay (3, 2, 1, GO!) before starting a level.
     * @param {function} onComplete - Called when countdown finishes
     */
    function showCountdown(onComplete) {
        const overlay = document.createElement('div');
        const cdFontFamily = LEGACY_NUMBER_FONT;

        overlay.id = 'countdown-overlay';
        overlay.style.position = 'fixed';
        overlay.style.left = '0'; overlay.style.top = '0';
        overlay.style.width = '100vw'; overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '5000';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontFamily = cdFontFamily;

        const num = document.createElement('div');
        num.style.fontFamily = LEGACY_NUMBER_FONT;
        num.style.fontSize = upx(120) + 'px';
        num.style.fontWeight = 'bold';
        num.style.color = '#FFD700';
        num.style.textShadow = upx(6) + 'px ' + upx(6) + 'px ' + upx(20) + 'px #000';
        num.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        num.style.pointerEvents = 'none';
        overlay.appendChild(num);
        document.body.appendChild(overlay);

        // Show Puter sign-in during countdown (only if not already signed in and Puter is available)
        PuterIntegration.getCurrentUser().then(user => {
            if (user && user.username) {
                const badge = document.createElement('div');
                badge.style.marginTop = upx(20) + 'px';
                badge.style.fontFamily = LEGACY_NUMBER_FONT;
                badge.style.fontSize = upx(10) + 'px';
                badge.style.color = '#88ccff';
                badge.style.textAlign = 'center';
                badge.style.pointerEvents = 'none';
                badge.textContent = `☁️ Signed in as ${user.username}`;
                if (overlay.parentElement) overlay.appendChild(badge);
            } else if (PuterIntegration.isPuterAvailable()) {
                const signInBtn = document.createElement('button');
                signInBtn.style.marginTop = upx(20) + 'px';
                signInBtn.style.fontFamily = LEGACY_NUMBER_FONT;
                signInBtn.style.fontSize = upx(9) + 'px';
                signInBtn.style.color = '#0d1b2a';
                signInBtn.style.background = 'linear-gradient(135deg, #88ccff, #55aaee)';
                signInBtn.style.border = '1px solid rgba(136,204,255,0.4)';
                signInBtn.style.borderRadius = upx(8) + 'px';
                signInBtn.style.padding = upx(8) + 'px ' + upx(16) + 'px';
                signInBtn.style.cursor = 'pointer';
                signInBtn.style.fontWeight = 'bold';
                signInBtn.style.textAlign = 'center';
                signInBtn.style.boxShadow = '0 2px 12px rgba(85,170,238,0.3)';
                signInBtn.style.transition = 'filter 0.2s, transform 0.2s';
                signInBtn.textContent = '☁️ Sign in with Puter';
                signInBtn.onmouseenter = () => { signInBtn.style.filter = 'brightness(1.15)'; signInBtn.style.transform = 'scale(1.05)'; };
                signInBtn.onmouseleave = () => { signInBtn.style.filter = ''; signInBtn.style.transform = ''; };
                signInBtn.onclick = () => {
                    signInBtn.textContent = 'Signing in...';
                    signInBtn.style.cursor = 'wait';
                    signInBtn.disabled = true;
                    PuterIntegration.signIn().then(signedUser => {
                        if (signedUser && signedUser.username) {
                            signInBtn.textContent = `☁️ Signed in as ${signedUser.username}`;
                            signInBtn.style.cursor = 'default';
                            signInBtn.style.background = 'rgba(136,204,255,0.15)';
                            signInBtn.style.color = '#88ccff';
                            signInBtn.style.border = '1px solid rgba(136,204,255,0.3)';
                            signInBtn.onclick = null;
                            signInBtn.onmouseenter = null;
                            signInBtn.onmouseleave = null;
                        } else {
                            signInBtn.textContent = '☁️ Sign in with Puter';
                            signInBtn.style.cursor = 'pointer';
                            signInBtn.disabled = false;
                        }
                    }).catch(() => {
                        signInBtn.textContent = '☁️ Sign in with Puter';
                        signInBtn.style.cursor = 'pointer';
                        signInBtn.disabled = false;
                    });
                };
                if (overlay.parentElement) overlay.appendChild(signInBtn);
        // iOS gyro permission prompt (standalone, not dependent on Puter)
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            const gyroBtn = document.createElement('button');
            gyroBtn.style.marginTop = upx(10) + 'px';
            gyroBtn.style.fontFamily = LEGACY_NUMBER_FONT;
            gyroBtn.style.fontSize = upx(9) + 'px';
            gyroBtn.style.color = '#0d1b2a';
            gyroBtn.style.background = 'linear-gradient(135deg, #88ff88, #55cc55)';
            gyroBtn.style.border = '1px solid rgba(136,255,136,0.4)';
            gyroBtn.style.borderRadius = upx(8) + 'px';
            gyroBtn.style.padding = upx(8) + 'px ' + upx(16) + 'px';
            gyroBtn.style.cursor = 'pointer';
            gyroBtn.style.fontWeight = 'bold';
            gyroBtn.style.textAlign = 'center';
            gyroBtn.style.boxShadow = '0 2px 12px rgba(85,204,85,0.3)';
            gyroBtn.style.transition = 'filter 0.2s, transform 0.2s';
            gyroBtn.textContent = '\ud83d\udcf1 Enable Tilt Controls';
            gyroBtn.onmouseenter = () => { gyroBtn.style.filter = 'brightness(1.15)'; gyroBtn.style.transform = 'scale(1.05)'; };
            gyroBtn.onmouseleave = () => { gyroBtn.style.filter = ''; gyroBtn.style.transform = ''; };
            gyroBtn.onclick = () => {
                gyroBtn.textContent = 'Requesting...';
                gyroBtn.disabled = true;
                DeviceOrientationEvent.requestPermission().then(perm => {
                    if (perm === 'granted') {
                        gyroBtn.textContent = '\u2705 Tilt Controls Enabled';
                        gyroBtn.style.background = 'rgba(136,255,136,0.15)';
                        gyroBtn.style.color = '#88ff88';
                        gyroBtn.style.border = '1px solid rgba(136,255,136,0.3)';
                        gyroBtn.onclick = null;
                        gyroBtn.onmouseenter = null;
                        gyroBtn.onmouseleave = null;
                    } else {
                        gyroBtn.textContent = '\u274c Permission Denied';
                        gyroBtn.style.color = '#ff8888';
                        gyroBtn.style.cursor = 'default';
                    }
                }).catch(() => {
                    gyroBtn.textContent = '\u274c Not Available';
                    gyroBtn.style.color = '#ff8888';
                    gyroBtn.style.cursor = 'default';
                });
            };
            if (overlay.parentElement) overlay.appendChild(gyroBtn);
        }
            }
        }).catch(() => {});

        let count = 10;
        function tick() {
            if (count > 0) {
                num.textContent = count;
                num.style.transform = 'scale(1.5)';
                num.style.opacity = '0';
                // Force reflow then animate in
                void num.offsetWidth;
                num.style.transform = 'scale(1)';
                num.style.opacity = '1';
                count--;
                setTimeout(tick, 800);
            } else {
                num.textContent = 'GO!';
                num.style.color = '#00FF00';
                num.style.transform = 'scale(1.5)';
                setTimeout(() => {
                    overlay.style.transition = 'opacity 0.3s ease';
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                        onComplete();
                    }, 300);
                }, 500);
            }
        }
        tick();
    }

    function showLevelSelector(onSelect) {
        const fontFamily = LEGACY_NUMBER_FONT;

        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.left = '0'; overlay.style.top = '0';
        overlay.style.width = '100vw'; overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,' + PAUSE_OVERLAY_OPACITY + ')';
        overlay.style.zIndex = '1000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontFamily = fontFamily;

        const box = document.createElement('div');
        box.style.background = '#111';
        box.style.color = '#FFD700';
        box.style.borderRadius = '16px';
        const bp = upx(32), bp2 = upx(24), bp3 = upx(16);
        box.style.padding = bp + 'px ' + bp2 + 'px ' + bp3 + 'px ' + bp2 + 'px';
        box.style.boxShadow = '0 2px 16px #0009';
        box.style.display = 'flex';
        box.style.flexDirection = 'column';
        box.style.alignItems = 'center';
        box.style.maxHeight = '80vh';
        box.style.overflow = 'auto';

        const label = document.createElement('div');
        label.textContent = "Select Level";
        label.style.fontWeight = 'bold';
        label.style.fontSize = upx(28) + 'px';
        label.style.marginBottom = upx(18) + 'px';
        box.appendChild(label);

        // Progression-aware level selector: show mastered levels + next unlocked
        const completedLevels = loadCompletedLevels();
        const totalLevels = Array.isArray(LEVELS) ? LEVELS.length : 1;
        const nextUnlocked = getNextUnlockedLevel(totalLevels);

        LEVELS.forEach((lvl, i) => {
            const isCompleted = completedLevels.includes(i);
            const isNext = (i === nextUnlocked);
            const isLocked = !isCompleted && !isNext;

            const btn = document.createElement('button');
            const labelPrefix = isCompleted ? '✅ ' : (isNext ? '▶ ' : '🔒 ');
            btn.textContent = labelPrefix + "Level " + (i + 1);
            btn.style.margin = upx(6) + 'px 0';
            btn.style.border = 'none';
            btn.style.borderRadius = upx(6) + 'px';
            if (isLocked) {
                btn.style.background = '#1a1a1a';
                btn.style.color = '#444';
                btn.style.cursor = 'not-allowed';
            } else if (isNext) {
                btn.style.background = '#FFD700';
                btn.style.color = '#111';
                btn.style.fontWeight = 'bold';
            } else {
                btn.style.background = '#21265B';
                btn.style.color = '#FFD700';
            }
            btn.style.fontSize = upx(18) + 'px';
            btn.style.cursor = isLocked ? 'not-allowed' : 'pointer';
            btn.style.padding = upx(10) + 'px ' + upx(26) + 'px';
            if (!isLocked) {
                btn.onmouseenter = () => btn.style.filter = `brightness(${MENU_BUTTON_HOVER_BRIGHTNESS})`;
                btn.onmouseleave = () => btn.style.filter = "";
            }
            btn.onclick = () => {
                if (isLocked) return; // Can't select locked levels
                if (!audioInitialized) {
                    initAudio();
                }
                overlay.remove();
                // Show countdown before starting
                showCountdown(() => onSelect(i));
            };
            box.appendChild(btn);
        });

        const scoreTitle = document.createElement('div');
        scoreTitle.textContent = "HIGH SCORES";
        scoreTitle.style.fontWeight = 'bold';
        scoreTitle.style.fontSize = upx(28) + 'px';
        scoreTitle.style.marginTop = upx(30) + 'px';
        scoreTitle.style.marginBottom = upx(10) + 'px';
        box.appendChild(scoreTitle);

        const scoreTable = document.createElement('table');
        scoreTable.style.width = '100%';
        scoreTable.style.borderCollapse = 'collapse';
        scoreTable.style.marginBottom = '20px';
        
        const headerRow = document.createElement('tr');
        ["RANK", "NAME", "SCORE"].forEach(t => {
            const th = document.createElement('th');
            th.textContent = t;
            th.style.padding = upx(5) + 'px ' + upx(15) + 'px';
            headerRow.appendChild(th);
        });
        scoreTable.appendChild(headerRow);
        
        highScores.forEach((score, index) => {
            const row = document.createElement('tr');
            row.style.textAlign = 'center';
            [
                (index + 1),
                score.name,
                score.score
            ].forEach(t => {
                const td = document.createElement('td');
                td.textContent = t;
                row.appendChild(td);
            });
            scoreTable.appendChild(row);
        });
        box.appendChild(scoreTable);

        overlay.addEventListener('click', function (ev) {
            if (ev.target === overlay) overlay.remove();
        });
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    var createMap = function (scene, levelDefinition) {
        var map = {};
        map.bottom = -(levelDefinition.length - 1);
        map.top = 0;
        map.left = 0;
        map.right = 0;
        map.numDots = 0;
        map.pacmanSpawn = null;
        map.ghostSpawn = null;

        for (var row = 0; row < levelDefinition.length; row++) {
            var y = -row;
            map[y] = {};
            var length = Math.floor(levelDefinition[row].length / 2);
            map.right = Math.max(map.right, length);

            for (var column = 0; column < levelDefinition[row].length; column += 2) {
                var x = Math.floor(column / 2);
                var cell = levelDefinition[row][column];
                var object = null;

                if (cell === '#') {
                    object = createWall();
                } else if (cell === '.') {
                    object = createDot();
                    map.numDots += 1;
                } else if (cell === 'o') {
                    object = createPowerPellet();
                } else if (cell === 'P') {
                    map.pacmanSpawn = new THREE.Vector3(x, y, 0);
                } else if (cell === 'G') {
                    map.ghostSpawn = new THREE.Vector3(x, y, 0);
                }

                if (object !== null) {
                    object.position.set(x, y, 0);
                    map[y][x] = object;
                    scene.add(object);
                }
            }
        }
        map.centerX = (map.left + map.right) / 2;
        map.centerY = (map.bottom + map.top) / 2;

        // Fix: Provide fallback for pacmanSpawn and ghostSpawn if not found
        if (!map.pacmanSpawn) {
            // Scan maze for first empty or dot cell as fallback
            for (let row = 0; row < levelDefinition.length; row++) {
                for (let col = 0; col < levelDefinition[row].length; col += 2) {
                    const c = levelDefinition[row][col];
                    if (c === '.' || c === 'o' || c === ' ') {
                        map.pacmanSpawn = new THREE.Vector3(Math.floor(col / 2), -row, 0);
                        break;
                    }
                }
                if (map.pacmanSpawn) break;
            }
        }
        if (!map.ghostSpawn) {
            // Scan maze for first empty or dot cell as fallback
            for (let row = 0; row < levelDefinition.length; row++) {
                for (let col = levelDefinition[row].length - 2; col >= 0; col -= 2) {
                    const c = levelDefinition[row][col];
                    if (c === '.' || c === 'o' || c === ' ') {
                        map.ghostSpawn = new THREE.Vector3(Math.floor(col / 2), -row, 0);
                        break;
                    }
                }
                if (map.ghostSpawn) break;
            }
        }

        return map;
    };

    var getAt = function (map, position) {
        var x = Math.round(position.x), y = Math.round(position.y);
        return map[y] && map[y][x];
    }

    var isWall = function (map, position) {
        var cell = getAt(map, position);
        return cell && cell.isWall === true;
    };

    var removeAt = function (map, scene, position) {
        var x = Math.round(position.x), y = Math.round(position.y);
        if (map[y] && map[y][x]) {
            map[y][x].visible = false;
            scene.remove(map[y][x]);
        }
    }

    var createWall = function () {
        var wallGeometry = new THREE.BoxGeometry(1, 1, 1);
        var wallMaterial = new THREE.MeshLambertMaterial({
            color: WALL_COLOR,
            transparent: true,
            opacity: MAZE_OPACITY
        });
        return function () {
            var wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.isWall = true;
            return wall;
        };
    }();

    var createDot = function () {
        var dotGeometry = new THREE.SphereGeometry(DOT_RADIUS);
        var dotMaterial = new THREE.MeshPhongMaterial({ color: DOT_COLOR });
        return function () {
            var dot = new THREE.Mesh(dotGeometry, dotMaterial);
            dot.isDot = true;
            return dot;
        };
    }();

    var createPowerPellet = function () {
        var pelletGeometry = new THREE.SphereGeometry(PELLET_RADIUS, 12, 8);
        var pelletMaterial = new THREE.MeshPhongMaterial({ color: DOT_COLOR });
        return function () {
            var pellet = new THREE.Mesh(pelletGeometry, pelletMaterial);
            pellet.isPowerPellet = true;
            return pellet;
        };
    }();

    var createRenderer = function () {
        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setClearColor('black', 1.0);
        renderer.setSize(window.innerWidth, window.innerHeight);
        // Ensure the canvas is behind all HUD overlays
        renderer.domElement.style.position = 'fixed';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.zIndex = '0';
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    var createScene = function () {
        var scene = new THREE.Scene();
        scene.add(new THREE.AmbientLight(0x888888));
        var light = new THREE.SpotLight(SPOTLIGHT_COLOR, SPOTLIGHT_INTENSITY);
        light.position.set(0, 0, SPOTLIGHT_HEIGHT);
        scene.add(light);
        return scene;
    };

    var createHudCamera = function (map) {
        var halfWidth = (map.right - map.left) / 2, halfHeight = (map.top - map.bottom) / 2;
        var hudCamera = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, 1, 100);
        hudCamera.position.copy(new THREE.Vector3(map.centerX, map.centerY, 10));
        hudCamera.lookAt(new THREE.Vector3(map.centerX, map.centerY, 0));
        return hudCamera;
    };

    var renderHud = function (renderer, hudCamera, scene) {
        scene.children.forEach(function (object) {
            if (object.isWall !== true) object.scale.set(HUD_OBJECT_SCALE, HUD_OBJECT_SCALE, HUD_OBJECT_SCALE);
        });
        renderer.setScissorTest(true);
        renderer.setScissor(HUD_MARGIN, HUD_MARGIN, HUD_SIZE, HUD_SIZE);
        renderer.setViewport(HUD_MARGIN, HUD_MARGIN, HUD_SIZE, HUD_SIZE);
        renderer.render(scene, hudCamera);
        renderer.setScissorTest(false);
        scene.children.forEach(function (object) {
            object.scale.set(1, 1, 1);
        });
    };

    var createPacman = function () {
        var pacmanGeometries = [];
        var numFrames = 40;
        for (var i = 0; i < numFrames; i++) {
            let offset = (i / (numFrames - 1)) * Math.PI;
            var geometry = new THREE.SphereGeometry(PACMAN_RADIUS, 16, 16, offset, Math.PI * 2 - offset * 2);
            geometry.rotateX(Math.PI / 2);
            pacmanGeometries.push(geometry);
        }
        var pacmanMaterial = new THREE.MeshPhongMaterial({ color: 'yellow', side: THREE.DoubleSide });
        
        // GLTF Loader for 3D models
        const loader = new GLTFLoader();
        
        return function (scene, position) {
            const modelId = assetPrefs.pacmanModel;
            const modelDef = Assets.PACMAN_MODELS[modelId];
            
            // If using a GLTF model and not classic
            if (modelDef && modelDef.type === 'gltf' && modelDef.path) {
                // Return a placeholder, load model async
                const placeholder = new THREE.Mesh(
                    new THREE.SphereGeometry(PACMAN_RADIUS, 8, 8),
                    new THREE.MeshPhongMaterial({ color: 'yellow', transparent: true, opacity: 0.3 })
                );
                placeholder.position.copy(position);
                placeholder.isPacman = true;
                placeholder.isWrapper = true;
                placeholder.atePellet = false;
                placeholder.distanceMoved = 0;
                placeholder.direction = new THREE.Vector3(-1, 0, 0);
                placeholder.isModelLoading = true;
                placeholder.isJumping = false;
                placeholder.jumpStartTime = 0;
                placeholder.jumpHeight = JUMP_HEIGHT;
                placeholder.jumpDuration = JUMP_DURATION;
                placeholder.jumpCooldown = 0;
                placeholder.initialJumpRotation = 0;
                
                scene.add(placeholder);
                
                // Load the actual model asynchronously
                const fullPath = modelDef.path;
                Assets.loadSketchfabModel(fullPath, loader, function (gltf) {
                    const model = gltf.scene;
                    // Scale model to match existing pacman size
                    model.scale.set(PACMAN_RADIUS * 2, PACMAN_RADIUS * 2, PACMAN_RADIUS * 2);
                    // Rotate from Y-up (Sketchfab) to Z-up (game world)
                    model.rotation.x = -Math.PI / 2;
                    model.position.copy(placeholder.position);
                    
                    // Copy properties
                    model.isPacman = true;
                    model.isWrapper = true;
                    model.atePellet = false;
                    model.distanceMoved = 0;
                    model.direction = placeholder.direction;
                    model.isJumping = false;
                    model.jumpStartTime = 0;
                    model.jumpHeight = JUMP_HEIGHT;
                    model.jumpDuration = JUMP_DURATION;
                    model.jumpCooldown = 0;
                    model.initialJumpRotation = 0;
                    model.isModel = true;
                    
                    // Store reference
                    model.userData.originalScale = PACMAN_RADIUS * 2;
                    
                    // Remove placeholder and add model
                    scene.remove(placeholder);
                    scene.add(model);
                }, undefined, function (error) {
                    console.warn('Failed to load pacman model "' + fullPath + '", using classic sphere', error);
                    // Revert to classic
                    placeholder.material.opacity = 1;
                    placeholder.material.color.setHex(0xffff00);
                    placeholder.isModelLoading = false;
                    
                    // Add geometries for animation
                    placeholder.geometries = pacmanGeometries;
                    placeholder.currentFrame = 0;
                });
                
                return placeholder;
            }
            
            // Classic sphere-based pacman (default)
            var pacman = new THREE.Mesh(pacmanGeometries[0], pacmanMaterial);
            pacman.geometries = pacmanGeometries;
            pacman.currentFrame = 0;
            pacman.isPacman = true;
            pacman.isWrapper = true;
            pacman.atePellet = false;
            pacman.distanceMoved = 0;
            pacman.position.copy(position);
            pacman.direction = new THREE.Vector3(-1, 0, 0);
            
            pacman.isJumping = false;
            pacman.jumpStartTime = 0;
            pacman.jumpHeight = JUMP_HEIGHT;
            pacman.jumpDuration = JUMP_DURATION;
            pacman.jumpCooldown = 0;
            pacman.initialJumpRotation = 0;
            
            scene.add(pacman);
            return pacman;
        };
    }();    var createGhost = (() => {
        let eyeModel = null;
        let loader = new GLTFLoader();
        let colorIndex = 0;
        let ghostIdCounter = 0;

        let ghostModelLoader = null;

        return function (scene, position) {
            const ghostId = ++ghostIdCounter;
            const modelId = assetPrefs.ghostModel;
            const modelDef = Assets.GHOST_MODELS[modelId];

            // If using a GLTF ghost model
            if (modelDef && modelDef.type === 'gltf' && modelDef.path) {
                // Create placeholder while model loads
                const placeholder = new THREE.Mesh(
                    new THREE.SphereGeometry(GHOST_RADIUS, 8, 8),
                    new THREE.MeshPhongMaterial({
                        color: GHOST_COLORS[colorIndex % GHOST_COLORS.length],
                        transparent: true,
                        opacity: 0.3
                    })
                );
                placeholder.isGhost = true;
                placeholder.isWrapper = true;
                placeholder.isAfraid = false;
                placeholder.colorIndex = colorIndex % GHOST_COLORS.length;
                placeholder.position.copy(position);
                placeholder.direction = new THREE.Vector3(-1, 0, 0);
                placeholder.isModelLoading = true;
                placeholder._ghostId = ghostId;

                scene.add(placeholder);

                Assets.loadSketchfabModel(modelDef.path, loader, function (gltf) {
                    const model = gltf.scene;
                    model.scale.set(GHOST_RADIUS * 1.8, GHOST_RADIUS * 1.8, GHOST_RADIUS * 1.8);
                    // Rotate from Y-up (Sketchfab) to Z-up (game world)
                    model.rotation.x = -Math.PI / 2;
                    model.position.copy(placeholder.position);
                    model._ghostId = ghostId;

                    model.isGhost = true;
                    model.isWrapper = true;
                    model.isAfraid = false;
                    model.colorIndex = placeholder.colorIndex;
                    model.direction = placeholder.direction;
                    model.isModel = true;

                    // Apply ghost color tint if material exists
                    model.traverse(function(child) {
                        if (child.isMesh && child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    // Store original color for fright mode
                                    mat.userData = mat.userData || {};
                                    mat.userData.originalColor = mat.color ? mat.color.getHex() : null;
                                });
                            } else if (child.material.color) {
                                child.material.userData = child.material.userData || {};
                                child.material.userData.originalColor = child.material.color.getHex();
                            }
                        }
                    });

                    scene.add(model);

                    // Play ghost spawn sound
                    if (audioInitialized && ghostSfxSound) {
                        ghostSfxSound.currentTime = 0;
                        ghostSfxSound.play();
                    }
                    // Also play the ghost ambient if not already playing
                    if (audioInitialized && ghostAmbientSound && ghostAmbientSound.paused) {
                        ghostAmbientSound.currentTime = 0;
                        ghostAmbientSound.play();
                    }
                }, undefined, function (error) {
                    console.warn('Failed to load ghost model "' + modelDef.path + '", using classic sphere', error);
                    // Revert to classic sphere
                    placeholder.material.opacity = 0.9;
                    placeholder.isModelLoading = false;
                });

                colorIndex++;
                return placeholder;
            }

            // Classic sphere-based ghost
            let ghostGeometry = new THREE.SphereGeometry(GHOST_RADIUS, 16, 16);
            let color = GHOST_COLORS[colorIndex % GHOST_COLORS.length];
            let ghostMaterial = new THREE.MeshPhongMaterial({
                color: color,
                transparent: true,
                opacity: 0.9
            });
            const ghost = new THREE.Mesh(ghostGeometry, ghostMaterial);
            ghost.isGhost = true;
            ghost.isWrapper = true;
            ghost.isAfraid = false;
            ghost.colorIndex = colorIndex % GHOST_COLORS.length;
            ghost.position.copy(position);
            ghost.direction = new THREE.Vector3(-1, 0, 0);
            ghost._ghostId = ghostId;

            colorIndex++;
            scene.add(ghost);
            return ghost;
        };
    })();

    var wrapObject = function (object, map) {
        if (object.position.x < map.left)
            object.position.x = map.right;
        else if (object.position.x > map.right)
            object.position.x = map.left;
        if (object.position.y > map.top)
            object.position.y = map.bottom;
        else if (object.position.y < map.bottom)
            object.position.y = map.top;
    };

    var distance = function () {
        var difference = new THREE.Vector3();
        return function (object1, object2) {
            difference.copy(object1.position).sub(object2.position);
            return difference.length();
        };
    }();

    // Track current level's key listeners for cleanup
    var _currentKeyCleanup = null;

    var createKeyState = function () {
        // Remove previous level's key listeners to prevent stacking
        if (_currentKeyCleanup) {
            _currentKeyCleanup();
            _currentKeyCleanup = null;
        }

        var keyState = {};

        function onKeyDown(event) {
            // Ignore key repeat (held-down key auto-fires)
            if (event.repeat) return;
            keyState[event.keyCode] = true;
            keyState[String.fromCharCode(event.keyCode)] = true;
            if (event.key) keyState[event.key] = true;
            
            if (!audioInitialized) {
                initAudio();
            }
        }
        function onKeyUp(event) {
            keyState[event.keyCode] = false;
            keyState[String.fromCharCode(event.keyCode)] = false;
            if (event.key) keyState[event.key] = false;
        }
        function onBlur() {
            for (var key in keyState) {
                if (keyState.hasOwnProperty(key))
                    keyState[key] = false;
            }
        }
        function onVisibility() {
            if (document.hidden) {
                for (var key in keyState) {
                    if (keyState.hasOwnProperty(key))
                        keyState[key] = false;
                }
            }
        }

        document.body.addEventListener('keydown', onKeyDown);
        document.body.addEventListener('keyup', onKeyUp);
        document.body.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVisibility);

        // Store cleanup function for next level transition
        _currentKeyCleanup = function () {
            document.body.removeEventListener('keydown', onKeyDown);
            document.body.removeEventListener('keyup', onKeyUp);
            document.body.removeEventListener('blur', onBlur);
            document.removeEventListener('visibilitychange', onVisibility);
        };

        return keyState;
    };

    var animationLoop = function (callback, requestFrameFunction) {
        requestFrameFunction = requestFrameFunction || requestAnimationFrame;
        var previousFrameTime = window.performance.now();
        var animationSeconds = 0;
        var render = function () {
            var now = window.performance.now();
            var animationDelta = (now - previousFrameTime) / 1000;
            previousFrameTime = now;
            animationDelta = Math.min(animationDelta, 1 / 30);
            animationSeconds += animationDelta;
            callback(animationDelta, animationSeconds);
            requestFrameFunction(render);
        };
        requestFrameFunction(render);
    };

    /**
     * Show the game over screen with high scores table and Try Again button.
     * If the player's score is in the top-10, shows their entry highlighted.
     * @param {function} onRestart - Called when Try Again is clicked
     * @param {function} onMenu - Called when Level Select / Main Menu is clicked
     */
    function showGameOverScreen(onRestart, onMenu) {
        let existing = document.getElementById("play-again-overlay");
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        const goFontFamily = LEGACY_NUMBER_FONT;

        overlay.id = "play-again-overlay";
        overlay.style.position = 'fixed';
        overlay.style.left = 0;
        overlay.style.top = 0;
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.background = `rgba(0,0,0,${PLAY_AGAIN_OVERLAY_OPACITY})`;
        overlay.style.zIndex = 2000;
        overlay.style.fontFamily = goFontFamily;
        overlay.style.flexDirection = 'column';
        overlay.style.overflow = 'auto';

        const box = document.createElement('div');
        box.style.background = PLAY_AGAIN_BUTTON_BG;
        box.style.padding = upx(36) + 'px ' + upx(48) + 'px';
        box.style.borderRadius = upx(32) + 'px';
        box.style.display = 'flex';
        box.style.flexDirection = 'column';
        box.style.alignItems = 'center';
        box.style.gap = '12px';
        box.style.boxShadow = '0 2px 26px #0008';
        box.style.maxHeight = '90vh';
        box.style.overflow = 'auto';

        const msg = document.createElement('div');
        msg.textContent = "Game Over";
        msg.style.fontSize = (PLAY_AGAIN_BUTTON_FONT_SIZE + 6) + 'px';
        msg.style.fontWeight = 'bold';
        msg.style.marginBottom = '6px';
        msg.style.color = PLAY_AGAIN_BUTTON_COLOR;
        box.appendChild(msg);

        // Show final score
        const finalScore = document.createElement('div');
        finalScore.textContent = 'Score: ' + currentScore;
        finalScore.style.fontSize = upx(22) + 'px';
        finalScore.style.color = '#fff';
        finalScore.style.marginBottom = upx(16) + 'px';
        box.appendChild(finalScore);

        // High scores table
        const hsTitle = document.createElement('div');
        hsTitle.textContent = '🏆 HIGH SCORES';
        hsTitle.style.fontSize = upx(20) + 'px';
        hsTitle.style.fontWeight = 'bold';
        hsTitle.style.color = '#FFD700';
        hsTitle.style.marginBottom = upx(10) + 'px';
        box.appendChild(hsTitle);

        const hsTable = document.createElement('table');
        hsTable.style.width = '100%';
        hsTable.style.borderCollapse = 'collapse';
        hsTable.style.marginBottom = upx(20) + 'px';
        const hdrRow = document.createElement('tr');
        ['RANK', 'NAME', 'SCORE'].forEach(t => {
            const th = document.createElement('th');
            th.textContent = t;
            th.style.padding = upx(4) + 'px ' + upx(15) + 'px';
            th.style.fontSize = upx(14) + 'px';
            th.style.color = '#FFD700';
            hdrRow.appendChild(th);
        });
        hsTable.appendChild(hdrRow);
        highScores.forEach((s, idx) => {
            const row = document.createElement('tr');
            row.style.textAlign = 'center';
            // Highlight if this is the player's current score
            if (s.score === currentScore) {
                row.style.background = 'rgba(255,215,0,0.15)';
                row.style.fontWeight = 'bold';
            }
            [idx + 1, s.name, s.score].forEach(t => {
                const td = document.createElement('td');
                td.textContent = t;
                td.style.padding = upx(3) + 'px ' + upx(15) + 'px';
                td.style.fontSize = upx(14) + 'px';
                row.appendChild(td);
            });
            hsTable.appendChild(row);
        });
        box.appendChild(hsTable);

        // Try Again button
        const againBtn = document.createElement('button');
        againBtn.textContent = "🔄 TRY AGAIN";
        againBtn.style.fontSize = PLAY_AGAIN_BUTTON_FONT_SIZE + 'px';
        againBtn.style.color = PLAY_AGAIN_BUTTON_COLOR;
        againBtn.style.background = '#232e4a';
        againBtn.style.border = 'none';
        againBtn.style.borderRadius = PLAY_AGAIN_BUTTON_BORDER_RADIUS + 'px';
        againBtn.style.padding = upx(15) + 'px ' + upx(50) + 'px';
        againBtn.style.fontWeight = 'bold';
        againBtn.style.cursor = 'pointer';
        againBtn.style.marginBottom = '8px';
        againBtn.onmouseenter = () => againBtn.style.filter = `brightness(${PLAY_AGAIN_BUTTON_HOVER_BRIGHTNESS})`;
        againBtn.onmouseleave = () => againBtn.style.filter = '';
        againBtn.onclick = () => { overlay.remove(); onRestart(); };
        box.appendChild(againBtn);

        // Level Select button
        const menuBtn = document.createElement('button');
        menuBtn.textContent = "📋 Level Select";
        menuBtn.style.fontSize = Math.floor(PLAY_AGAIN_BUTTON_FONT_SIZE * 0.85) + 'px';
        menuBtn.style.color = PLAY_AGAIN_BUTTON_COLOR;
        menuBtn.style.background = '#162940';
        menuBtn.style.border = 'none';
        menuBtn.style.borderRadius = PLAY_AGAIN_BUTTON_BORDER_RADIUS + 'px';
        menuBtn.style.padding = upx(12) + 'px ' + upx(34) + 'px';
        menuBtn.style.fontWeight = 'bold';
        menuBtn.style.cursor = 'pointer';
        menuBtn.onmouseenter = () => menuBtn.style.filter = `brightness(${MENU_BACK_BUTTON_HOVER_BRIGHTNESS})`;
        menuBtn.onmouseleave = () => menuBtn.style.filter = '';
        menuBtn.onclick = () => { overlay.remove(); onMenu(); };
        box.appendChild(menuBtn);

        overlay.appendChild(box);
        overlay.addEventListener('click', function (ev) {
            if (ev.target === overlay) { overlay.remove(); onMenu(); }
        });
        document.body.appendChild(overlay);
    }



    /**
     * Show the loading screen with device-appropriate background and dancing banana.
     * Desktop: 'loading back.png', Mobile: 'loading+ back.png'
     * Shows dance-banana.gif with a loading message underneath.
     * Auto-transitions to onComplete after a minimum display time.
     * @param {function} onComplete - Called when loading is done
     * @param {number} minDisplayMs - Minimum time to show loading screen (default 2500ms)
     */
    function showLoadingScreen(onComplete, minDisplayMs) {
        minDisplayMs = minDisplayMs || 2500;
        const mobile = isMobileDevice();
        const bgKey = mobile ? 'loadingBackPlus' : 'loadingBackPng';
        const bgDef = Assets.INTRO_IMAGES[bgKey] || Assets.INTRO_IMAGES.loadingBackPng;
        const bananaDef = Assets.INTRO_IMAGES.danceBanana;
        const fontDef = Assets.FONTS[assetPrefs.font];
        const fontFamily = fontDef ? `'${fontDef.family}', monospace` : 'monospace';

        const loading = document.createElement('div');
        loading.id = 'pacman-loading';
        loading.style.position = 'fixed';
        loading.style.left = '0'; loading.style.top = '0';
        loading.style.width = '100vw'; loading.style.height = '100vh';
        loading.style.background = '#000';
        loading.style.zIndex = '9999';
        loading.style.display = 'flex';
        loading.style.flexDirection = 'column';
        loading.style.alignItems = 'center';
        loading.style.justifyContent = 'center';
        loading.style.overflow = 'hidden';

        // Background image (device-specific)
        if (bgDef && bgDef.path) {
            const bgImg = document.createElement('img');
            bgImg.src = bgDef.path;
            bgImg.style.position = 'absolute';
            bgImg.style.left = '0'; bgImg.style.top = '0';
            bgImg.style.width = '100%';
            bgImg.style.height = '100%';
            bgImg.style.objectFit = 'cover';
            bgImg.style.opacity = '0.5';
            bgImg.style.filter = 'brightness(0.4)';
            bgImg.onerror = () => { bgImg.style.display = 'none'; };
            loading.appendChild(bgImg);
        }

        // Title
        const ts = upx(64);
        const title = document.createElement('h1');
        title.textContent = 'PAC-MAN 3D';
        title.style.fontFamily = fontFamily;
        title.style.fontSize = ts + 'px';
        title.style.color = '#FFD700';
        title.style.textShadow = upx(4) + 'px ' + upx(4) + 'px ' + upx(12) + 'px #000, 0 0 ' + upx(40) + 'px rgba(255,215,0,0.3)';
        title.style.zIndex = '2';
        title.style.margin = '0';
        title.style.letterSpacing = upx(6) + 'px';
        loading.appendChild(title);

        // Dancing banana GIF
        if (bananaDef && bananaDef.path) {
            const banana = document.createElement('img');
            banana.src = bananaDef.path;
            banana.style.zIndex = '2';
            banana.style.marginTop = upx(30) + 'px';
            const bs = mobile ? upx(120) : upx(160);
            banana.style.width = bs + 'px';
            banana.style.height = 'auto';
            banana.style.maxHeight = bs + 'px';
            banana.style.objectFit = 'contain';
            banana.style.borderRadius = upx(12) + 'px';
            banana.style.boxShadow = '0 0 ' + upx(30) + 'px rgba(255,215,0,0.2)';
            banana.onerror = () => { banana.style.display = 'none'; };
            loading.appendChild(banana);
        }

        // Loading message under banana
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'loading-message';
        loadingMsg.style.zIndex = '2';
        loadingMsg.style.marginTop = upx(20) + 'px';
        loadingMsg.style.fontFamily = fontFamily;
        loadingMsg.style.fontSize = upx(20) + 'px';
        loadingMsg.style.color = '#FFD700';
        loadingMsg.style.textShadow = upx(2) + 'px ' + upx(2) + 'px ' + upx(6) + 'px #000';
        loadingMsg.style.textAlign = 'center';
        loadingMsg.textContent = 'Loading...';
        loading.appendChild(loadingMsg);

        // Loading progress bar
        const barContainer = document.createElement('div');
        barContainer.style.zIndex = '2';
        barContainer.style.marginTop = upx(15) + 'px';
        barContainer.style.width = upx(240) + 'px';
        barContainer.style.height = upx(8) + 'px';
        barContainer.style.background = 'rgba(255,255,255,0.15)';
        barContainer.style.borderRadius = upx(4) + 'px';
        barContainer.style.overflow = 'hidden';
        const bar = document.createElement('div');
        bar.style.width = '0%';
        bar.style.height = '100%';
        bar.style.background = 'linear-gradient(90deg, #FFD700, #FFA500)';
        bar.style.borderRadius = upx(4) + 'px';
        bar.style.transition = 'width 0.3s ease';
        barContainer.appendChild(bar);
        loading.appendChild(barContainer);

        // Inject pulse animation if not already present
        if (!document.getElementById('splash-style')) {
            const style = document.createElement('style');
            style.id = 'splash-style';
            style.textContent = `@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
@keyframes loadingpulse { 0%,100%{opacity:0.6} 50%{opacity:1} }`;
            document.head.appendChild(style);
        }
        loadingMsg.style.animation = 'loadingpulse 1.5s ease-in-out infinite';

        document.body.appendChild(loading);

        // Initialize Puter auth before game start (non-blocking)
        PuterIntegration.getCurrentUser().then(user => {
            if (user && user.username) {
                const puterBadge = document.createElement('div');
                puterBadge.style.zIndex = '2';
                puterBadge.style.marginTop = upx(10) + 'px';
                puterBadge.style.fontFamily = LEGACY_NUMBER_FONT;
                puterBadge.style.fontSize = upx(10) + 'px';
                puterBadge.style.color = '#88ccff';
                puterBadge.style.textAlign = 'center';
                puterBadge.textContent = `☁️ Signed in as ${user.username}`;
                if (loading.parentElement) loading.appendChild(puterBadge);
            }
        }).catch(() => {});

        // Play intro sound
        try {
            const introAudio = new Audio(Assets.SFX.intro.path);
            introAudio.volume = 0.5;
            introAudio.play().catch(() => {});
        } catch (e) {}

        // Real asset preloading + simulated progress
        let progress = 0;
        const loadingMessages = [
            'Loading...', 'Preparing maze...', 'Waking up ghosts...',
            'Polishing dots...', 'Ready!'
        ];

        // Collect critical images to preload
        const criticalImages = [
            bgDef ? bgDef.path : null,
            bananaDef ? bananaDef.path : null,
            Assets.PACMAN_IMAGES.pacmanGif ? Assets.PACMAN_IMAGES.pacmanGif.path : null,
            Assets.GHOST_IMAGES.kinky ? Assets.GHOST_IMAGES.kinky.path : null,
        ].filter(Boolean);

        let imagesLoaded = 0;
        const totalImages = criticalImages.length;

        function updateProgress() {
            if (transitioned) return;
            // Blend real image loading progress with simulated progress
            const realProgress = totalImages > 0 ? (imagesLoaded / totalImages) * 60 : 60;
            progress = Math.max(progress, realProgress);
            progress = Math.min(100, progress + Math.random() * 8 + 2);
            bar.style.width = progress + '%';
            const msgIdx = Math.min(loadingMessages.length - 1, Math.floor(progress / 25));
            loadingMsg.textContent = loadingMessages[msgIdx];
            if (progress >= 100) {
                loadingMsg.textContent = loadingMessages[loadingMessages.length - 1];
            }
        }

        const progressInterval = setInterval(updateProgress, 200);

        // Preload critical images
        criticalImages.forEach(src => {
            const img = new Image();
            img.onload = () => { imagesLoaded++; updateProgress(); };
            img.onerror = () => { imagesLoaded++; updateProgress(); }; // Count errors as loaded
            img.src = src;
        });

        // Preload audio (fire and forget)
        try {
            new Audio(Assets.SFX.beginning.path).preload = 'auto';
        } catch (e) {}

        // Auto-transition after minimum display time
        let transitioned = false;
        function transition() {
            if (transitioned) return;
            transitioned = true;
            clearInterval(progressInterval);
            bar.style.width = '100%';
            loading.style.transition = 'opacity 0.6s ease';
            loading.style.opacity = '0';
            setTimeout(() => { loading.remove(); onComplete(); }, 600);
        }

        // Allow click/space to skip after half the minimum time
        let canSkip = false;
        setTimeout(() => { canSkip = true; }, minDisplayMs / 2);
        function onSkip(e) {
            if (!canSkip) return;
            if (e.key === ' ' || e.key === 'Enter' || e.type === 'click') {
                transition();
                loading.removeEventListener('click', onSkip);
                window.removeEventListener('keydown', onSkip);
            }
        }
        loading.addEventListener('click', onSkip);
        window.addEventListener('keydown', onSkip);

        // Auto-advance after min display time
        setTimeout(transition, minDisplayMs);
    }

    var main = function (prefs) {
        if (prefs) {
            assetPrefs = { ...Assets.loadPreferences(), ...prefs };
            Assets.savePreferences(assetPrefs);
            MUSIC_PLAYLIST = Assets.getMusicPlaylist();

            // If legacy style, force classic sphere for both pacman and ghost
            if (assetPrefs.style === 'legacy') {
                assetPrefs.pacmanModel = 'classic';
                assetPrefs.ghostModel = 'classic';
            }
        }
        initGame();
        createPauseButton();
        // Lives and extra life tracking persist across levels within a game session
        var gameLives = PLAYER_START_LIVES;
        var gameExtraLivesAwarded = 0;
        let rendererInstance = null; // To keep track of the current renderer

        // Add tweakable for next level auto-advance win delay
        /**
         * Number of seconds to wait after winning before automatically starting the next level.
         * Set to 0 for instant transition.
         */
        /* @tweakable Win next-level transition delay (seconds, 0 = instant next level) */
        const NEXTLEVEL_DELAY_AFTER_WIN = 0; 

        let _lastAIRequestTime = 0; // Track last AI strategy request time (avoids global on window)

        function startLevel(levelIndex) {
            // Clear AI ghost strategy cache when starting a new level
            PuterIntegration.clearAIGhostCache();
            // If a renderer from a previous level exists, clean up
            if (rendererInstance) {
                // Remove old resize listener to prevent stacking
                if (rendererInstance._onResize) {
                    window.removeEventListener('resize', rendererInstance._onResize);
                }
                if (rendererInstance.domElement && rendererInstance.domElement.parentElement) {
                    rendererInstance.domElement.remove();
                }
            }
            currentLevelIndex = levelIndex;
            
            if (audioInitialized) {
                beginningSound.currentTime = 0; 
                beginningSound.play();
            }
            
            const keys = createKeyState();
            var controlMode = assetPrefs.controlMode || 'both';
            var joystick = (ENABLE_JOYSTICK && (controlMode === 'joystick' || controlMode === 'both' || !isMobileDevice())) ? new VirtualJoystick() : null;
            var gyro = (ENABLE_GYRO && isMobileDevice() && (controlMode === 'gyro' || controlMode === 'both')) ? new GyroController() : null;
            var touchJumpRequested = false;

            // Create touch jump button for mobile devices
            if (isMobileDevice()) {
                const jumpBtn = document.createElement('button');
                jumpBtn.id = 'touch-jump-btn';
                jumpBtn.innerText = '\u2B06';
                jumpBtn.style.position = 'fixed';
                jumpBtn.style.right = upx(90) + 'px';
                jumpBtn.style.bottom = upx(20) + 'px';
                jumpBtn.style.width = upx(60) + 'px';
                jumpBtn.style.height = upx(60) + 'px';
                jumpBtn.style.borderRadius = '50%';
                jumpBtn.style.background = 'rgba(255, 215, 0, 0.5)';
                jumpBtn.style.border = '2px solid rgba(255, 215, 0, 0.8)';
                jumpBtn.style.color = '#fff';
                jumpBtn.style.fontSize = upx(24) + 'px';
                jumpBtn.style.cursor = 'pointer';
                jumpBtn.style.zIndex = '50';
                jumpBtn.style.touchAction = 'none';
                jumpBtn.style.userSelect = 'none';
                jumpBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    touchJumpRequested = true;
                }, { passive: false });
                jumpBtn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    touchJumpRequested = false;
                }, { passive: false });
                jumpBtn.addEventListener('touchcancel', () => { touchJumpRequested = false; });
                document.body.appendChild(jumpBtn);
            }

            var renderer = createRenderer();
            rendererInstance = renderer; // Store the new renderer instance
            var scene = createScene();
            // Determine if this is a challenge level (every 5th level)
            const isChallenge = ((levelIndex + 1) % 5 === 0);
            const challengeIdx = isChallenge ? Math.floor(levelIndex / 5) % CHALLENGE_LEVELS.length : 0;
            const levelDef = isChallenge ? CHALLENGE_LEVELS[challengeIdx] : LEVELS[levelIndex];
            const effectivePowerPelletDuration = isChallenge ? POWER_PELLET_DURATION * 2 : POWER_PELLET_DURATION;
            const challengeFruitMax = isChallenge ? (5 + Math.floor(Math.random() * 6)) : 0; // 5-10 random fruit

            var map = createMap(scene, levelDef); 
            var numDotsEaten = 0;
            var camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.up.copy(UP);
            camera.targetPosition = new THREE.Vector3();
            camera.targetLookAt = new THREE.Vector3();
            camera.lookAtPosition = new THREE.Vector3();

            // Handle window resize: update renderer and camera
            function onWindowResize() {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
            window.addEventListener('resize', onWindowResize);
            // Store reference for cleanup when starting next level
            renderer._onResize = onWindowResize;

            var hudCamera = createHudCamera(map);
            var pacman = createPacman(scene, map.pacmanSpawn);
            var ghostSpawnTime = -GHOST_RESPAWN_TIME;
            var numGhosts = 0;
            var won = false;
            var lost = false;
            var remove = [];
            var lives = gameLives; // Use persistent lives from game session
            var extraLivesAwarded = gameExtraLivesAwarded; // Use persistent counter
            var livesContainer = document.getElementById('lives');
            livesContainer.innerHTML = '';

            // Use selected pacman image for lives if available
            const pacImageId = assetPrefs.pacmanImage;
            const pacImageDef = Assets.PACMAN_IMAGES[pacImageId];
            
            function createLifeDisplay() {
                if (pacImageDef && pacImageDef.path) {
                    const ls = upx(28);
                    return `<img class="life" src="${pacImageDef.path}" alt="life" style="width:${ls}px;height:${ls}px;object-fit:contain;image-rendering:pixelated;" />`;
                }
                return `<svg class="svg-life" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="yellow"/><polygon points="16,16 32,8 32,24" fill="white"/></svg>`;
            }
            for (var i = 0; i < lives; i++) {
                var life = document.createElement('span');
                life.innerHTML = createLifeDisplay();
                life.className = 'life';
                livesContainer.appendChild(life);
            }

            // Extra life system: award bonus life at score thresholds
            // Levels 1-50: every 10,000 pts. After level 50: every 20,000 pts.
            function _checkExtraLife(now) {
                var threshold = getExtraLifeThreshold(currentLevelIndex, extraLivesAwarded);
                if (currentScore >= threshold) {
                    extraLivesAwarded++;
                    lives++;
                    // Add a new life icon to the display
                    var newLife = document.createElement('span');
                    newLife.innerHTML = createLifeDisplay();
                    newLife.className = 'life';
                    livesContainer.appendChild(newLife);
                    showText('+1 LIFE!', 1.2, now);
                    if (audioInitialized && extraPacSound) {
                        extraPacSound.currentTime = 0;
                        extraPacSound.play();
                    }
                }
            }

            // Remove old ghost indicator if it exists (from previous level)
            // Clean up touch jump button from previous level
            const oldJumpBtn = document.getElementById('touch-jump-btn');
            if (oldJumpBtn) oldJumpBtn.remove();
            // Clean up gyro controller from previous level
            if (gyro && gyro.destroy) gyro.destroy();

            const oldIndicator = document.getElementById('ghost-indicator');
            if (oldIndicator) oldIndicator.remove();

            // Ghost indicator HUD element (shows selected ghost image with count)
            const ghostImageId = assetPrefs.ghostImage;
            const ghostImageDef = Assets.GHOST_IMAGES[ghostImageId];
            let ghostIndicatorEl = document.createElement('div');
            ghostIndicatorEl.id = 'ghost-indicator';
            ghostIndicatorEl.style.position = 'fixed';
            ghostIndicatorEl.style.left = upx(20) + 'px';
            ghostIndicatorEl.style.bottom = upx(15) + 'px';
            ghostIndicatorEl.style.zIndex = '10';
            ghostIndicatorEl.style.display = 'flex';
            ghostIndicatorEl.style.alignItems = 'center';
            ghostIndicatorEl.style.gap = upx(8) + 'px';
            ghostIndicatorEl.style.background = 'rgba(0,0,0,0.5)';
            ghostIndicatorEl.style.padding = upx(6) + 'px ' + upx(14) + 'px ' + upx(6) + 'px ' + upx(10) + 'px';
            ghostIndicatorEl.style.borderRadius = upx(20) + 'px';
            ghostIndicatorEl.style.border = '1px solid rgba(49,74,189,0.3)';
            ghostIndicatorEl.style.transition = 'opacity 0.3s, transform 0.3s';
            ghostIndicatorEl.style.opacity = '0';
            ghostIndicatorEl.style.transform = 'translateY(10px)';
            ghostIndicatorEl.style.pointerEvents = 'none';
            if (ghostImageDef && ghostImageDef.path) {
                const gs = upx(24), gfs = upx(16);
                ghostIndicatorEl.innerHTML = `
                    <img src="${ghostImageDef.path}" alt="" style="width:${gs}px;height:${gs}px;object-fit:contain;image-rendering:pixelated;" />
                    <span id="ghost-count" style="color:#FFD700;font-size:${gfs}px;font-weight:bold;">0</span>
                `;
            } else {
                ghostIndicatorEl.innerHTML = `<span style="color:#FFD700;font-size:${upx(12)}px;">👻 <span id="ghost-count">0</span></span>`;
            }
            document.body.appendChild(ghostIndicatorEl);

            function updateGhostIndicator(count) {
                const countEl = document.getElementById('ghost-count');
                if (countEl) countEl.textContent = count;
                if (count > 0) {
                    ghostIndicatorEl.style.opacity = '1';
                    ghostIndicatorEl.style.transform = 'translateY(0)';
                } else {
                    ghostIndicatorEl.style.opacity = '0';
                    ghostIndicatorEl.style.transform = 'translateY(10px)';
                }
            }

            function flashGhostIndicator() {
                // Disable transition temporarily for instant scale-up
                ghostIndicatorEl.style.transition = 'none';
                ghostIndicatorEl.style.transform = 'scale(1.15)';
                // Force reflow so the no-transition scale-up takes effect immediately
                void ghostIndicatorEl.offsetWidth;
                // Re-enable transition for smooth scale-down
                ghostIndicatorEl.style.transition = 'opacity 0.3s, transform 0.3s';
                ghostIndicatorEl.style.transform = 'scale(1)';
            }

            // Remove old minimap ghost icons container if it exists (from previous level)
            const oldMinimapIcons = document.getElementById('minimap-ghost-icons');
            if (oldMinimapIcons) oldMinimapIcons.remove();

            // Minimap ghost icons overlay — small images positioned over the minimap
            const minimapIconSize = upx(18);
            const minimapIconsEl = document.createElement('div');
            minimapIconsEl.id = 'minimap-ghost-icons';
            minimapIconsEl.style.position = 'fixed';
            minimapIconsEl.style.left = HUD_MARGIN + 'px';
            minimapIconsEl.style.bottom = HUD_MARGIN + 'px';
            minimapIconsEl.style.width = HUD_SIZE + 'px';
            minimapIconsEl.style.height = HUD_SIZE + 'px';
            minimapIconsEl.style.zIndex = '5';
            minimapIconsEl.style.pointerEvents = 'none';
            document.body.appendChild(minimapIconsEl);

            // Track which ghost IDs we already have icons for
            let _minimapIcons = {};

            function updateMinimapGhostIcons() {
                const mazeWidth = map.right - map.left;
                const mazeHeight = map.top - map.bottom;
                if (mazeWidth <= 0 || mazeHeight <= 0) return;

                const ghostImagePath = ghostImageDef && ghostImageDef.path;

                // Collect all ghost IDs currently in scene
                const activeGhostIds = new Set();
                scene.children.forEach(function (obj) {
                    if (obj.isGhost && obj._ghostId != null) {
                        activeGhostIds.add(obj._ghostId);

                        // Map ghost world position to minimap pixel coordinates
                        const px = ((obj.position.x - map.left) / mazeWidth) * HUD_SIZE;
                        const py = ((obj.position.y - map.bottom) / mazeHeight) * HUD_SIZE;
                        const iconSize = obj.isAfraid ? minimapIconSize + 4 : minimapIconSize;

                        let iconEl = _minimapIcons[obj._ghostId];
                        if (!iconEl) {
                            iconEl = document.createElement('img');
                            if (ghostImagePath) {
                                iconEl.src = ghostImagePath;
                            } else {
                                // Fallback: colored circle (width/height set below)
                                iconEl.style.borderRadius = '50%';
                                iconEl.style.background = GHOST_COLORS[obj.colorIndex % GHOST_COLORS.length];
                                iconEl.style.border = '1px solid rgba(255,255,255,0.3)';
                            }
                            iconEl.style.position = 'absolute';
                            iconEl.style.width = iconSize + 'px';
                            iconEl.style.height = iconSize + 'px';
                            iconEl.style.objectFit = 'contain';
                            iconEl.style.imageRendering = 'pixelated';
                            iconEl.style.transition = 'left 0.15s linear, bottom 0.15s linear, width 0.2s, height 0.2s';
                            iconEl.style.borderRadius = '2px';
                            minimapIconsEl.appendChild(iconEl);
                            _minimapIcons[obj._ghostId] = iconEl;
                        }

                        // Update position and size
                        iconEl.style.left = (px - iconSize / 2) + 'px';
                        iconEl.style.bottom = (py - iconSize / 2) + 'px';
                        iconEl.style.width = iconSize + 'px';
                        iconEl.style.height = iconSize + 'px';
                        iconEl.style.opacity = obj.isModelLoading ? '0.4' : '1';
                    }
                });

                // Remove icons for ghosts that are no longer in the scene
                Object.keys(_minimapIcons).forEach(function (id) {
                    if (!activeGhostIds.has(Number(id))) {
                        const el = _minimapIcons[id];
                        if (el && el.parentElement) el.parentElement.removeChild(el);
                        delete _minimapIcons[id];
                    }
                });
            }

            let scoreDisplay = document.createElement('div');
            scoreDisplay.id = 'score-display';
            scoreDisplay.style.position = 'fixed';
            scoreDisplay.style.right = upx(20) + 'px';
            scoreDisplay.style.top = upx(15) + 'px';
            scoreDisplay.style.zIndex = '10';
            // Score display always uses legacy arcade font for numbers
            scoreDisplay.style.color = SCORE_COLOR;
            scoreDisplay.style.fontSize = SCORE_FONT_SIZE + 'px';
            scoreDisplay.style.fontWeight = 'bold';
            scoreDisplay.style.textShadow = '2px 2px 4px #000';
            scoreDisplay.style.fontFamily = LEGACY_NUMBER_FONT;
            scoreDisplay.innerHTML = 'SCORE: 0';
            document.body.appendChild(scoreDisplay);

            let jumpIndicator = document.createElement('div');
            jumpIndicator.id = 'jump-indicator';
            jumpIndicator.style.position = 'fixed';
            jumpIndicator.style.right = JUMP_INDICATOR_RIGHT + 'px';
            jumpIndicator.style.bottom = JUMP_INDICATOR_BOTTOM + 'px';
            jumpIndicator.style.fontSize = JUMP_INDICATOR_FONT_SIZE + 'px';
            jumpIndicator.style.zIndex = '10';
            jumpIndicator.style.color = JUMP_INDICATOR_COLOR;
            jumpIndicator.style.fontSize = JUMP_INDICATOR_FONT_SIZE + 'px';
            jumpIndicator.style.padding = JUMP_INDICATOR_PADDING;
            jumpIndicator.style.borderRadius = '5px';
            jumpIndicator.style.background = `rgba(0, 0, 0, ${JUMP_INDICATOR_BG_OPACITY})`;
            jumpIndicator.style.textShadow = '1px 1px 2px #000';
            jumpIndicator.style.fontFamily = LEGACY_NUMBER_FONT;
            jumpIndicator.innerHTML = isMobileDevice() ? 'TAP ⬆ to Jump' : 'SPACE to Jump';
            document.body.appendChild(jumpIndicator);

            currentScore = 0;
            updateScore(0);

            var _lookAt = new THREE.Vector3();

            var updatePacman = function (delta, now) {
                if (isPaused) return;
                if (!won && !lost) movePacman(delta, now);
                
                if (pacman.isJumping) {
                    const jumpProgress = (now - pacman.jumpStartTime) / pacman.jumpDuration;
                    
                    if (jumpProgress >= 1) {
                        pacman.isJumping = false;
                        pacman.position.z = 0;
                        if (JUMP_ROTATE) {
                            pacman.rotation.z = 0;
                        }
                    } else {
                        const halfwayPoint = 0.5;
                        let jumpHeight;
                        if (jumpProgress < halfwayPoint) {
                            jumpHeight = pacman.jumpHeight * Math.sin((jumpProgress / halfwayPoint) * (Math.PI / 2));
                        } else {
                            const fallProgress = (jumpProgress - halfwayPoint) / halfwayPoint;
                            jumpHeight = pacman.jumpHeight * Math.cos(fallProgress * (Math.PI / 2) * JUMP_GRAVITY_MULTIPLIER);
                        }
                        pacman.position.z = Math.max(0, jumpHeight); 
                        
                        if (JUMP_ROTATE) {
                            const rotation = pacman.initialJumpRotation + 
                                (jumpProgress * JUMP_ROTATION_DEGREES * Math.PI / 180);
                            pacman.rotation.z = rotation;
                        }
                    }
                }
                
                if (pacman.jumpCooldown > 0) {
                    pacman.jumpCooldown = Math.max(0, pacman.jumpCooldown - delta);
                    if (pacman.jumpCooldown === 0) {
                        jumpIndicator.style.color = JUMP_INDICATOR_COLOR; 
                    } else {
                        jumpIndicator.style.color = JUMP_INDICATOR_COOLDOWN_COLOR;
                    }
                }
                
                if (!won && numDotsEaten === map.numDots) {
                    won = true;
                    wonTime = now; // FIX: Ensures wonTime is defined!
                    showText('You won =D', 1, now);
                    if (audioInitialized) {
                        extraPacSound.currentTime = 0; 
                        extraPacSound.play();
                    }
                updateScore(SCORE_LEVEL_COMPLETE);
                _checkExtraLife(now);
                
                if (audioInitialized && playlistAudios && playlistAudios.length > 0) {
                        stopAllPlaylistMusic(true);
                    }

                    // Mark this level as completed (mastered)
                    markLevelCompleted(currentLevelIndex);

                    // ---- Advance to next unmastered level after win ----
                    const totalLevels = Array.isArray(LEVELS) ? LEVELS.length : 1;
                    let nextLevelIndex = currentLevelIndex + 1;
                    if (nextLevelIndex >= totalLevels) {
                        // Loop to first unmastered level on win of last one
                        nextLevelIndex = getNextUnlockedLevel(totalLevels);
                    }
                    // Sync persistent lives before transitioning to next level
                    gameLives = lives;
                    gameExtraLivesAwarded = extraLivesAwarded;
                    // Use immediate/as-fast-as-possible transition after win ("You won") message
                    setTimeout(() => {
                        startLevel(nextLevelIndex);
                    }, NEXTLEVEL_DELAY_AFTER_WIN * 1000);
                    // Immediately return so we don't try to show selector below (old behavior)
                    return;
                }
                // Remove or prevent old "showLevelSelector" on win
                /*
                if (won && now - wonTime > WON_TEXT_TIME) {
                    showLevelSelector(function(idx) { startLevel(idx); });
                }
                */
                if (lives > 0 && lost && lostTime !== undefined && now - lostTime > RESPAWN_DELAY) {
                    lost = false;
                    lostTime = undefined;
                    pacman.position.copy(map.pacmanSpawn);
                    pacman.direction.copy(LEFT);
                    pacman.distanceMoved = 0;
                }
                if (pacman.isModel) {
                    // For 3D models, simply bob/rotate instead of mouth animation
                    if (lost) {
                        pacman.rotation.x += delta * PACMAN_DEATH_ANIMATION_SPEED * 2;
                    } else {
                        // Gentle sway animation
                        const bobAmount = Math.sin(pacman.distanceMoved * 3) * 0.08;
                        pacman.position.z = Math.max(0, bobAmount);
                    }
                } else if (pacman.geometries) {
                    if (lost) {
                        var angle = (now - lostTime) * Math.PI / 2 * PACMAN_DEATH_ANIMATION_SPEED;
                        var frame = Math.min(pacman.geometries.length - 1, Math.floor(angle / Math.PI * pacman.geometries.length));
                        pacman.geometry = pacman.geometries[frame];
                    } else {
                        var maxAngle = Math.PI / 4;
                        var angle = (pacman.distanceMoved * 2 * PACMAN_ANIMATION_SPEED) % (maxAngle * 2);
                        if (angle > maxAngle) angle = maxAngle * 2 - angle;
                        var frame = Math.floor(angle / Math.PI * pacman.geometries.length);
                        pacman.geometry = pacman.geometries[frame];
                    }
                }
            };

            // ---- FIX LOST BUG & DEFINE lostTime/WON LOGIC ----
            let wonTime = undefined;
            let lostTime = undefined; // ADD this variable to fix the lostTime error

            function createGhostEatenEffect(position, color, scene, removeList, now) {
                const group = new THREE.Group();
                group.position.copy(position);
                group.isTemporary = true;
                group.removeAfter = now + GHOST_EATEN_PARTICLE_DURATION;
                
                for (let i = 0; i < GHOST_EATEN_PARTICLE_COUNT; i++) {
                    const particle = new THREE.Mesh(
                        new THREE.SphereGeometry(GHOST_RADIUS * GHOST_PARTICLE_SIZE_MULTIPLIER),
                        new THREE.MeshPhongMaterial({ color: color })
                    );
                    
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI;
                    const r = GHOST_RADIUS * 0.8 * Math.random();
                    
                    particle.position.set(
                        r * Math.sin(phi) * Math.cos(theta),
                        r * Math.sin(phi) * Math.sin(theta),
                        r * Math.cos(phi)
                    );
                    
                    particle.userData.velocity = new THREE.Vector3(
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2,
                        Math.random() * 2
                    );
                    
                    group.add(particle);
                }
                
                group.userData.update = function(delta) {
                    group.children.forEach(particle => {
                        particle.position.add(particle.userData.velocity.clone().multiplyScalar(delta));
                        particle.userData.velocity.z -= delta * GHOST_PARTICLE_GRAVITY; 
                        particle.scale.multiplyScalar(0.95); 
                    });
                };
                
                scene.add(group);
                return group;
            }

            var moveGhost = function () {
                var previousPosition = new THREE.Vector3();
                var currentPosition = new THREE.Vector3();
                var leftTurn = new THREE.Vector3();
                var rightTurn = new THREE.Vector3();

                return function (ghost, delta) {
                    previousPosition.copy(ghost.position).addScaledVector(ghost.direction, 0.5).round();
                    ghost.translateOnAxis(ghost.direction, delta * GHOST_SPEED);
                    currentPosition.copy(ghost.position).addScaledVector(ghost.direction, 0.5).round();
                    if (!currentPosition.equals(previousPosition)) {
                        leftTurn.copy(ghost.direction).applyAxisAngle(UP, Math.PI / 2);
                        rightTurn.copy(ghost.direction).applyAxisAngle(UP, -Math.PI / 2);
                        var forwardWall = isWall(map, currentPosition);
                        var leftWall = isWall(map, currentPosition.copy(ghost.position).add(leftTurn));
                        var rightWall = isWall(map, currentPosition.copy(ghost.position).add(rightTurn));
                        if (!leftWall || !rightWall) {
                            var possibleTurns = [];
                            if (!forwardWall) possibleTurns.push(ghost.direction.clone());
                            if (!leftWall) possibleTurns.push(leftTurn.clone());
                            if (!rightWall) possibleTurns.push(rightTurn.clone());
                            if (possibleTurns.length === 0) throw new Error('A ghost got stuck!');
                            
                            // AI ghost strategy: if Puter AI is available, use its guidance
                            var aiAggression = GHOST_MOVEMENT_RANDOMNESS;
                            var aiTargetOffset = 0;
                            if (ghost._aiStrategy) {
                                aiAggression = ghost._aiStrategy.aggressionLevel;
                                aiTargetOffset = ghost._aiStrategy.targetOffset;
                            }
                            if (Math.random() < aiAggression || possibleTurns.length === 1) {
                                var newDirection;
                                // AI ambush mode: prefer direction toward predicted pacman position
                                if (ghost._aiStrategy && ghost._aiStrategy.mode === 'ambush' && !ghost.isAfraid) {
                                    // Predict pacman position offset ahead in movement direction
                                    var predicted = pacman.position.clone().addScaledVector(pacman.direction, aiTargetOffset);
                                    newDirection = possibleTurns.reduce(function(best, dir) {
                                        var bestDist = best ? predicted.clone().sub(ghost.position.clone().add(dir)).length() : Infinity;
                                        var dirDist = predicted.clone().sub(ghost.position.clone().add(dir)).length();
                                        return dirDist < bestDist ? dir : best;
                                    }, null);
                                } else if (ghost._aiStrategy && ghost._aiStrategy.mode === 'scatter') {
                                    // Scatter: pick random direction (go to corners)
                                    newDirection = possibleTurns[Math.floor(Math.random() * possibleTurns.length)];
                                } else {
                                    // Chase: prefer direction toward pacman
                                    if (!ghost.isAfraid && Math.random() < 0.7) {
                                        newDirection = possibleTurns.reduce(function(best, dir) {
                                            var bestDist = best ? pacman.position.clone().sub(ghost.position.clone().add(dir)).length() : Infinity;
                                            var dirDist = pacman.position.clone().sub(ghost.position.clone().add(dir)).length();
                                            return dirDist < bestDist ? dir : best;
                                        }, null);
                                    } else {
                                        newDirection = possibleTurns[Math.floor(Math.random() * possibleTurns.length)];
                                    }
                                }
                                ghost.direction.copy(newDirection || possibleTurns[0]);
                                ghost.position.round().addScaledVector(ghost.direction, delta);
                            }
                        }
                    }
                }
            }();

            var update = function (delta, now) {
                updatePacman(delta, now);
                updateCamera(delta, now);
                scene.children.forEach(function (object) {
                    if (object.isGhost === true) updateGhost(object, delta, now);
                    if (object.isWrapper === true) wrapObject(object, map);
                    if (object.isTemporary === true && now > object.removeAfter) remove.push(object);
                    if (object.userData && typeof object.userData.update === 'function') {
                        object.userData.update(delta);
                    }
                });
                remove.forEach(function(item) { 
                    scene.remove(item);
                });
                remove.length = 0; 

                if (numGhosts < MAX_GHOSTS && now - ghostSpawnTime > GHOST_RESPAWN_TIME) {
                    createGhost(scene, map.ghostSpawn);
                    numGhosts += 1;
                    ghostSpawnTime = now;
                    updateGhostIndicator(numGhosts);
                    flashGhostIndicator();
                }

                // Periodically request AI ghost strategy from Puter (every ~5 seconds)
                if (!_lastAIRequestTime || (now - _lastAIRequestTime) > 5) {
                    _lastAIRequestTime = now;
                    var nearestGhost = scene.children.find(c => c.isGhost);
                    PuterIntegration.getAIGhostStrategy({
                        pacmanPos: { x: pacman.position.x, y: pacman.position.y },
                        ghostPos: nearestGhost ? { x: nearestGhost.position.x, y: nearestGhost.position.y } : null,
                        dotsRemaining: map.numDots - numDotsEaten,
                        powerPelletActive: document.body.classList.contains('ghost-vulnerable'),
                        level: currentLevelIndex + 1
                    }).then(strategy => {
                        if (strategy) {
                            // Apply strategy to all active ghosts, varying mode by index
                            var ghostIdx = 0;
                            scene.children.forEach(function(obj) {
                                if (obj.isGhost) {
                                    // Alternate modes per ghost for variety
                                    var modes = ['chase', 'ambush', 'scatter', 'patrol'];
                                    obj._aiStrategy = {
                                        mode: modes[ghostIdx % modes.length],
                                        targetOffset: strategy.targetOffset,
                                        aggressionLevel: strategy.aggressionLevel
                                    };
                                    ghostIdx++;
                                }
                            });
                        }
                    }).catch(() => {});
                }
            };

            var updateCamera = function (delta, now) {
                if (isPaused) return;
                if (won) {
                    camera.targetPosition.set(map.centerX, map.centerY, 30);
                    camera.targetLookAt.set(map.centerX, map.centerY, 0);
                } else if (lost) {
                    camera.targetPosition = pacman.position.clone().addScaledVector(UP, 4);
                    camera.targetLookAt = pacman.position.clone().addScaledVector(pacman.direction, 0.01);
                } else {
                    const heightOffset = pacman.isJumping ? JUMP_CAMERA_HEIGHT_OFFSET : 1.5;
                    camera.targetPosition.copy(pacman.position)
                        .addScaledVector(UP, heightOffset)
                        .addScaledVector(pacman.direction, -1);
                    camera.targetLookAt.copy(pacman.position).add(pacman.direction);
                }
                var cameraSpeed = (lost || won) ? 1 : 10;
                camera.position.lerp(camera.targetPosition, delta * cameraSpeed);
                camera.lookAtPosition.lerp(camera.targetLookAt, delta * cameraSpeed);
                camera.lookAt(camera.lookAtPosition);
            };

            // Shared ghost color helpers reused from above
            function setGhostColor(ghost, colorStr) {
                if (ghost.isModel) {
                    ghost.traverse(function(child) {
                        if (child.isMesh) {
                            const mats = Array.isArray(child.material) ? child.material : [child.material];
                            mats.forEach(mat => {
                                if (mat.color) mat.color.setStyle(colorStr);
                            });
                        }
                    });
                } else {
                    ghost.material.color.setStyle(colorStr);
                }
            }

            function getGhostColor(ghost) {
                if (ghost.isModel) {
                    let color = null;
                    ghost.traverse(function(child) {
                        if (child.isMesh && !color) {
                            const mat = Array.isArray(child.material) ? child.material[0] : child.material;
                            if (mat && mat.color) color = mat.color.clone();
                        }
                    });
                    return color || new THREE.Color(GHOST_COLORS[ghost.colorIndex % GHOST_COLORS.length]);
                }
                return ghost.material.color.clone();
            }

            var updateGhost = function (ghost, delta, now) {
                if (isPaused) return;
                if (pacman.atePellet === true) {
                    ghost.isAfraid = true;
                    ghost.becameAfraidTime = now;
                    setGhostColor(ghost, 'blue');
                }
                if (ghost.isAfraid && now - ghost.becameAfraidTime > effectivePowerPelletDuration) {
                    ghost.isAfraid = false;
                    setGhostColor(ghost, GHOST_COLORS[ghost.colorIndex % GHOST_COLORS.length]);
                }
                if (ghost.isAfraid && now - ghost.becameAfraidTime > effectivePowerPelletDuration - 2) {
                    const flash = Math.floor((now * GHOST_AFRAID_FLASH_RATE) % 2);
                    setGhostColor(ghost, flash === 0 ? 'blue' : 'white');
                }
                moveGhost(ghost, delta);

                if (!lost && !won && !pacman.isJumping && distance(pacman, ghost) < PACMAN_RADIUS + GHOST_RADIUS) {
                    if (ghost.isAfraid === true) {
                        remove.push(ghost);
                        numGhosts -= 1;
                        updateGhostIndicator(numGhosts);
                        const ghostScore = GHOST_SCORE_MULTIPLIER ? SCORE_GHOST * scoreMultiplier : SCORE_GHOST;
                        updateScore(ghostScore);
                        _checkExtraLife(now);
                        showText('+' + ghostScore, 0.8, now);
                        scoreMultiplier *= 2;
                        
                        createGhostEatenEffect(ghost.position.clone(), getGhostColor(ghost), scene, remove, now);

                    } else {
                        lives -= 1;
                        var livesEls = document.getElementsByClassName('life');
                        if (livesEls[lives]) livesEls[lives].style.display = 'none';
                        if (lives > 0) showText('You died =(', 0.1, now);
                        else {
                            showText('Game over =(', 0.1, now);
                            // Show high score entry if qualifies, then play again
                            if (currentScore > 0 && qualifiesForHighScore(currentScore)) {
                                setTimeout(() => {
                                    showHighScoreEntry(currentScore, function() {
                                        showGameOverScreen(
                                            () => startLevel(currentLevelIndex),
                                            () => showLevelSelector((idx) => startLevel(idx))
                                        );
                                    });
                                }, 2000);
                            } else {
                                setTimeout(() => {
                                    showGameOverScreen(
                                        () => startLevel(currentLevelIndex),
                                        () => showLevelSelector((idx) => startLevel(idx))
                                    );
                                }, PLAY_AGAIN_SHOW_DELAY * 1000);
                            }
                        }
                        lost = true;
                        touchJumpRequested = false;
                        lostTime = now;
                        if (audioInitialized) {
                            deathSound.currentTime = 0; 
                            deathSound.play();
                            wakkaSound.pause(); 
                            ghostAmbientSound.pause();
                        }
                    }
                }
            };
            
            var movePacman = function (delta, now) {
                let forward = 0, turn = 0;
                
                if (keys['W'] || keys['w'] || keys['ArrowUp']) forward += 1;
                if (keys['S'] || keys['s'] || keys['ArrowDown']) forward -= 1;
                if (keys['A'] || keys['a'] || keys['ArrowLeft']) turn += 1;
                if (keys['D'] || keys['d'] || keys['ArrowRight']) turn -= 1;
                
                if (joystick && joystick.active) {
                    const ax = joystick.getAxis();
                    if (Math.abs(ax.forward) > 0.01) forward += ax.forward * JOYSTICK_SPEED_MULTIPLIER;
                    turn += ax.strafe * JOYSTICK_SPEED_MULTIPLIER * 2;

                // Gyroscope tilt input
                if (gyro && gyro.active) {
                    const gax = gyro.getAxis();
                    if (Math.abs(gax.forward) > 0.01) forward += gax.forward;
                    if (Math.abs(gax.strafe) > 0.01) turn += gax.strafe * 2;
                }
                }
                
                if ((keys[' '] ||keys[' '] || keys['Spacebar'] || touchJumpRequested) && !pacman.isJumping && pacman.jumpCooldown <= 0) {
                    pacman.isJumping = true;
                    pacman.jumpStartTime = now;
                    pacman.initialJumpRotation = pacman.rotation.z;
                    pacman.jumpCooldown = pacman.jumpDuration + JUMP_COOLDOWN;
                }

                pacman.up.copy(pacman.direction).applyAxisAngle(UP, -Math.PI / 2);
                pacman.lookAt(_lookAt.copy(pacman.position).add(UP));
                
                const speedMultiplier = pacman.isJumping ? JUMP_SPEED_BOOST : 1;
                
                if (forward > 0) {
                    pacman.translateOnAxis(LEFT, PACMAN_SPEED * delta * Math.abs(forward) * speedMultiplier);
                    pacman.distanceMoved += PACMAN_SPEED * delta * Math.abs(forward) * speedMultiplier;
                }
                if (forward < 0) {
                    pacman.translateOnAxis(LEFT, -PACMAN_SPEED * delta * Math.abs(forward) * speedMultiplier);
                    pacman.distanceMoved += PACMAN_SPEED * delta * Math.abs(forward) * speedMultiplier;
                }
                if (turn > 0) pacman.direction.applyAxisAngle(UP, Math.PI / 2 * delta * Math.abs(turn));
                if (turn < 0) pacman.direction.applyAxisAngle(UP, -Math.PI / 2 * delta * Math.abs(turn));
                
                var leftSide = pacman.position.clone().addScaledVector(LEFT, PACMAN_RADIUS).round();
                var topSide = pacman.position.clone().addScaledVector(TOP, PACMAN_RADIUS).round();
                var rightSide = pacman.position.clone().addScaledVector(RIGHT, PACMAN_RADIUS).round();
                var bottomSide = pacman.position.clone().addScaledVector(BOTTOM, PACMAN_RADIUS).round();
                
                if (!pacman.isJumping) {
                    if (isWall(map, leftSide)) pacman.position.x = leftSide.x + 0.5 + PACMAN_RADIUS;
                    if (isWall(map, rightSide)) pacman.position.x = rightSide.x - 0.5 - PACMAN_RADIUS;
                    if (isWall(map, topSide)) pacman.position.y = topSide.y - 0.5 - PACMAN_RADIUS;
                    if (isWall(map, bottomSide)) pacman.position.y = bottomSide.y + 0.5 + PACMAN_RADIUS;
                }

                var cell = getAt(map, pacman.position);
                if (cell && cell.isDot === true && cell.visible === true) {
                    removeAt(map, scene, pacman.position);
                    numDotsEaten += 1;
                    if (audioInitialized) {
                        wakkaSound.currentTime = 0; 
                        wakkaSound.play();
                    }
                    updateScore(SCORE_DOT);
                    _checkExtraLife(now);
                }
                pacman.atePellet = false;
                if (cell && cell.isPowerPellet === true && cell.visible === true) {
                    removeAt(map, scene, pacman.position);
                    pacman.atePellet = true;
                    updateScore(SCORE_POWER_PELLET);
                    _checkExtraLife(now);
                    if (audioInitialized) {
                        ghostAmbientSound.currentTime = 0; 
                        ghostAmbientSound.play();
                    }
                    scoreMultiplier = 1;
                    document.body.classList.add('ghost-vulnerable');
                    setTimeout(() => {
                        document.body.classList.remove('ghost-vulnerable');
                        ghostAmbientSound.pause();
                    }, effectivePowerPelletDuration * 1000);
                }
            };

            // Fruit logic constants (allow tuning in fruit.js)
            /* @tweakable Should bonus fruit always spawn in the center? (if false, random walk) */
            const FRUIT_CENTER_SPAWN = true;

            /* @tweakable Bonus fruit flash interval (seconds, for faded/visible) */
            const FRUIT_FLASH_INTERVAL = 0.4;

            /* @tweakable Minimum dots to clear before fruit spawns (percent as 0-1) */
            const FRUIT_DOTS_THRESHOLD = 0.55;

            let fruitInstances = [];
            let fruitTimeout = null;
            let fruitWasCollectedThisLevel = false;

            function getFruitForLevelIdx(idx) {
                if (!FRUITS.length) return null;
                return FRUITS[idx % FRUITS.length];
            }

            function spawnFruit(scene, map, levelIdx, eatenDots, totalDots) {
                if (fruitInstances.length > 0) return; // Only one fruit at a time

                const fruit = getFruitForLevelIdx(levelIdx);
                if (!fruit) return;

                let pos;
                if (FRUIT_CENTER_SPAWN && map.centerX && map.centerY) {
                    pos = new THREE.Vector3(Math.round(map.centerX), Math.round(map.centerY), 0.65);
                } else {
                    let openCells = [];
                    for (let y = map.bottom; y <= map.top; ++y) {
                        for (let x = map.left; x <= map.right; ++x) {
                            if (map[y] && map[y][x] && (map[y][x].isDot || map[y][x].isPowerPellet)) {
                                openCells.push({ x, y });
                            }
                        }
                    }
                    if (!openCells.length) return;
                    let cell = openCells[Math.floor(Math.random() * openCells.length)];
                    pos = new THREE.Vector3(cell.x, cell.y, 0.65);
                }

                let canvas = document.createElement('canvas');
                canvas.width = 64; canvas.height = 64;
                let ctx = canvas.getContext('2d');
                ctx.font = "48px serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.clearRect(0, 0, 64, 64);
                ctx.fillText(fruit.emoji, 32, 32);
                let texture = new THREE.Texture(canvas);
                texture.needsUpdate = true;
                let mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
                let geo = new THREE.PlaneGeometry(0.7, 0.7);
                let mesh = new THREE.Mesh(geo, mat);
                mesh.position.copy(pos);
                mesh.isFruit = true;
                mesh.fruitInfo = fruit;
                mesh.visible = true;

                mesh.userData = {
                    t0: performance.now() / 1000,
                };

                scene.add(mesh);
                fruitInstances.push(mesh);

                if (fruitTimeout) clearTimeout(fruitTimeout);
                fruitTimeout = setTimeout(() => {
                    fadeOutFruit(scene, mesh);
                }, FRUIT_DURATION * 1000);
            }

            function fadeOutFruit(scene, mesh) {
                let t0 = performance.now() / 1000;
                let fade = () => {
                    let t = performance.now() / 1000 - t0;
                    let factor = Math.max(0, 1 - t / FRUIT_FADE_DURATION);
                    mesh.material.opacity = factor;
                    if (factor <= 0) {
                        scene.remove(mesh);
                        let idx = fruitInstances.indexOf(mesh);
                        if (idx >= 0) fruitInstances.splice(idx, 1);
                    } else {
                        requestAnimationFrame(fade);
                    }
                };
                fade();
            }

            function clearAllFruit(scene) {
                fruitInstances.forEach(fruit => scene.remove(fruit));
                fruitInstances.length = 0;
                if (fruitTimeout) clearTimeout(fruitTimeout);
            }

            function checkFruitCollection(pacman, scene, now, updateScoreCb) {
                for (let i = 0; i < fruitInstances.length; ++i) {
                    let fruit = fruitInstances[i];
                    if (fruit.position.distanceTo(pacman.position) < PACMAN_RADIUS + 0.4) {
                        updateScoreCb(fruit.fruitInfo.points);
                        showFruitText(fruit.fruitInfo, now, fruit.position);
                        scene.remove(fruit);
                        fruitInstances.splice(i, 1);
                        fruitWasCollectedThisLevel = true;
                        return true;
                    }
                }
                return false;
            }

            function showFruitText(fruit, now, posVec3) {
                let overlay = document.createElement('div');
                overlay.textContent = `${fruit.emoji} +${fruit.points}`;
                overlay.style.position = 'fixed';
                overlay.style.left = "50%";
                overlay.style.top = "35%";
                overlay.style.transform = "translate(-50%, -50%)";
                overlay.style.color = "#f8ff54";
                overlay.style.fontSize = '2.6em';
                overlay.style.fontWeight = 'bold';
                overlay.style.textShadow = '2px 2px 8px #000, 0 0 4px #fff';
                overlay.style.pointerEvents = 'none';
                overlay.style.background = 'rgba(30,30,0,0.18)';
                overlay.style.borderRadius = "9px";
                overlay.style.padding = '10px 32px';
                overlay.style.zIndex = 102;
                document.body.appendChild(overlay);
                setTimeout(() => {
                    overlay.remove();
                }, 1300);
            }

            // Variables for dot/fruit logic
            let dotsThisLevel = 0, dotsEatenSoFar = 0;
            for (let y = map.bottom; y <= map.top; ++y) {
                for (let x = map.left; x <= map.right; ++x) {
                    if (map[y] && map[y][x] && (map[y][x].isDot === true)) {
                        dotsThisLevel++;
                    }
                }
            }

            let fruitSpawnedThisLevel = false;
            let challengeFruitsSpawned = 0;
            let fruitRespawnTimer = null;
            let fruitRespawnPending = false;

            animationLoop(function (delta, now) {
                if (isPaused) {
                    renderer.render(scene, camera);
                    return;
                }
                update(delta, now);

                fruitInstances.forEach(fruit => {
                    let t = performance.now() / 1000 - (fruit.userData?.t0 ?? 0);
                    fruit.rotation.z = Math.sin(t * 2) * 0.18 + t * 1.8;
                    fruit.position.z = 0.67 + Math.sin(t * 2.1) * 0.19;
                    fruit.material.opacity = (Math.floor(t / FRUIT_FLASH_INTERVAL) % 2 === 0) ? 1 : 0.7;
                });

                if (!fruitSpawnedThisLevel && !fruitWasCollectedThisLevel && FRUITS.length && dotsThisLevel > 0) {
                    let minEatenToSpawn = Math.floor(dotsThisLevel * FRUIT_DOTS_THRESHOLD);
                    if (numDotsEaten >= minEatenToSpawn) {
                        spawnFruit(scene, map, levelIndex, numDotsEaten, dotsThisLevel);
                        fruitSpawnedThisLevel = true;
                    }
                }

                if (isChallenge && challengeFruitsSpawned < challengeFruitMax && fruitInstances.length === 0 && fruitSpawnedThisLevel && !fruitRespawnPending) {
                    // Challenge mode: fruit is gone (collected or expired), schedule next after delay
                    fruitSpawnedThisLevel = true; // keep locked while timer runs
                    fruitRespawnPending = true;
                    fruitRespawnTimer = setTimeout(() => {
                        fruitRespawnPending = false;
                        fruitSpawnedThisLevel = false;
                        challengeFruitsSpawned++;
                    }, 2500);
                } else if (FRUIT_ONCE_PER_LEVEL && fruitWasCollectedThisLevel) {
                    clearAllFruit(scene);
                    fruitSpawnedThisLevel = true; // Lock out future fruit
                }

                if (checkFruitCollection(pacman, scene, performance.now()/1000, updateScore)) {
                }

                renderer.setViewport(0, 0, renderer.domElement.width, renderer.domElement.height);
                renderer.render(scene, camera);
                renderHud(renderer, hudCamera, scene);
                updateMinimapGhostIcons();
            });

            window.onkeydown = function (e) {
                if (e.key === "l" || e.key === "L") {
                    showLevelSelector(function (idx) { startLevel(idx); });
                }
                if (e.key === "p" || e.key === "P") {
                    document.querySelector('button').click();
                }
                if (e.key === " " || e.key === "Enter") {
                    if (document.getElementById("play-again-overlay")) {
                        const playAgainButton = document.querySelector("#play-again-overlay button");
                        if (playAgainButton) playAgainButton.click();
                        e.preventDefault(); 
                    } else {
                        e.preventDefault(); 
                    }
                }
                
                if (!audioInitialized) {
                    initAudio();
                }
            };

            const oldJumpIndicator = document.getElementById('jump-indicator');
            if (oldJumpIndicator) oldJumpIndicator.remove();
            
            const oldScoreDisplay = document.getElementById('score-display');
            if (oldScoreDisplay) oldScoreDisplay.remove();
        }

        // Show loading screen (device-specific bg + dancing banana), then level selector
        showLoadingScreen(function() {
            showLevelSelector(function (idx) { startLevel(idx); });
        });
    };

    // Show asset selector first, then start the game
    AssetSelector.showAssetSelector(function(prefs) {
        main(prefs);
    });
}());

class VirtualJoystick {
    constructor(options) {
        options = options || {};
        this.radius = options.radius || JOYSTICK_RADIUS;
        this.range = options.range || JOYSTICK_RANGE;
        this.opacity = options.opacity || JOYSTICK_OPACITY;
        this.deadzone = options.deadzone || JOYSTICK_DEADZONE;
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'fixed',
            left: '24px',
            bottom: '24px',
            zIndex: 30,
            width: `${this.radius * 2}px`,
            height: `${this.radius * 2}px`,
            opacity: this.opacity,
            touchAction: 'none',
            userSelect: 'none',
        });
        
        this.base = document.createElement('canvas');
        this.base.width = this.radius * 2;
        this.base.height = this.radius * 2;
        Object.assign(this.base.style, {
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none'
        });
        this._drawBase();
        
        this.thumb = document.createElement('canvas');
        this.thumb.width = this.radius * 2;
        this.thumb.height = this.radius * 2;
        Object.assign(this.thumb.style, {
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none'
        });
        this._drawThumb(0, 0);
        this.container.appendChild(this.base);
        this.container.appendChild(this.thumb);
        document.body.appendChild(this.container);

        this.active = false;
        this.value = { x: 0, y: 0 };
        this._touchId = null;
        this._last = { x: 0, y: 0 };

        this.container.addEventListener('touchstart', (e) => {
            for (let t of e.changedTouches) {
                if (this._touchId == null) {
                    this._touchId = t.identifier;
                    this.active = true;
                    this._setThumbPos(t.clientX, t.clientY, true);
                    break;
                }
            }
        });
        this.container.addEventListener('touchmove', (e) => {
            if (this._touchId == null) return;
            for (let t of e.changedTouches) {
                if (t.identifier === this._touchId) {
                    this._setThumbPos(t.clientX, t.clientY, false);
                    e.preventDefault();
                    break;
                }
            }
        }, { passive: false });
        this.container.addEventListener('touchend', (e) => {
            for (let t of e.changedTouches) {
                if (t.identifier === this._touchId) {
                    this._touchId = null;
                    this.active = false;
                    this.value = { x: 0, y: 0 };
                    this._drawThumb(0, 0);
                    break;
                }
            }
        });
        this.container.addEventListener('touchcancel', (e) => {
            if (this._touchId != null) {
                this._touchId = null;
                this.active = false;
                this.value = { x: 0, y: 0 };
                this._drawThumb(0, 0);
            }
        });

        this.container.addEventListener('mousedown', (e) => {
            this.active = true;
            this._setThumbPos(e.clientX, e.clientY, true);
            window.addEventListener('mousemove', mouseMove);
            window.addEventListener('mouseup', mouseUp);
            e.preventDefault();
        });
        const mouseMove = (e) => {
            if (!this.active) return;
            this._setThumbPos(e.clientX, e.clientY, false);
        };
        const mouseUp = (e) => {
            this.active = false;
            this.value = { x: 0, y: 0 };
            this._drawThumb(0, 0);
            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('mouseup', mouseUp);
        };

        const maybeHide = () => {
            if (window.innerWidth > 900 && window.innerWidth > window.innerHeight) {
                this.container.style.display = "none";
            } else {
                this.container.style.display = "";
            }
        };
        window.addEventListener('resize', maybeHide);
        maybeHide();
    }
    _drawBase() {
        const c = this.base.getContext('2d');
        c.clearRect(0, 0, this.base.width, this.base.height);
        c.globalAlpha = 0.32;
        c.beginPath();
        c.arc(this.radius, this.radius, this.radius - 2, 0, 2 * Math.PI);
        c.fillStyle = '#232a2b';
        c.fill();
        c.globalAlpha = 1;
        c.lineWidth = 3;
        c.strokeStyle = '#eee';
        c.beginPath();
        c.arc(this.radius, this.radius, this.radius - 2, 0, 2 * Math.PI);
        c.stroke();
        
        c.fillStyle = '#cea400';
        c.beginPath();
        c.arc(this.radius, this.radius, 7, 0, 2 * Math.PI);
        c.fill();
    }
    _drawThumb(dx, dy) {
        const c = this.thumb.getContext('2d');
        c.clearRect(0, 0, this.thumb.width, this.thumb.height);
        let x = this.radius + dx, y = this.radius + dy;
        c.globalAlpha = 0.98;
        c.beginPath();
        c.arc(x, y, 18, 0, 2 * Math.PI);
        c.fillStyle = '#ffe166';
        c.shadowColor = '#cea400';
        c.shadowBlur = 7;
        c.fill();
        c.shadowBlur = 0;
        c.globalAlpha = 0.30;
        c.beginPath();
        c.arc(x, y, 25, 0, 2 * Math.PI);
        c.strokeStyle = '#bbab1d';
        c.lineWidth = 5;
        c.stroke();
        c.globalAlpha = 1.0;
    }
    _setThumbPos(clientX, clientY, initial) {
        const rect = this.container.getBoundingClientRect();
        const dx = clientX - (rect.left + this.radius);
        const dy = clientY - (rect.top + this.radius);
        let magnitude = Math.sqrt(dx * dx + dy * dy);
        let ang = Math.atan2(dy, dx);
        let dist = Math.min(magnitude, this.range);
        let normX = (dist * Math.cos(ang)) / this.range;
        let normY = (dist * Math.sin(ang)) / this.range;
        if (Math.abs(normX) < this.deadzone) normX = 0;
        if (Math.abs(normY) < this.deadzone) normY = 0;
        this.value = { x: normX, y: normY };
        this._drawThumb(dist * Math.cos(ang), dist * Math.sin(ang));
    }
    getAxis() {
        if (JOYSTICK_DEBUG) console.log("Joystick axis:", this.value);
        return {
            forward: -this.value.y,
            strafe: -this.value.x,
            magnitude: Math.sqrt(this.value.x * this.value.x + this.value.y * this.value.y)
        };
    }
}

/**
 * GyroController - uses DeviceOrientation API to map phone tilt to movement.
 */
class GyroController {
    constructor() {
        this.active = false;
        this.value = { beta: 0, gamma: 0 };
        this._baseline = { beta: null, gamma: null };
        this._enabled = false;
        this._onOrientation = (e) => {
            if (!this._enabled) return;
            if (e.beta == null || e.gamma == null) return;
            if (this._baseline.beta === null) {
                this._baseline.beta = e.beta;
                this._baseline.gamma = e.gamma;
            }
            this.value.beta = e.beta - this._baseline.beta;
            this.value.gamma = e.gamma - this._baseline.gamma;
            const absBeta = Math.abs(this.value.beta);
            const absGamma = Math.abs(this.value.gamma);
            this.active = absBeta > GYRO_DEADZONE || absGamma > GYRO_DEADZONE;
        };
        this._tryStart();
    }
    async _tryStart() {
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const perm = await DeviceOrientationEvent.requestPermission();
                if (perm === 'granted') this._enable();
            } catch (e) {}
        } else if (typeof DeviceOrientationEvent !== 'undefined') {
            this._enable();
        }
    }
    _enable() {
        this._enabled = true;
        window.addEventListener('deviceorientation', this._onOrientation, true);
        this._onVisibility = () => {
            if (!document.hidden) {
                this._baseline.beta = null;
                this._baseline.gamma = null;
            }
        };
        document.addEventListener('visibilitychange', this._onVisibility);
    }
    getAxis() {
        if (!this.active) return { forward: 0, strafe: 0 };
        const maxTilt = GYRO_MAX_TILT;
        const sens = GYRO_SENSITIVITY;
        let forward = (this.value.beta / maxTilt) * sens;
        let strafe = (this.value.gamma / maxTilt) * sens;
        forward = Math.max(-1, Math.min(1, forward));
        strafe = Math.max(-1, Math.min(1, strafe));
        return { forward, strafe };
    }
    async requestPermission() {
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const perm = await DeviceOrientationEvent.requestPermission();
                if (perm === 'granted') { if (!this._enabled) this._enable(); return true; }
            } catch (e) {}
            return false;
        }
        return this._enabled;
    }
    destroy() {
        this._enabled = false;
        this.active = false;
        window.removeEventListener('deviceorientation', this._onOrientation, true);
        if (this._onVisibility) document.removeEventListener('visibilitychange', this._onVisibility);
    }
}
/**
 * SwipeController - Detects touch swipe gestures on mobile for directional input.
 * Swipes are mapped to forward/strafe values matching the joystick/gyro interface.
 */
class SwipeController {
    constructor(targetEl) {
        this.active = true;
        this._forward = 0;
        this._strafe = 0;
        this._target = targetEl || document.body;
        this._startX = 0;
        this._startY = 0;
        this._swiping = false;
        /* @tweakable Minimum swipe distance in pixels to register a direction */
        this._minDistance = 30;
        /* @tweakable How long a swipe input persists after gesture ends (ms) */
        this._decayMs = 250;
        this._decayTimer = null;

        this._onTouchStart = (e) => {
            if (!this.active) return;
            const t = e.touches[0];
            this._startX = t.clientX;
            this._startY = t.clientY;
            this._swiping = true;
        };
        this._onTouchMove = (e) => {
            if (!this.active || !this._swiping) return;
            e.preventDefault();
            const t = e.touches[0];
            const dx = t.clientX - this._startX;
            const dy = t.clientY - this._startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this._minDistance) return;
            // Normalize and map to forward/strafe
            const ndx = dx / dist;
            const ndy = dy / dist;
            // Swipe up = forward (+1), down = backward (-1)
            this._forward = -ndy;
            // Swipe right = strafe negative (turn right), left = strafe positive (turn left)
            this._strafe = -ndx;
        };
        this._onTouchEnd = () => {
            this._swiping = false;
            // Decay: keep the direction briefly so movement feels responsive
            clearTimeout(this._decayTimer);
            this._decayTimer = setTimeout(() => {
                this._forward = 0;
                this._strafe = 0;
            }, this._decayMs);
        };

        this._target.addEventListener('touchstart', this._onTouchStart, { passive: true });
        this._target.addEventListener('touchmove', this._onTouchMove, { passive: false });
        this._target.addEventListener('touchend', this._onTouchEnd, { passive: true });
        this._target.addEventListener('touchcancel', this._onTouchEnd, { passive: true });
    }

    getAxis() {
        return { forward: this._forward, strafe: this._strafe };
    }

    destroy() {
        this.active = false;
        clearTimeout(this._decayTimer);
        this._target.removeEventListener('touchstart', this._onTouchStart);
        this._target.removeEventListener('touchmove', this._onTouchMove);
        this._target.removeEventListener('touchend', this._onTouchEnd);
        this._target.removeEventListener('touchcancel', this._onTouchEnd);
    }
}
