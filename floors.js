/**
 * floors.js — Multi-Level Glass Floor System
 * ============================================================================
 * Creates stacked transparent glass floors in the shape of a cat silhouette,
 * each level outlined with neon-colored edge rails for a cyberpunk aesthetic.
 *
 * Import as: import { createCatFloorSystem, updateCatFloors, removeCatFloors } from './floors.js'
 *
 * Usage:
 *   const floors = createCatFloorSystem(scene, {
 *     levels: 4,
 *     spacing: 1.5,
 *     baseY: 0,
 *     scale: 3.0,
 *     glassOpacity: 0.15
 *   });
 *
 *   // In your animation loop:
 *   updateCatFloors(floors, deltaTime);
 *
 *   // Cleanup:
 *   removeCatFloors(scene, floors);
 */

import * as THREE from 'three';

// ─── Cat Silhouette Shape ────────────────────────────────────────────────────
//
// The cat shape is built with quadratic bezier curves to create a smooth,
// recognizable feline silhouette: rounded head, pointed ears, curved body,
// and a sweeping tail.

/**
 * Build a cat silhouette as a THREE.Shape.
 * The shape is centered at origin and designed to fit roughly within
 * a [-3, 3] × [-2.5, 2.5] bounding box.
 *
 * Anatomy reference:
 *   - Head: wide, rounded, centered near top
 *   - Ears: two triangles rising above the head
 *   - Body: tapered oval below the head
 *   - Tail: sweeping curve from the right side
 *
 * @param {number} [s=1.0] - Uniform scale factor for the shape
 * @returns {THREE.Shape}
 */
function createCatShape(s = 1.0) {
    const cat = new THREE.Shape();

    // ── Starting point: top of head, between the ears ──
    cat.moveTo(0 * s, 2.3 * s);

    // ── Right ear ──
    cat.quadraticCurveTo(0.2 * s, 2.9 * s, 0.9 * s, 2.8 * s);  // peak
    cat.quadraticCurveTo(1.3 * s, 2.4 * s, 1.15 * s, 1.9 * s);  // down to side

    // ── Right side of head / upper body ──
    cat.quadraticCurveTo(1.6 * s, 1.6 * s, 2.0 * s, 1.1 * s);  // cheek curve out
    cat.quadraticCurveTo(2.3 * s, 0.6 * s, 2.1 * s, 0.1 * s);  // taper to neck

    // ── Right body ──
    cat.quadraticCurveTo(2.5 * s, -0.4 * s, 2.4 * s, -0.9 * s); // shoulder
    cat.quadraticCurveTo(2.1 * s, -1.4 * s, 1.7 * s, -1.8 * s); // belly curve
    cat.quadraticCurveTo(1.0 * s, -2.1 * s, 0.3 * s, -2.2 * s); // lower belly

    // ── Bottom (between legs) ──
    cat.quadraticCurveTo(-0.3 * s, -2.2 * s, -1.0 * s, -2.1 * s); // across
    cat.quadraticCurveTo(-1.7 * s, -1.8 * s, -2.1 * s, -1.4 * s); // left belly up

    // ── Left body ──
    cat.quadraticCurveTo(-2.4 * s, -0.9 * s, -2.4 * s, -0.4 * s); // left shoulder
    cat.quadraticCurveTo(-2.2 * s, 0.1 * s, -1.9 * s, 0.6 * s);   // left neck

    // ── Left side of head ──
    cat.quadraticCurveTo(-2.1 * s, 1.1 * s, -1.8 * s, 1.6 * s);   // left cheek
    cat.quadraticCurveTo(-1.2 * s, 2.2 * s, -0.9 * s, 2.5 * s);   // up to ear base

    // ── Left ear ──
    cat.quadraticCurveTo(-0.6 * s, 2.9 * s, -0.1 * s, 2.7 * s);   // left ear peak
    cat.quadraticCurveTo(0.1 * s, 2.5 * s, 0 * s, 2.3 * s);       // back to top

    // ── Tail: a separate sub-path attached at the right side ──
    // Start from right-lower body
    cat.moveTo(2.3 * s, -0.5 * s);
    cat.quadraticCurveTo(3.4 * s, -0.6 * s, 3.8 * s, -1.2 * s);   // tail out
    cat.quadraticCurveTo(4.1 * s, -1.8 * s, 3.7 * s, -2.3 * s);   // tail down
    cat.quadraticCurveTo(3.2 * s, -2.5 * s, 2.8 * s, -2.0 * s);   // tail tip curl
    cat.quadraticCurveTo(2.6 * s, -1.5 * s, 2.4 * s, -1.2 * s);   // tail return
    cat.quadraticCurveTo(2.2 * s, -0.9 * s, 2.3 * s, -0.5 * s);   // back to body

    // ── Eye cutouts (subtractive holes using holes array) ──
    const leftEye = new THREE.Path();
    leftEye.moveTo(-0.6 * s, 1.4 * s);
    leftEye.quadraticCurveTo(-0.9 * s, 1.7 * s, -0.6 * s, 1.9 * s);
    leftEye.quadraticCurveTo(-0.3 * s, 1.7 * s, -0.6 * s, 1.4 * s);
    cat.holes.push(leftEye);

    const rightEye = new THREE.Path();
    rightEye.moveTo(0.6 * s, 1.4 * s);
    rightEye.quadraticCurveTo(0.9 * s, 1.7 * s, 0.6 * s, 1.9 * s);
    rightEye.quadraticCurveTo(0.3 * s, 1.7 * s, 0.6 * s, 1.4 * s);
    cat.holes.push(rightEye);

    // ── Nose triangle (small) ──
    const nose = new THREE.Path();
    nose.moveTo(0 * s, 0.85 * s);
    nose.lineTo(0.15 * s, 0.65 * s);
    nose.lineTo(-0.15 * s, 0.65 * s);
    nose.closePath();
    cat.holes.push(nose);

    return cat;
}

// ─── Neon Color Palette ──────────────────────────────────────────────────────
//
// Each floor level gets a distinct neon color for its edge rails.
// Colors cycle if there are more levels than palette entries.

const NEON_PALETTE = [
    { name: 'Cyan',     hex: '#00FFFF', rgb: [0.0, 1.0, 1.0] },
    { name: 'Magenta',  hex: '#FF00FF', rgb: [1.0, 0.0, 1.0] },
    { name: 'Lime',     hex: '#39FF14', rgb: [0.22, 1.0, 0.08] },
    { name: 'Amber',    hex: '#FFBF00', rgb: [1.0, 0.75, 0.0] },
    { name: 'HotPink',  hex: '#FF69B4', rgb: [1.0, 0.41, 0.71] },
    { name: 'ElectricBlue', hex: '#7DF9FF', rgb: [0.49, 0.98, 1.0] },
    { name: 'Lava',     hex: '#FF4500', rgb: [1.0, 0.27, 0.0] },
    { name: 'Violet',   hex: '#8B00FF', rgb: [0.55, 0.0, 1.0] },
];

// ─── Core API ────────────────────────────────────────────────────────────────

/**
 * Create the full multi-level glass cat floor system and add it to a scene.
 *
 * @param {THREE.Scene} scene - The Three.js scene to add floors to
 * @param {object} [opts] - Configuration options
 * @param {number} [opts.levels=4] - Number of glass floor levels
 * @param {number} [opts.spacing=1.5] - Vertical spacing between levels
 * @param {number} [opts.baseY=0] - Y position of the bottom floor
 * @param {number} [opts.scale=3.0] - Uniform scale of the cat shape
 * @param {number} [opts.glassOpacity=0.12] - Opacity of the glass floors
 * @param {number} [opts.railThickness=0.03] - Thickness of neon edge rails
 * @param {boolean} [opts.animated=true] - Enable subtle floating/glow animations
 * @returns {{ group: THREE.Group, floors: object[], rails: object[] }}
 */
export function createCatFloorSystem(scene, opts = {}) {
    const {
        levels = 4,
        spacing = 1.5,
        baseY = 0,
        scale = 3.0,
        glassOpacity = 0.12,
        railThickness = 0.03,
        animated = true,
    } = opts;

    const catShape = createCatShape(scale);
    const catPoints = catShape.getPoints(120); // 120 pts for smooth rails

    // ── Floor Group ──
    const group = new THREE.Group();
    group.name = 'cat-glass-floors';
    const floorData = [];

    for (let i = 0; i < levels; i++) {
        const y = baseY + i * spacing;
        const neonColor = NEON_PALETTE[i % NEON_PALETTE.length];

        // ── Glass floor pane ──
        const shapeGeom = new THREE.ShapeGeometry(catShape);
        // Slight extrude for thickness (glass has depth)
        const extrudeSettings = { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 };
        const floorGeom = new THREE.ExtrudeGeometry(catShape, extrudeSettings);
        floorGeom.translate(0, 0, -0.03); // center the thickness

        const floorMat = new THREE.MeshPhongMaterial({
            color: new THREE.Color(...neonColor.rgb),
            emissive: new THREE.Color(...neonColor.rgb),
            emissiveIntensity: 0.25,
            transparent: true,
            opacity: glassOpacity,
            side: THREE.DoubleSide,
            specular: 0xffffff,
            shininess: 100,
            depthWrite: false, // glass shouldn't block other glass below it
        });

        const floorMesh = new THREE.Mesh(floorGeom, floorMat);
        floorMesh.position.set(0, y, 0);
        floorMesh.renderOrder = i;
        floorMesh.userData = {
            level: i,
            color: neonColor,
            baseY: y,
            animated,
            animPhase: Math.random() * Math.PI * 2, // unique phase per level
        };
        group.add(floorMesh);

        // ── Neon edge rails ──
        // Top rail (above the glass)
        const topRailGeom = new THREE.BufferGeometry().setFromPoints(
            catPoints.map(p => new THREE.Vector3(p.x, p.y, 0.04))
        );
        // Close the loop
        const topClosed = [...catPoints, catPoints[0]];
        topRailGeom.setFromPoints(
            topClosed.map(p => new THREE.Vector3(p.x, p.y, 0.04))
        );

        const topRailLine = new THREE.Line(
            topRailGeom,
            new THREE.LineBasicMaterial({
                color: neonColor.hex,
                linewidth: 1,
                transparent: true,
                opacity: 0.9,
            })
        );
        topRailLine.position.set(0, y, 0);
        topRailLine.renderOrder = i + 0.5;
        group.add(topRailLine);

        // Bottom rail (below the glass for 3D depth)
        const bottomRailGeom = new THREE.BufferGeometry().setFromPoints(
            topClosed.map(p => new THREE.Vector3(p.x, p.y, -0.04))
        );
        const bottomRailLine = new THREE.Line(
            bottomRailGeom,
            new THREE.LineBasicMaterial({
                color: neonColor.hex,
                linewidth: 1,
                transparent: true,
                opacity: 0.5,
            })
        );
        bottomRailLine.position.set(0, y, 0);
        bottomRailLine.renderOrder = i + 0.5;
        group.add(bottomRailLine);

        // ── Vertical pillars / connecting struts at key points ──
        // Place small glowing pillars at corners of the cat
        const pillarPoints = [
            [-0.9 * scale, 2.5 * scale],  // left ear
            [0.9 * scale, 2.5 * scale],   // right ear
            [-2.0 * scale, 0.3 * scale],  // left body
            [2.0 * scale, 0.3 * scale],   // right body
            [-1.5 * scale, -1.8 * scale], // left bottom
            [1.5 * scale, -1.8 * scale],  // right bottom
            [3.7 * scale, -2.2 * scale],  // tail tip
        ];

        const pillarGeom = new THREE.CylinderGeometry(0.04, 0.04, spacing, 6);
        const pillarMat = new THREE.MeshPhongMaterial({
            color: neonColor.hex,
            emissive: neonColor.hex,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
        });

        pillarPoints.forEach(([px, py]) => {
            const pillar = new THREE.Mesh(pillarGeom, pillarMat);
            pillar.position.set(px, y + spacing / 2, 0);
            pillar.renderOrder = i + 0.3;
            pillar.userData = { level: i, animated, baseY: y + spacing / 2 };
            group.add(pillar);
        });

        // ── Glow discs at each pillar base/top ──
        const discGeom = new THREE.CylinderGeometry(0.08, 0.12, 0.03, 16);
        const discMat = new THREE.MeshPhongMaterial({
            color: neonColor.hex,
            emissive: neonColor.hex,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
        });

        pillarPoints.forEach(([px, py]) => {
            const topDisc = new THREE.Mesh(discGeom, discMat);
            topDisc.position.set(px, y + spacing, 0);
            topDisc.renderOrder = i + 0.4;
            group.add(topDisc);

            const bottomDisc = new THREE.Mesh(discGeom, discMat);
            bottomDisc.position.set(px, y, 0);
            bottomDisc.renderOrder = i + 0.4;
            group.add(bottomDisc);
        });

        // ── Inner glow mesh (subtle floor fill glow, slightly larger) ──
        const glowGeom = new THREE.ShapeGeometry(catShape);
        const glowMat = new THREE.MeshPhongMaterial({
            color: new THREE.Color(...neonColor.rgb),
            emissive: new THREE.Color(...neonColor.rgb),
            emissiveIntensity: 0.15,
            transparent: true,
            opacity: 0.04,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const glowMesh = new THREE.Mesh(glowGeom, glowMat);
        glowMesh.position.set(0, y, 0.01);
        glowMesh.renderOrder = i - 0.1;
        group.add(glowMesh);

        floorData.push({
            level: i,
            y,
            color: neonColor,
            floor: floorMesh,
            glow: glowMesh,
        });
    }

    scene.add(group);

    // Return metadata for animation updates
    return {
        group,
        floors: floorData,
        levels,
        spacing,
        baseY,
        animated,
    };
}

/**
 * Update animations for the cat floor system. Call this in your render loop.
 *
 * Animations include:
 *   - Gentle floating/bobbing per level
 *   - Glow pulsing on emissive materials
 *
 * @param {object} floorSystem - The object returned by createCatFloorSystem()
 * @param {number} deltaTime - Seconds since last frame
 * @param {number} [elapsed=0] - Total elapsed seconds (for continuous animation)
 */
export function updateCatFloors(floorSystem, deltaTime, elapsed = 0) {
    if (!floorSystem || !floorSystem.animated) return;

    const { group } = floorSystem;

    group.children.forEach(child => {
        if (!child.userData || !child.userData.animated) return;

        const { level, color, animPhase, baseY } = child.userData;
        const t = elapsed + animPhase;

        // Float the floor meshes gently
        if (child.isMesh && child.userData.baseY !== undefined) {
            const floatOffset = Math.sin(t * 0.6 + level * 0.7) * 0.06;
            child.position.y = baseY + floatOffset;

            // Pulse emissive intensity for a breathing glow
            const pulse = 0.7 + 0.3 * Math.sin(t * 1.5 + level * 1.2);
            if (child.material && child.material.emissiveIntensity !== undefined) {
                // Only pulse if it's a glow-related material (not structural)
                if (child.material.transparent && child.material.opacity < 0.5) {
                    child.material.emissiveIntensity = child.material.emissiveIntensity > 0.5
                        ? 0.5 + 0.3 * Math.sin(t * 2 + level)
                        : 0.12 + 0.08 * Math.sin(t * 1.5 + level * 1.2);
                }
            }
        }

        // Pulse opacity on the glow mesh
        if (child.isMesh && child.material && child.material.opacity < 0.1 && child.material.emissiveIntensity < 0.3) {
            const glowPulse = 0.03 + 0.03 * Math.sin(t * 2 + level);
            child.material.opacity = glowPulse;
        }
    });
}

/**
 * Remove the cat floor system from the scene and dispose all geometries/materials.
 *
 * @param {THREE.Scene} scene - The scene the floors were added to
 * @param {object} floorSystem - The object returned by createCatFloorSystem()
 */
export function removeCatFloors(scene, floorSystem) {
    if (!floorSystem || !floorSystem.group) return;

    const { group } = floorSystem;

    // Recursively dispose and remove
    group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
            } else {
                child.material.dispose();
            }
        }
    });

    scene.remove(group);
    floorSystem.group = null;
    floorSystem.floors = [];
}

/**
 * Get a neon color from the palette by index.
 * Useful for coordinating other scene elements with floor colors.
 *
 * @param {number} index
 * @returns {{ name: string, hex: string, rgb: number[] }}
 */
export function getNeonColor(index) {
    return NEON_PALETTE[index % NEON_PALETTE.length];
}
