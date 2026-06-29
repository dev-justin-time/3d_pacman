# PAC-MAN 3D — Style Guide

> Complete reference for all visual styles, fonts, colors, and layout patterns used in the game.

---

## 1. Fonts

All fonts are loaded via `@font-face` in `asset-manager.js` and applied dynamically based on user preference.

| ID             | Family            | File                             | Style                    | Best For                    |
|----------------|-------------------|----------------------------------|--------------------------|-----------------------------|
| `pacfontZEBZ`  | Pacfont-ZEBZ      | `assets/fonts/Pacfont-ZEBZ.ttf` | Classic Pac-Man arcade   | Title screens, main HUD     |
| `pacfontGood`  | PacfontGood       | `assets/fonts/PacfontGood-yYye.ttf` | Pac-Man variant     | Score display, menus        |
| `fantasmytas`  | Fantasmytas       | `assets/fonts/FantasmytasSt-8YDJ.ttf` | Playful rounded display | Fun overlays, celebrations |
| `pressStart2P` | Press Start 2P    | `assets/fonts/PressStart2P-Regular.ttf` | Classic pixel arcade | Retro UI, high scores       |
| `vt323`        | VT323             | `assets/fonts/VT323-Regular.ttf` | Retro terminal-style   | Debug info, subtitle text   |
| `pixelifySans` | Pixelify Sans     | `assets/fonts/PixelifySans-Regular.ttf` | Modern pixel-perfect | UI elements, buttons        |

### Font Samples

> **Live Preview:** Open [`font-preview.html`](font-preview.html) in your browser to see all fonts rendered with their actual typefaces.

Each font renders this sample text:

```
PAC-MAN 3D
SCORE: 10000  HIGH: 99999
GAME OVER
0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ
```

#### Pacfont ZEBZ
```
font-family: 'Pacfont-ZEBZ', monospace;
```
> Classic Pac-Man arcade font with characteristic cut-out letterforms. The default game font. Used for: title screens, main HUD.

#### Pacfont Good
```
font-family: 'PacfontGood', monospace;
```
> A refined variant of the Pac-Man font with cleaner edges and better readability. Used for: score display, menus.

#### Fantasmytas St
```
font-family: 'Fantasmytas', monospace;
```
> Playful rounded display font with whimsical character shapes. Great for celebrations and fun overlays.

#### Press Start 2P
```
font-family: 'Press Start 2P', monospace;
```
> Authentic 8-bit pixel font. Perfect for retro arcade aesthetic and high score tables.

#### VT323
```
font-family: 'VT323', monospace;
```
> Terminal-style monospace font reminiscent of early computer displays. Clean and highly readable.

#### Pixelify Sans
```
font-family: 'Pixelify Sans', monospace;
```
> Modern take on pixel fonts with better kerning and weight variation. Good for UI labels.

---

## 2. Color Palette

### Primary Colors

| Color      | Hex       | Usage                                    |
|------------|-----------|------------------------------------------|
| Gold       | `#FFD700` | Primary accent — scores, titles, buttons |
| Dark Blue  | `#0d1b2a` | Background base                          |
| Deep Navy  | `#0a0e1a` | Card backgrounds, deep panels            |
| Panel Blue | `#1b2838` | Borders, dividers, scrollbar tracks      |
| Muted Blue | `#3a6a9a` | Hover borders, secondary accents         |
| Text Light | `#e0e0e0` | Primary text color                       |
| Text Muted | `#6a7a8a` | Descriptions, secondary text             |
| Text Cool  | `#8899aa` | Subtitles, tab inactive text             |

### Game Element Colors

| Element         | Color              | Hex/Value                           |
|-----------------|--------------------|--------------------------------------|
| Dot             | Warm cream         | `#FFD9B9`                           |
| Wall            | Classic blue       | `#314ABD` (opacity: 0.5)            |
| Spotlight       | White              | `#FFFFFF` (intensity: 0.5)          |
| Score text      | Gold               | `#FFD700`                           |
| Jump indicator  | Gold               | `#FFD700`                           |
| Jump cooldown   | Gray               | `#aaaaaa`                           |

### Ghost Colors (Sequence)

| Index | Ghost  | Color   | Hex       |
|-------|--------|---------|-----------|
| 0     | Red    | Blinky  | `#FF0000` |
| 1     | Cyan   | Inky    | `#00FFDE` |
| 2     | Pink   | Pinky   | `#FFB8DE` |
| 3     | Orange | Clyde   | `#FFB847` |

### Asset Selector Card Gradients

Each model card has a unique gradient background:

#### Pac-Man Models

| Model          | Gradient                                    | Emoji | Tint BG  |
|----------------|---------------------------------------------|-------|----------|
| Classic Sphere | `#FFD700` → `#FFA500`                       | 🟡    | `#2a2000`|
| Yellow         | `#FFE135` → `#FFC107`                       | 🟡    | `#2a2500`|
| Robot          | `#78909c` → `#455a64`                       | 🤖    | `#1a2025`|
| Girl           | `#FF69B4` → `#FF1493`                       | 💃    | `#2a1020`|
| Pixel          | `#00E676` → `#00C853`                       | 👾    | `#0a2a15`|
| Rock 'n Roll   | `#E040FB` → `#7B1FA2`                       | 🎸    | `#200a2a`|
| Pinky Pac      | `#FF80AB` → `#F50057`                       | 💗    | `#2a0a15`|
| Inky Pac       | `#40C4FF` → `#0091EA`                       | 💙    | `#0a1a2a`|
| Blue Ghost     | `#448AFF` → `#2962FF`                       | 🔵    | `#0a1530`|
| Candy          | `#FF6E40` → `#FF3D00`                       | 🍬    | `#2a150a`|
| Pac-Man Extract| `#FFD740` → `#FF6F00`                       | 🎮    | `#2a1a00`|
| Robot v2       | `#B0BEC5` → `#546E7A`                       | 🦾    | `#151a1e`|
| Pinky Extract  | `#F48FB1` → `#EC407A`                       | 🩷    | `#2a1020`|

#### Ghost Models

| Model          | Gradient                                    | Emoji | Tint BG  |
|----------------|---------------------------------------------|-------|----------|
| Classic Sphere | `#FF1744` → `#D50000`                       | 👻    | `#2a0a0a`|
| Inky           | `#00E5FF` → `#00B8D4`                       | 👻    | `#0a2025`|
| Blue Ghost     | `#448AFF` → `#2962FF`                       | 👻    | `#0a1530`|
| Pinky          | `#FF80AB` → `#FF4081`                       | 👻    | `#2a0a18`|
| Candy Monsters | `#FFD740` → `#FF6D00`                       | 🍬    | `#2a1a00`|

---

## 3. Layout & Spacing

### Responsive Scaling System

All pixel values use the `upx()` helper function which scales based on viewport size:

```
UI_REFERENCE = 600px  →  1x scale
Viewport 300px       →  0.5x scale (minimum)
Viewport 780px+      →  1.3x scale (maximum)
```

Scale formula: `min(1.3, max(0.5, min(innerWidth, innerHeight) / 600))`

### Spacing Values (CSS `min()` for responsiveness)

| Context              | Value                        | Purpose                    |
|----------------------|------------------------------|----------------------------|
| Card padding         | `min(14px, 2vw)`             | Inner card spacing         |
| Grid gap             | `min(10px, 1.5vw)`           | Space between cards        |
| Section margin       | `min(16px, 2vh)`             | Between major sections     |
| Container padding    | `min(24px, 3vw)`             | Main container inner space |
| Tab padding          | `min(10px, 1.5vh)`           | Tab button inner space     |
| Start button padding | `min(16px, 2.5vh)` × `min(24px, 3vw)` | Start button   |

### Grid Layouts

| Grid                | Columns                                         | Usage                    |
|---------------------|-------------------------------------------------|--------------------------|
| Model grid          | `repeat(auto-fill, minmax(min(140px, 40vw), 1))`| Pac-Man & ghost models   |
| Image grid (small)  | `repeat(auto-fill, minmax(min(100px, 28vw), 1))`| HUD images, splash images|
| Font grid           | Same as model grid                              | Font selection cards     |

### Card Dimensions

| Element          | Size                    | Notes                          |
|------------------|-------------------------|--------------------------------|
| Card icon        | 56×56px (circle)        | Gradient background + emoji    |
| Card border      | 2px solid               | Highlights on hover/select     |
| Card radius      | 12px                    | Rounded corners                |
| Badge            | 8px font, auto width    | "3D" badge for GLTF models     |
| Checkmark        | 22×22px circle          | Gold, shown on selected card   |
| Image thumbnail  | 100% width × 60px height| `object-fit: contain`          |

---

## 4. Component Styles

### Asset Selector Overlay

- **Position**: Fixed, full viewport (`inset: 0`)
- **Z-index**: 9999
- **Background**: `radial-gradient(ellipse at 50% 20%, #0d1b2a 0%, #000 70%)`
- **Animation**: 0.4s fade-in
- **Fade-out**: 0.4s ease transition on close

### Container

- **Max width**: `min(95vw, 700px)`
- **Max height**: 92vh (scrollable)
- **Background**: `linear-gradient(180deg, #0d1b2a 0%, #0a0e1a 100%)`
- **Border**: 2px solid `#1b2838`
- **Radius**: 16px
- **Shadow**: `0 0 60px rgba(0, 100, 255, 0.15), 0 4px 30px rgba(0,0,0,0.8)`

### Cards

- **Background**: Model-specific dark tint (see card gradients table)
- **Border**: 2px solid `#1b2838`
- **Radius**: 12px
- **Hover**: Border → `#3a6a9a`, lift 2px, blue glow shadow
- **Selected**: Gold border, gold glow, gold checkmark appears

### Tabs

- **Inactive**: `#0d1b2a` bg, `#8899aa` text, `#1b2838` border
- **Hover**: `#162a40` bg, `#b0c0d0` text
- **Active**: Blue gradient bg, `#FFD700` text, gold border, gold glow

### Start Button

- **Background**: `linear-gradient(135deg, #FFD700 0%, #FFA500 100%)`
- **Text**: Black, bold, 3px letter-spacing
- **Radius**: 12px
- **Shadow**: `0 4px 20px rgba(255, 215, 0, 0.3)`
- **Hover**: Lift 2px, brightness 1.1, expanded shadow

### Style Toggle Buttons

- **Layout**: 2 columns, flex
- **Inactive**: `#0d1b2a` bg, `#8899aa` text
- **Active**: Gold-tinted bg, gold text, gold border + glow

### Font Preview Box

- **Background**: `#0a0e1a`
- **Border**: 2px solid `#1b2838`
- **Text**: `#FFD700`, dynamically set font-family
- **Content**: Numbers, alphabet, score/game-over sample

### Audio Toggles

- **Layout**: Flex row with checkbox + label
- **Background**: `#0d1b2a`
- **Border**: 1px solid `#1b2838`
- **Checkbox**: `accent-color: #FFD700`

---

## 5. In-Game HUD Elements

### Score Display

- **Position**: Fixed, top-right (`right: 20px`, `top: 15px`)
- **Z-index**: 10
- **Color**: `#FFD700` (gold)
- **Font**: Selected user font, `SCORE_FONT_SIZE` (24px × scale)
- **Shadow**: `2px 2px 4px #000`

### Lives Display

- **Position**: Fixed, top-left (`left: 20px`, `top: 15px`)
- **Z-index**: 10
- **Layout**: Flex row, gap 8px
- **Icon size**: 28×28px (scaled)
- **Source**: Selected pacman image or SVG fallback

### Jump Indicator

- **Position**: Fixed, bottom-right
- **Color**: `#FFD700` (active), `#aaaaaa` (cooldown)
- **Background**: `rgba(0, 0, 0, 0.5)`
- **Font**: Selected user font

### Pause Button

- **Position**: Fixed, top-right (`10px, 10px`)
- **Size**: 50×50px (scaled)
- **Background**: `#21265B`
- **Color**: `#FFD700`
- **Radius**: 8px

### Minimap (HUD)

- **Size**: 200×200px (scaled)
- **Position**: Bottom-left, offset by margin
- **Z-index**: 10
- **Scale**: Objects rendered at 2.5× in minimap

### Ghost Indicator

- **Position**: Fixed, bottom-left
- **Background**: `rgba(0,0,0,0.5)`
- **Border**: 1px solid `rgba(49,74,189,0.3)`
- **Radius**: 20px
- **Animation**: Scale pulse on ghost spawn

### Transient Text (Score popups, messages)

- **Position**: Fixed, center (50%, 30%)
- **Z-index**: 5000
- **Background**: `rgba(0,0,0,0.45)`
- **Radius**: 10px
- **Animation**: Fade + float up over 1.6s

### Countdown Overlay

- **Position**: Fixed, full viewport
- **Z-index**: 5000
- **Background**: `rgba(0,0,0,0.5)`
- **Font**: 120px (scaled), bold, gold
- **Animation**: Scale pop (1.5x → 1x), then GO! in green

### High Score Entry

- **Position**: Fixed, full viewport
- **Z-index**: 3000
- **Background**: `rgba(0,0,0,0.9)`
- **Box**: `#111` bg, 20px radius, gold text
- **Input**: `#222` bg, gold border/text, uppercase, 3-char max

### Game Over Screen

- **Position**: Fixed, full viewport
- **Z-index**: 2000
- **Background**: `rgba(0,0,0, 0.90)`
- **Box**: `#111d33` bg, 32px radius
- **Buttons**: Gold text, `#232e4a` bg, 18px radius
- **Hover**: `brightness(1.15)`

---

## 6. Animations & Transitions

| Element            | Property    | Duration | Easing         |
|--------------------|-------------|----------|----------------|
| Overlay fade-in    | opacity     | 0.4s     | ease           |
| Overlay fade-out   | opacity     | 0.4s     | ease           |
| Card hover         | transform   | 0.2s     | ease           |
| Card border        | all         | 0.2s     | ease           |
| Tab switch         | all         | 0.2s     | ease           |
| Start button hover | all         | 0.2s     | ease           |
| Ghost indicator    | opacity, transform | 0.3s | ease        |
| Minimap icons      | left, bottom| 0.15s    | linear         |
| Loading bar        | width       | 0.3s     | ease           |
| Loading pulse      | opacity     | 1.5s     | ease-in-out    |
| Countdown numbers  | transform, opacity | 0.3s | ease        |

---

## 7. Suggested Improvements

### Visual Enhancements

1. **Particle effects on card selection** — Spawn gold sparkles when selecting a model
2. **3D model preview** — Render a rotating preview of the selected 3D model using a small Three.js canvas in each card
3. **Animated background** — Add subtle floating dots/pellets in the overlay background
4. **Card flip animation** — Cards flip to reveal a preview on hover
5. **Sound preview buttons** — Small play buttons on each music track to preview before selecting

### UX Improvements

6. **Keyboard navigation** — Arrow keys to navigate cards, Enter to select
7. **"Randomize" button** — Pick random model/font/style combination
8. **Favorite system** — Star/favorite frequently used combinations
9. **Search/filter** — Filter models by type (built-in vs 3D)
10. **Preview mode** — Show a small 3D scene preview of the current selection at the bottom

### Layout Improvements

11. **Sticky header** — Keep title/tabs visible while scrolling long model lists
12. **Compact mode** — Toggle between detailed cards and compact list view
13. **Drag to reorder** — Let users drag cards to set custom order preference
14. **Grouped sections** — Group models by "Official" vs "Community" or by style

### Accessibility

15. **High contrast mode** — Option for brighter text and thicker borders
16. **Screen reader labels** — Add aria-labels to all interactive elements
17. **Reduced motion** — Respect `prefers-reduced-motion` media query

---

## 8. File Reference

| File                | Purpose                                    |
|---------------------|--------------------------------------------|
| `asset-manager.js`  | Asset registry, font loading, preferences  |
| `asset-selector.js` | UI overlay with inline CSS styles          |
| `pacman.js`         | Main game logic, HUD rendering, animations |
| `index.html`        | Entry point, importmap, module loader      |
| `levels.js`         | Level definitions (maze layouts)           |
| `challenge-levels.js` | Challenge level definitions              |
| `fruit.js`          | Fruit/power-up definitions                 |
| `puter-integration.js` | Cloud features (leaderboards, AI)       |
| `pacman-multiplayer.js` | Multiplayer via WebsimSocket           |
