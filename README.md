# 🟡 Ultimate 3D Pac-Man

A fully-featured 3D Pac-Man game built with Three.js and Puter.js — featuring customizable models, cloud leaderboards, AI-powered ghosts, and level progression.

**Play it live:** https://dev-justin-time.github.io/3d_pacman/

---

## 🎮 Features

### Gameplay
- **3D maze navigation** with smooth camera following and perspective view
- **Jump mechanic** — press SPACE to leap over ghosts (with cooldown timer)
- **Power pellets** — eat them to turn ghosts vulnerable and score bonus points
- **Fruit system** — collect fruits for extra points with unique spawn mechanics
- **Ghost AI** — ghosts use chase, ambush, scatter, and patrol strategies
- **AI-powered ghosts** — when connected to Puter, ghosts use GPT-4o-mini to make smarter decisions
- **Level progression** — unlock levels as you master them, with challenge levels every 5th stage
- **Extra life system** — earn bonus lives at score milestones (every 10,000 pts)

### Customization (Asset Selector)
- **13 Pac-Man models** — classic sphere, Yellow, Robot, Girl, Pixel, Rock 'n Roll, and more
- **5 Ghost models** — classic, Inky, Blue Ghost, Pinky, Candy Monsters
- **6 fonts** — Pacfont, Press Start 2P, VT323, Fantasmytas, Pixelify Sans, and more
- **4 ghost images** — Kinky, Pinky, Rinky, Stinky
- **9 music tracks** — Arcade, Elevator, Pixelheart, Volt, and more
- **Style themes** — "New" (3D models) or "Legacy" (classic spheres)
- **Splash screens** — device-adaptive loading backgrounds

### Puter Cloud Integration
- ☁️ **Cloud leaderboards** — global high scores stored via Puter KV
- 🔐 **User authentication** — sign in with Puter to track your identity
- 🤖 **AI ghost behavior** — ghosts request strategies from Puter's AI every 5 seconds
- 🏆 **Tournament system** — create and join competitive tournaments

### Controls
| Input | Action |
|-------|--------|
| Arrow keys / WASD | Move Pac-Man |
| SPACE | Jump |
| P / Pause button | Pause game |
| Click | Interact with UI |

### Mobile Support
- **Virtual joystick** for touch-screen movement
- **Responsive UI scaling** adapts to any screen size
- **Device-adaptive** loading screens and layouts

---

## 🛠 Technical Stack

- **Rendering:** Three.js (r154) — WebGL 3D rendering with GLTF model loading
- **Cloud:** Puter.js (v2) — authentication, key-value storage, AI API
- **Audio:** Web Audio API — spatial sound effects, crossfade music playlist
- **Fonts:** CSS @font-face injection with 6 retro/arcade fonts
- **Architecture:** ES modules with import maps, no build step required

---

## 📁 Project Structure

```
├── index.html                 # Entry point — import maps, Puter.js, styles
├── pacman.js                  # Main game engine (2800+ lines)
├── asset-manager.js           # Asset registry, model loader, preferences
├── asset-selector.js          # Full-screen asset picker UI
├── levels.js                  # Standard level definitions
├── challenge-levels.js        # Challenge level definitions
├── fruit.js                   # Fruit spawning system
├── puter-integration.js       # Puter.js cloud features
├── pacman-multiplayer.js      # Multiplayer room support
├── level-player.html          # Standalone level viewer (OrbitControls)
├── thumbnail-generator.html   # Standalone 3D model thumbnail renderer
├── generate-icon.html         # App icon generator (512×512 PNG)
└── assets/
    ├── audio/sfx/             # Sound effects (.wav)
    ├── audio/music/           # Background music (.mp3)
    ├── fonts/                 # Retro arcade fonts (.ttf)
    ├── images/                # Ghost images, splash screens, icons
    └── models/                # GLTF 3D models (.gltf + .bin)
        ├── pacman/            # Pac-Man character models
        └── ghost/             # Ghost character models
```

---

## 🚀 Running Locally

No build step needed — just serve the files with any static HTTP server:

```bash
# Using Python
python -m http.server 8088

# Using Node.js (npx)
npx serve -l 8088

# Using PHP
php -S localhost:8088
```

Then open `http://localhost:8088` in your browser.

---

## 📦 Puter App Store

- **App URL:** https://dev-justin-time.github.io/3d_pacman/
- **Category:** Games / Entertainment
- **Features:** Cloud leaderboards, AI-powered ghosts, user authentication

---

## 📄 License

3D models are sourced from Sketchfab and subject to their respective licenses. See individual `license.txt` files in model directories for details.

---

Built with ❤️ using Three.js and Puter.js
