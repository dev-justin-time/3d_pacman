# Pacman 3D Clone (Websim)

A lightweight 3D Pacman-inspired browser game using Three.js, with single-player and optional multiplayer features powered by WebsimSocket.

Overview
- 3D, physics-lite Pacman clone rendered with Three.js.
- Multiple handcrafted levels (levels.js).
- Edible dots, power pellets, ghosts with frightened mode, bonus fruits (fruit.js).
- Background music playlist and sound effects (site assets).
- Optional multiplayer overlays, presence sync, PvP-eating, chat and a simple Go engine (pacman-multiplayer.js).

Quick start
1. Open index.html in a modern browser (works in the embedded Websim environment).
2. Press any key or touch the screen to initialize audio and start the game UI.
3. Use the level selector (press "L" or use the UI) to pick a level.

Controls
- Desktop:
  - Move: WASD or Arrow keys
  - Jump: Space
  - Pause: P (or press top-right pause button)
  - Level selector: L
- Mobile:
  - On-screen virtual joystick (left-bottom) for movement.
  - Tap on-screen controls (Space mapped via UI) for jump/pause.

Multiplayer (optional)
- Multiplayer uses WebsimSocket via pacman-multiplayer.js.
- Join/invite: Open invite pane appears at top-left; hosts can open invites and others can join.
- Presence sync: player state (position, score, alive/dead) synced via presence; overlays show avatars.
- PvP: players in "power mode" can eat other players; respawn voting/overlays included.
- Chat: lightweight chatbox (toggleable) for in-game messages.

Tweakables & fine-tuning
- Many gameplay and UX parameters are annotated in-code using /* @tweakable ... */ JSDoc comments.
- Files with notable @tweakable annotations:
  - pacman.js — joystick, maze opacity, power-pellet duration, music volumes, scoring, speeds, jump tuning, fruit timing, HUD and overlay durations, and more.
  - pacman-multiplayer.js — multiplayer UI controls, timeouts, PvP scoring, and Go engine settings.
  - fruit.js — fruit list, FRUIT_SPEED, FRUIT_DURATION, FRUIT_FADE_DURATION, FRUIT_ONCE_PER_LEVEL.
- To tweak behavior, open the listed files and edit values marked with /* @tweakable ... */ then reload the page.

Project structure
- index.html — bootstrap + importmap
- pacman.js — main game, rendering, input, audio, level logic
- levels.js — all level maps (edit to add/remove levels)
- fruit.js — bonus fruit table and configurable fruit behavior
- pacman-multiplayer.js — multiplayer overlay, presence, chat, simple Go engine
- audio assets — .mp3/.wav files in project root (referenced by pacman.js)

Notes & troubleshooting
- Audio initialization requires a user gesture on many browsers; press a key or click to enable audio.
- If a DOM error referencing transient overlays appears, ensure index.html includes the importmap that loads pacman.js.
- If you removed older level files (20.js, 40.js, etc.) that's fine; all levels used by the game are centralized in levels.js.

Contributing
- Add new levels to levels.js as arrays of strings (use existing patterns).
- Add or modify fruits in fruit.js; emojis are used as in-game textures.
- Keep assets (audio/glb) in root and referenced by path (no base64 embedding).

License
- Provided as-is for experimentation and learning. Attribution appreciated.

If you want, I can also generate a short list of the most useful @tweakable keys + suggested ranges to make tuning quicker.

---

Tweakable quick reference — most useful keys, suggested ranges, and logic examples
- These are the most effective knobs for playtesting. Each example includes a commented @tweakable-style line you can paste into code for quick editing and a short logic note.

1) Player & Ghost speeds
- pacman.js:
  /* @tweakable Initial player speed (units/sec) */
  const PACMAN_SPEED = 2;           // suggested range: 0.8 — 4.0
  /* @tweakable Ghost speed (units/sec) */
  const GHOST_SPEED = 1.5;          // suggested range: 0.8 — 3.5
  Logic: increase PACMAN_SPEED relative to GHOST_SPEED to make levels easier; decrease for tougher chase.

2) Lives & scoring
  /* @tweakable Number of player lives at the start of every level */
  const PLAYER_START_LIVES = 3;     // suggested values: 1 — 5
  /* @tweakable Score for eating a regular dot */
  const SCORE_DOT = 10;             // suggested: 5 — 25
  /* @tweakable Score for eating a power pellet */
  const SCORE_POWER_PELLET = 50;    // suggested: 25 — 200
  Logic: raising SCORE_POWER_PELLET makes power pellet timing more rewarding; adjust high-score pacing.

3) Power pellet / frightened mode
  /* @tweakable Power pellet mode duration, in seconds */
  const POWER_PELLET_DURATION = 10; // suggested range: 5 — 18
  /* @tweakable Should consecutive ghost eat bonuses multiply ("2x, 4x, 8x...") */
  const GHOST_SCORE_MULTIPLIER = true;
  Logic: longer POWER_PELLET_DURATION favors skilled ghost-eating playstyles.

4) Fruit & bonus timing (fruit.js + pacman.js)
  /* @tweakable How long a fruit appears on the map, in seconds */
  export const FRUIT_DURATION = 15;  // suggested: 6 — 20
  /* @tweakable If true, a fruit will spawn ONCE per level; if false, it can respawn multiple times. */
  export const FRUIT_ONCE_PER_LEVEL = true; 
  /* @tweakable Minimum dots to clear before fruit spawns (percent as 0-1) */
  const FRUIT_DOTS_THRESHOLD = 0.55; // suggested: 0.2 — 0.75
  Logic: lower threshold = earlier fruit; higher = late-stage reward.

5) Joystick & mobile feel
  /* @tweakable The virtual joystick's on-screen radius in pixels */
  const JOYSTICK_RADIUS = 48;        // suggested: 36 — 72
  /* @tweakable Minimum joystick movement to register direction (0.0 - 1.0) */
  const JOYSTICK_DEADZONE = 0.20;    // suggested: 0.08 — 0.35
  Logic: smaller deadzone = more sensitive; increase for accidental touch tolerance.

6) Audio & music
  /* @tweakable Background music volume (0.0-1.0) */
  const BACKGROUND_MUSIC_VOLUME = 0.3; // suggested: 0.0 — 0.6
  /* @tweakable Volume of dot/gameplay effects (0.0-1.0) */
  const SOUND_VOLUME = 0.5;            // suggested: 0.2 — 0.9
  Logic: if music is too dominant, reduce BACKGROUND_MUSIC_VOLUME and keep SOUND_VOLUME slightly higher.

7) HUD & UI timing
  /* @tweakable How long text messages are visible on the screen (ms) */
  const TEXT_DISPLAY_DURATION = 2200;  // suggested: 800 — 4000
  /* @tweakable Win next-level transition delay (seconds, 0 = instant next level) */
  const NEXTLEVEL_DELAY_AFTER_WIN = 0; // suggested: 0 — 3
  Logic: short NEXTLEVEL_DELAY_AFTER_WIN for fast flow; longer for celebration.

8) Ghost AI randomness
  /* @tweakable Ghost movement randomness (0: predictable, 1: very random) */
  const GHOST_MOVEMENT_RANDOMNESS = 0.65; // suggested: 0.0 — 0.95
  Logic: lower = ghosts follow paths more reliably; higher = chaotic movement.

9) Visual clarity
  /* @tweakable Maze walls opacity (0: invisible, 1: opaque) */
  const MAZE_OPACITY = 0.5;             // suggested: 0.0 — 1.0
  /* @tweakable Spot light intensity */
  const SPOTLIGHT_INTENSITY = 0.5;      // suggested: 0.0 — 1.25
  Logic: increase MAZE_OPACITY for clearer walls in small screens or reduce for minimalist look.

10) Respawn & multiplayer timing (pacman-multiplayer.js)
  /* @tweakable How long (seconds) before a dead player auto-perishes if not respawned */
  export const MP_RESPAWN_VICTIM_SEC = 10; // suggested: 6 — 18
  /* @tweakable PvP eating: score multiplier for eating another player over a ghost */
  export const MP_PVP_EAT_SCORE_MULT = 2;  // suggested: 1 — 4
  Logic: lower respawn timers = faster round resolution; higher PvP multiplier gives risk/reward.

Examples & quick logic snippets
- Make ghosts slightly faster each 3 levels:
  // in pacman.js (pseudo)
  /* @tweakable Ghost speed base (units/sec) */
  const GHOST_SPEED_BASE = 1.2;
  function ghostSpeedForLevel(levelIdx) {
    return GHOST_SPEED_BASE + Math.floor(levelIdx / 3) * 0.08;
  }

- Double fruit duration for easy mode:
  // in fruit.js
  /* @tweakable Fruit duration multiplier for easy mode */
  export const FRUIT_DURATION = 15 * 1.8; // easy multiplier 1.8

- Make music quieter during intense sections:
  // in pacman.js, when entering power pellet:
  setPlaylistVolume(BACKGROUND_MUSIC_VOLUME * 0.55); // reduce during fight

How to apply quickly
- Copy the short annotation lines above into the top of pacman.js or fruit.js, save, and reload the page.
- Use the suggested ranges as starting points; change one parameter at a time and play several runs to observe impact.

Comments
- I used JSDoc-style @tweakable comments in the code examples above so you can paste them directly into the relevant JS file and find them easily.
- These choices focus on what affects player experience most: speed, power-pellet timing, fruit rewards, and audio balance.
