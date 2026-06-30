/**
 * floors.js — 3D Pac-Man Cat-Head Game Map
 * ============================================================================
 * Multi-level glass floor system shaped like a cat head, with neon edge rails
 * of different colors per floor level, plus full Pac-Man game elements:
 * maze walls, collectible dots, power pellets, spawn points, and a legend.
 *
 * Import as:
 *   import { createCatHeadMap, CAT_HEAD_LEVEL, updateCatHeadMap, removeCatHeadMap } from './floors.js'
 *
 * Usage:
 *   // As a standalone visual:
 *   const map = createCatHeadMap(scene, { levels: 4 });
 *   updateCatHeadMap(map, deltaTime, elapsed);
 *   removeCatHeadMap(scene, map);
 *
 *   // As a Pac-Man level:
 *   import { CAT_HEAD_LEVEL } from './floors.js';
 *   // Pass CAT_HEAD_LEVEL to the game engine like any LEVELS[n]
 */

import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════════
// CAT-HEAD PAC-MAN LEVEL (Exportable Grid)
// ═══════════════════════════════════════════════════════════════════════════════
//
// A 25×30 cell Pac-Man level shaped like a cat's head silhouette.
// Legend:  # = wall   . = dot   o = power pellet   P = pacman spawn   G = ghost spawn

export const CAT_HEAD_LEVEL = [
    '            #############            ',
    '           ##...........##           ',
    '          #...............#          ',
    '         #.................#         ',
    '        #...###.....###.....#        ',
    '       #...####.....####....#       ',
    '      #....####.....####....#      ',
    '     #.....##.........##.....#     ',
    '    #..........................#    ',
    '   #............................#   ',
    '  #..............................#  ',
    ' #.........###.......###..........# ',
    ' #........####.......####.........# ',
    ' #.......#####.......#####........# ',
    ' #.......#####.......#####........# ',
    ' #.......#####.......#####........# ',
    ' #........###.........###.........# ',
    ' #.........#...........#...........# ',
    ' #.........#...........#...........# ',
    '  #........#...........#..........#  ',
    '   #.......#...........#.........#   ',
    '    #......#...........#........#    ',
    '     #.....##.........##.......#     ',
    '      #...####.......####......#      ',
    '       #..#####.......#####...#       ',
    '        #....................#        ',
    '         #........P.G.......#         ',
    '          #.......o.o......#          ',
    '           ##............##           ',
    '            ##############            ',
];

// ═══════════════════════════════════════════════════════════════════════════════
// CAT SILHOUETTE SHAPE (Three.js Shape)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Smooth bezier-curve cat head silhouette for the glass floor extrusions.
// This matches the vibe of the grid level above — rounded head, pointy ears,
// wide cheeks, and a rounded chin.

/**
 * Build a cat head silhouette as a THREE.Shape.
 * Centered at origin, fits roughly within [-2.5, 2.5] × [-3, 3].
 *
 * @param {number} [s=1.0] - Uniform scale factor
 * @returns {THREE.Shape}
 */
function createCatHeadShape(s = 1.0) {
    const cat = new THREE.Shape();

    // ── Top center (between ears) ──
    cat.moveTo(0, 2.8 * s);

    // ── Right ear ──
    cat.quadraticCurveTo(0.15 * s, 3.5 * s, 1.0 * s, 3.4 * s);   // ear peak
    cat.quadraticCurveTo(1.5 * s, 3.0 * s, 1.4 * s, 2.4 * s);    // ear inner

    // ── Right cheek ──
    cat.quadraticCurveTo(1.9 * s, 2.2 * s, 2.4 * s, 1.6 * s);    // cheek out
    cat.quadraticCurveTo(2.8 * s, 0.8 * s, 2.6 * s, 0.0 * s);    // cheek curve

    // ── Right jaw ──
    cat.quadraticCurveTo(2.4 * s, -0.7 * s, 1.8 * s, -1.3 * s);  // jaw line
    cat.quadraticCurveTo(1.2 * s, -1.8 * s, 0.5 * s, -2.1 * s);  // lower right

    // ── Chin ──
    cat.quadraticCurveTo(0.0 * s, -2.5 * s, -0.5 * s, -2.1 * s); // chin point

    // ── Left jaw ──
    cat.quadraticCurveTo(-1.2 * s, -1.8 * s, -1.8 * s, -1.3 * s); // lower left
    cat.quadraticCurveTo(-2.4 * s, -0.7 * s, -2.6 * s, 0.0 * s);  // jaw line

    // ── Left cheek ──
    cat.quadraticCurveTo(-2.8 * s, 0.8 * s, -2.4 * s, 1.6 * s);   // cheek curve
    cat.quadraticCurveTo(-1.9 * s, 2.2 * s, -1.4 * s, 2.4 * s);   // cheek in

    // ── Left ear ──
    cat.quadraticCurveTo(-1.5 * s, 3.0 * s, -1.0 * s, 3.4 * s);   // ear inner
    cat.quadraticCurveTo(-0.15 * s, 3.5 * s, 0, 2.8 * s);          // ear peak → center

    // ── Eye holes ──
    const leftEye = new THREE.Path();
    leftEye.moveTo(-0.9 * s, 1.5 * s);
    leftEye.quadraticCurveTo(-1.3 * s, 2.0 * s, -0.9 * s, 2.3 * s);
    leftEye.quadraticCurveTo(-0.5 * s, 2.0 * s, -0.9 * s, 1.5 * s);
    cat.holes.push(leftEye);

    const rightEye = new THREE.Path();
    rightEye.moveTo(0.9 * s, 1.5 * s);
    rightEye.quadraticCurveTo(1.3 * s, 2.0 * s, 0.9 * s, 2.3 * s);
    rightEye.quadraticCurveTo(0.5 * s, 2.0 * s, 0.9 * s, 1.5 * s);
    cat.holes.push(rightEye);

    // ── Nose ──
    const nose = new THREE.Path();
    nose.moveTo(0, 0.6 * s);
    nose.lineTo(0.18 * s, 0.35 * s);
    nose.lineTo(-0.18 * s, 0.35 * s);
    nose.closePath();
    cat.holes.push(nose);

    // ── Whisker dots (small circles) ──
    [[-1.6, 0.8], [-1.4, 0.6], [-1.2, 0.4], [1.6, 0.8], [1.4, 0.6], [1.2, 0.4]].forEach(([wx, wy]) => {
        const whisker = new THREE.Path();
        whisker.absarc(wx * s, wy * s, 0.06 * s, 0, Math.PI * 2, true);
        cat.holes.push(whisker);
    });

    return cat;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEON COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════════
//
// Each floor level uses one neon color. Colors cycle if there are more levels.

const NEON_PALETTE = [
    { name: 'Electric Cyan',     hex: '#00FFFF', rgb: [0.0, 1.0, 1.0],   level: 'Floor 1' },
    { name: 'Neon Magenta',      hex: '#FF00FF', rgb: [1.0, 0.0, 1.0],   level: 'Floor 2' },
    { name: 'Toxic Lime',        hex: '#39FF14', rgb: [0.22, 1.0, 0.08], level: 'Floor 3' },
    { name: 'Burning Amber',     hex: '#FFBF00', rgb: [1.0, 0.75, 0.0],  level: 'Floor 4' },
    { name: 'Hot Pink',          hex: '#FF69B4', rgb: [1.0, 0.41, 0.71], level: 'Floor 5' },
    { name: 'Electric Blue',     hex: '#7DF9FF', rgb: [0.49, 0.98, 1.0], level: 'Floor 6' },
    { name: 'Molten Lava',       hex: '#FF4500', rgb: [1.0, 0.27, 0.0],  level: 'Floor 7' },
    { name: 'Ultra Violet',      hex: '#8B00FF', rgb: [0.55, 0.0, 1.0],  level: 'Floor 8' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CORE: CREATE CAT-HEAD GAME MAP
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create the full multi-level cat-head Pac-Man game map.
 * Includes glass floors, neon rails, maze walls, dots, pellets, spawns, and legend.
 *
 * @param {THREE.Scene} scene
 * @param {object} [opts]
 * @param {number} [opts.levels=4]        - Number of glass floor levels
 * @param {number} [opts.spacing=1.8]     - Vertical spacing between levels
 * @param {number} [opts.baseY=-3]        - Y position of bottom floor
 * @param {number} [opts.scale=3.0]       - Cat head shape scale
 * @param {number} [opts.glassOpacity=0.10] - Glass floor opacity
 * @param {boolean} [opts.showMaze=true]  - Render maze walls on floors
 * @param {boolean} [opts.showDots=true]  - Render dot collectibles
 * @param {boolean} [opts.showLegend=true] - Render floating legend
 * @param {boolean} [opts.animated=true]  - Enable animations
 * @returns {{ group, floors, legend, levelData: string[][] }}
 */
export function createCatHeadMap(scene, opts = {}) {
    const {
        levels = 4,
        spacing = 1.8,
        baseY = -3,
        scale = 3.0,
        glassOpacity = 0.10,
        showMaze = true,
        showDots = true,
        showLegend = true,
        animated = true,
    } = opts;

    const catShape = createCatHeadShape(scale);
    const catPoints = catShape.getPoints(150);
    const grid = CAT_HEAD_LEVEL;
    const gridRows = grid.length;
    const gridCols = Math.max(...grid.map(r => r.length));
    const cellSize = 0.32 * scale;

    // ── Root Group ──
    const group = new THREE.Group();
    group.name = 'cat-head-pacman-map';
    const floorData = [];

    // ── Shared geometry instances (reused per floor) ──
    const wallGeom = new THREE.BoxGeometry(cellSize * 0.85, cellSize * 0.85, 0.12);
    const dotGeom = new THREE.SphereGeometry(cellSize * 0.12, 8, 6);
    const pelletGeom = new THREE.SphereGeometry(cellSize * 0.22, 12, 8);
    const spawnDiscGeom = new THREE.CylinderGeometry(cellSize * 0.25, cellSize * 0.25, 0.05, 24);

    // ── Build each floor level ──
    for (let i = 0; i < levels; i++) {
        const y = baseY + i * spacing;
        const neon = NEON_PALETTE[i % NEON_PALETTE.length];

        // ── Glass Floor Pane ──
        const extrudeSettings = {
            depth: 0.06, bevelEnabled: true,
            bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3,
        };
        const floorGeom = new THREE.ExtrudeGeometry(catShape, extrudeSettings);
        floorGeom.translate(0, 0, -0.03);

        const floorMat = new THREE.MeshPhongMaterial({
            color: new THREE.Color(...neon.rgb),
            emissive: new THREE.Color(...neon.rgb),
            emissiveIntensity: 0.20,
            transparent: true,
            opacity: glassOpacity,
            side: THREE.DoubleSide,
            specular: 0xffffff,
            shininess: 120,
            depthWrite: false,
        });
        const floorMesh = new THREE.Mesh(floorGeom, floorMat);
        floorMesh.position.set(0, y, 0);
        floorMesh.renderOrder = i;
        floorMesh.userData = { level: i, animated, baseY: y, animPhase: Math.random() * Math.PI * 2 };
        group.add(floorMesh);

        // ── Neon Edge Rails (top + bottom) ──
        const closed = [...catPoints, catPoints[0]];
        const topRail = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(closed.map(p => new THREE.Vector3(p.x, p.y, 0.04))),
            new THREE.LineBasicMaterial({ color: neon.hex, transparent: true, opacity: 0.95 })
        );
        topRail.position.set(0, y, 0);
        topRail.renderOrder = i + 0.5;
        group.add(topRail);

        const botRail = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(closed.map(p => new THREE.Vector3(p.x, p.y, -0.04))),
            new THREE.LineBasicMaterial({ color: neon.hex, transparent: true, opacity: 0.45 })
        );
        botRail.position.set(0, y, 0);
        botRail.renderOrder = i + 0.5;
        group.add(botRail);

        // ── Neon Pillars + Discs at key cat-head corners ──
        const pillarPts = [
            [-1.0 * scale, 3.0 * scale], [1.0 * scale, 3.0 * scale],   // ears
            [-2.5 * scale, 0.3 * scale], [2.5 * scale, 0.3 * scale],   // cheeks
            [-1.2 * scale, -1.5 * scale], [1.2 * scale, -1.5 * scale], // jaw
            [0, -2.3 * scale],                                          // chin
        ];
        const pillarGeom = new THREE.CylinderGeometry(0.05, 0.05, spacing, 8);
        const pillarMat = new THREE.MeshPhongMaterial({
            color: neon.hex, emissive: neon.hex, emissiveIntensity: 0.5,
            transparent: true, opacity: 0.45, depthWrite: false,
        });
        const discGeom = new THREE.CylinderGeometry(0.10, 0.14, 0.04, 20);
        const discMat = new THREE.MeshPhongMaterial({
            color: neon.hex, emissive: neon.hex, emissiveIntensity: 0.7,
            transparent: true, opacity: 0.6, depthWrite: false,
        });

        pillarPts.forEach(([px, py]) => {
            const p = new THREE.Mesh(pillarGeom, pillarMat);
            p.position.set(px, y + spacing / 2, 0);
            p.renderOrder = i + 0.3;
            p.userData = { level: i, animated, baseY: y + spacing / 2 };
            group.add(p);

            const td = new THREE.Mesh(discGeom, discMat);
            td.position.set(px, y + spacing, 0);
            td.renderOrder = i + 0.4;
            group.add(td);

            const bd = new THREE.Mesh(discGeom, discMat);
            bd.position.set(px, y, 0);
            bd.renderOrder = i + 0.4;
            group.add(bd);
        });

        // ── Inner Glow Fill ──
        const glowMesh = new THREE.Mesh(
            new THREE.ShapeGeometry(catShape),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color(...neon.rgb),
                emissive: new THREE.Color(...neon.rgb),
                emissiveIntensity: 0.12,
                transparent: true, opacity: 0.03,
                side: THREE.DoubleSide, depthWrite: false,
            })
        );
        glowMesh.position.set(0, y, 0.01);
        glowMesh.renderOrder = i - 0.1;
        group.add(glowMesh);

        // ═══════════════════════════════════════════════════════════════
        // PAC-MAN GAME ELEMENTS (Maze walls, dots, pellets, spawns)
        // ═══════════════════════════════════════════════════════════════

        const offsetX = -(gridCols / 2) * cellSize + cellSize / 2;
        const offsetY = -(gridRows / 2) * cellSize + cellSize / 2;

        for (let row = 0; row < gridRows; row++) {
            const line = grid[row];
            for (let col = 0; col < line.length; col++) {
                const ch = line[col];
                const wx = offsetX + col * cellSize;
                const wy = offsetY + row * cellSize;

                if (ch === '#') {
                    // ── Maze Wall (glass-like with neon tint) ──
                    if (showMaze) {
                        const wall = new THREE.Mesh(wallGeom, new THREE.MeshPhongMaterial({
                            color: new THREE.Color(...neon.rgb),
                            emissive: new THREE.Color(...neon.rgb),
                            emissiveIntensity: 0.08,
                            transparent: true,
                            opacity: 0.18,
                            side: THREE.DoubleSide,
                            depthWrite: false,
                        }));
                        wall.position.set(wx, wy, y + 0.06);
                        wall.renderOrder = i + 0.1;
                        wall.userData = { level: i, animated, baseY: wy, isWall: true };
                        group.add(wall);

                        // Wall edge neon outline
                        const hw = cellSize * 0.42;
                        const edgePts = [
                            new THREE.Vector3(wx - hw, wy - hw, y + 0.12),
                            new THREE.Vector3(wx + hw, wy - hw, y + 0.12),
                            new THREE.Vector3(wx + hw, wy + hw, y + 0.12),
                            new THREE.Vector3(wx - hw, wy + hw, y + 0.12),
                            new THREE.Vector3(wx - hw, wy - hw, y + 0.12),
                        ];
                        const edgeLine = new THREE.Line(
                            new THREE.BufferGeometry().setFromPoints(edgePts),
                            new THREE.LineBasicMaterial({ color: neon.hex, transparent: true, opacity: 0.35 })
                        );
                        edgeLine.renderOrder = i + 0.15;
                        group.add(edgeLine);
                    }
                } else if (ch === '.' && showDots) {
                    // ── Collectible Dot ──
                    const dot = new THREE.Mesh(dotGeom, new THREE.MeshPhongMaterial({
                        color: 0xFFD9B9,
                        emissive: 0xFFD9B9,
                        emissiveIntensity: 0.15,
                    }));
                    dot.position.set(wx, wy, y + 0.05);
                    dot.renderOrder = i + 0.05;
                    dot.userData = {
                        level: i, isDot: true, collected: false,
                        baseY: wy, animated, animPhase: Math.random() * Math.PI * 2,
                    };
                    group.add(dot);
                } else if (ch === 'o' && showDots) {
                    // ── Power Pellet ──
                    const pellet = new THREE.Mesh(pelletGeom, new THREE.MeshPhongMaterial({
                        color: 0xFFD9B9,
                        emissive: 0xFFD9B9,
                        emissiveIntensity: 0.30,
                    }));
                    pellet.position.set(wx, wy, y + 0.07);
                    pellet.renderOrder = i + 0.06;
                    pellet.userData = {
                        level: i, isPellet: true, collected: false,
                        baseY: wy, animated, animPhase: Math.random() * Math.PI * 2,
                    };
                    group.add(pellet);

                    // Pellet glow ring
                    const ring = new THREE.Mesh(
                        new THREE.TorusGeometry(cellSize * 0.23, cellSize * 0.03, 8, 12),
                        new THREE.MeshPhongMaterial({
                            color: neon.hex, emissive: neon.hex, emissiveIntensity: 0.5,
                            transparent: true, opacity: 0.3, depthWrite: false,
                        })
                    );
                    ring.position.set(wx, wy, y + 0.07);
                    ring.renderOrder = i + 0.055;
                    ring.userData = { level: i, animated, baseY: wy, animPhase: Math.random() * Math.PI * 2 };
                    group.add(ring);
                } else if (ch === 'P') {
                    // ── Pac-Man Spawn Marker ──
                    const spawnDisc = new THREE.Mesh(spawnDiscGeom, new THREE.MeshPhongMaterial({
                        color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.6,
                        transparent: true, opacity: 0.7,
                    }));
                    spawnDisc.position.set(wx, wy, y + 0.06);
                    spawnDisc.renderOrder = i + 0.08;
                    spawnDisc.userData = { level: i, isSpawn: true, spawnType: 'pacman', animated, baseY: wy };
                    group.add(spawnDisc);

                    // Spawn glow pillar
                    const spPillar = new THREE.Mesh(
                        new THREE.CylinderGeometry(cellSize * 0.08, cellSize * 0.08, 0.3, 12),
                        new THREE.MeshPhongMaterial({
                            color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.7,
                            transparent: true, opacity: 0.5, depthWrite: false,
                        })
                    );
                    spPillar.position.set(wx, wy, y + 0.15);
                    spPillar.renderOrder = i + 0.09;
                    spPillar.userData = { level: i, animated, baseY: wy + 0.15 };
                    group.add(spPillar);
                } else if (ch === 'G') {
                    // ── Ghost Spawn Marker ──
                    const gDisc = new THREE.Mesh(spawnDiscGeom, new THREE.MeshPhongMaterial({
                        color: 0xFF4444, emissive: 0xFF4444, emissiveIntensity: 0.5,
                        transparent: true, opacity: 0.6,
                    }));
                    gDisc.position.set(wx, wy, y + 0.06);
                    gDisc.renderOrder = i + 0.08;
                    gDisc.userData = { level: i, isSpawn: true, spawnType: 'ghost', animated, baseY: wy };
                    group.add(gDisc);

                    const gPillar = new THREE.Mesh(
                        new THREE.CylinderGeometry(cellSize * 0.06, cellSize * 0.06, 0.25, 12),
                        new THREE.MeshPhongMaterial({
                            color: 0xFF4444, emissive: 0xFF4444, emissiveIntensity: 0.6,
                            transparent: true, opacity: 0.45, depthWrite: false,
                        })
                    );
                    gPillar.position.set(wx, wy, y + 0.12);
                    gPillar.renderOrder = i + 0.09;
                    gPillar.userData = { level: i, animated, baseY: wy + 0.12 };
                    group.add(gPillar);
                }
            }
        }

        floorData.push({ level: i, y, color: neon, floor: floorMesh, glow: glowMesh });
    }

    scene.add(group);

    // ── Legend ──
    let legendGroup = null;
    if (showLegend) {
        legendGroup = createLegend(levels, spacing, baseY, scale);
        scene.add(legendGroup);
    }

    return { group, floors: floorData, legend: legendGroup, levels, spacing, baseY, animated };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING LEGEND HUD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a floating legend showing each floor's color and purpose.
 * Rendered as 3D text panels using sprites (canvas-based).
 *
 * @param {number} levels
 * @param {number} spacing
 * @param {number} baseY
 * @param {number} scale
 * @returns {THREE.Group}
 */
function createLegend(levels, spacing, baseY, scale) {
    const lg = new THREE.Group();
    lg.name = 'cat-head-legend';

    const legendX = 3.5 * scale;
    const legendZ = 0.1;

    for (let i = 0; i < levels; i++) {
        const neon = NEON_PALETTE[i % NEON_PALETTE.length];
        const y = baseY + i * spacing;

        // Color swatch (small glowing disc)
        const swatch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.03, 24),
            new THREE.MeshPhongMaterial({
                color: neon.hex, emissive: neon.hex, emissiveIntensity: 0.8,
                transparent: true, opacity: 0.8, depthWrite: false,
            })
        );
        swatch.position.set(legendX, y, legendZ);
        swatch.renderOrder = 999;
        lg.add(swatch);

        // Label via 3D sprite (canvas text)
        const labelSprite = makeTextSprite(
            `${neon.level}: ${neon.name}`,
            neon.hex, 256, 48, 20
        );
        labelSprite.position.set(legendX + 0.5, y, legendZ);
        labelSprite.scale.set(1.6, 0.3, 1);
        labelSprite.renderOrder = 999;
        lg.add(labelSprite);

        // Connecting line from swatch to floor rail
        const connLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(legendX + 0.2, y, legendZ),
                new THREE.Vector3(2.9 * scale, y, 0.04),
            ]),
            new THREE.LineBasicMaterial({ color: neon.hex, transparent: true, opacity: 0.3 })
        );
        connLine.renderOrder = 998;
        lg.add(connLine);
    }

    // ── Title ──
    const titleSprite = makeTextSprite(
        '🐱 CAT-HEAD MAP', '#FFD700', 512, 56, 26
    );
    titleSprite.position.set(legendX + 0.3, baseY + levels * spacing + 0.6, legendZ);
    titleSprite.scale.set(2.2, 0.3, 1);
    titleSprite.renderOrder = 999;
    lg.add(titleSprite);

    // ── Legend key items ──
    const keyY = baseY + levels * spacing;
    const keyItems = [
        { label: '🟡 = Dot', color: '#FFD9B9' },
        { label: '⭕ = Power Pellet', color: '#FFD700' },
        { label: '⬜ = Glass Wall', color: '#FFFFFF' },
        { label: '🔴 = Ghost Spawn', color: '#FF4444' },
    ];

    keyItems.forEach((item, ki) => {
        const ks = makeTextSprite(item.label, item.color, 256, 32, 14);
        ks.position.set(legendX + 0.3, keyY - 0.3 * (ki + 1), legendZ);
        ks.scale.set(1.2, 0.2, 1);
        ks.renderOrder = 999;
        lg.add(ks);
    });

    return lg;
}

/**
 * Create a text sprite using canvas.
 * @param {string} text
 * @param {string} color - CSS color
 * @param {number} cw - canvas width
 * @param {number} ch - canvas height
 * @param {number} fontSize
 * @returns {THREE.Sprite}
 */
function makeTextSprite(text, color, cw, ch, fontSize) {
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px "Press Start 2P", "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cw / 2, ch / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
    });
    return new THREE.Sprite(spriteMat);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION UPDATE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Update animations for the cat-head game map. Call in your render loop.
 *
 * @param {object} map - The object returned by createCatHeadMap()
 * @param {number} deltaTime - Seconds since last frame
 * @param {number} [elapsed=0] - Total elapsed seconds
 */
export function updateCatHeadMap(map, deltaTime, elapsed = 0) {
    if (!map || !map.animated) return;

    const { group } = map;
    group.children.forEach(child => {
        if (!child.userData || !child.userData.animated) return;
        const { level, animPhase, baseY } = child.userData;
        const t = elapsed + animPhase;

        // Float floor meshes and dot-like elements
        if (child.isMesh && baseY !== undefined) {
            const floatOff = Math.sin(t * 0.6 + level * 0.7) * 0.06;
            child.position.y = baseY + floatOff;

            // Pulsing glow on transparent materials
            if (child.material && child.material.emissiveIntensity !== undefined) {
                if (child.material.transparent && child.material.opacity < 0.5) {
                    child.material.emissiveIntensity =
                        child.material.emissiveIntensity > 0.4
                            ? 0.4 + 0.2 * Math.sin(t * 1.5 + level)
                            : 0.10 + 0.06 * Math.sin(t * 1.2 + level);
                }
            }
        }

        // Pulsing dots
        if (child.userData.isDot && !child.userData.collected) {
            const s = 0.85 + 0.15 * Math.sin(t * 3 + child.userData.animPhase);
            child.scale.setScalar(s);
        }

        // Pulsing pellets
        if (child.userData.isPellet && !child.userData.collected) {
            const s = 0.9 + 0.15 * Math.sin(t * 2.5 + child.userData.animPhase);
            child.scale.setScalar(s);
        }

        // Rotating spawn markers
        if (child.userData.isSpawn) {
            child.rotation.z += deltaTime * 1.5;
        }
    });

    // Legend sway
    if (map.legend) {
        map.legend.position.x = 3.0 + Math.sin(elapsed * 0.4) * 0.15;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Remove the cat-head map from scene and dispose all resources.
 *
 * @param {THREE.Scene} scene
 * @param {object} map - The object returned by createCatHeadMap()
 */
export function removeCatHeadMap(scene, map) {
    if (!map || !map.group) return;
    const { group, legend } = map;

    [group, legend].forEach(g => {
        if (!g) return;
        g.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
                } else {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            }
        });
        scene.remove(g);
    });

    map.group = null;
    map.legend = null;
    map.floors = [];
}

/**
 * Get a neon color from the palette by index.
 * @param {number} index
 * @returns {{ name: string, hex: string, rgb: number[], level: string }}
 */
export function getNeonColor(index) {
    return NEON_PALETTE[index % NEON_PALETTE.length];
}

// ─── Legacy API (backward-compatible with previous floors.js) ────────────────
export { createCatHeadMap as createCatFloorSystem };
export { updateCatHeadMap as updateCatFloors };
export { removeCatHeadMap as removeCatFloors };
