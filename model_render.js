/**
 * model_render.js — 3D Model Rendering Pipeline
 * ============================================================================
 * Centralizes all 3D model loading, scaling, and orientation logic.
 * Each model has its own configuration section for fine-tuned scale/rotation.
 *
 * Import as: import * as ModelRender from './model_render.js'
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as Assets from './asset-manager.js';

// ─── Model Cache ────────────────────────────────────────────────────────────

/**
 * Cache of loaded-and-setup GLTF model scenes, keyed by model path.
 * When a model is reused, we deep-clone the cached scene instead of
 * hitting the network again. Materials are cloned per-instance so that
 * per-entity changes (e.g. ghost fright-mode tinting) don't leak across
 * instances.
 *
 * Structure: Map<string, { scene: THREE.Object3D, modelId: string, type: string }>
 */
const _modelCache = new Map();

/**
 * Deep-clone a THREE.Object3D hierarchy with independent material copies.
 * Unlike Object3D.clone(true) which shares material references, this creates
 * fresh material instances per clone so per-entity modifications are isolated.
 *
 * @param {THREE.Object3D} source - The source scene root to clone
 * @returns {THREE.Object3D} A deep clone with independent materials
 */
function deepCloneScene(source) {
    const clone = source.clone(false); // shallow clone of the root

    source.children.forEach(child => {
        clone.add(deepCloneNode(child));
    });

    return clone;
}

/**
 * Recursively clone a node, creating independent material copies for meshes.
 */
function deepCloneNode(node) {
    const cloned = node.clone(false);

    // Clone materials independently so per-instance changes don't propagate
    if (node.isMesh && node.material) {
        if (Array.isArray(node.material)) {
            cloned.material = node.material.map(m => m.clone());
        } else {
            cloned.material = node.material.clone();
        }
    }

    // Recursively clone children
    node.children.forEach(child => {
        cloned.add(deepCloneNode(child));
    });

    return cloned;
}

/**
 * Remove a specific model from the cache (e.g., if the model file was updated).
 * @param {string} cacheKey - The cache key (model path) to invalidate
 */
export function invalidateCachedModel(cacheKey) {
    _modelCache.delete(cacheKey);
}

/**
 * Clear the entire model cache. Call when switching levels/modes or when
 * asset preferences change to force fresh loads.
 */
export function clearModelCache() {
    _modelCache.clear();
}

/**
 * Returns the number of cached models.
 * @returns {number}
 */
export function getModelCacheSize() {
    return _modelCache.size;
}

// ─── Core Constants ─────────────────────────────────────────────────────────

/**
 * Base Y-up to Z-up rotation applied to all Sketchfab/glTF models.
 * The game world uses Z as up; most 3D models export with Y as up.
 */
const Y_UP_TO_Z_UP = { x: -Math.PI / 2, y: 0, z: 0 };

// ─── Per-Model Configuration ────────────────────────────────────────────────
//
// Each model entry supports these tuning fields:
//   targetRadius     — Override auto-normalize target (default: uses type's radius)
//   scaleMultiplier  — Applied AFTER auto-normalize (default: 1.0)
//   rotation         — { x, y, z } ADDED to the base Y-up→Z-up rotation (default: 0,0,0)
//   description      — Human-readable description for the config section
//

// ─── Pac-Man Model Configurations ───────────────────────────────────────────
//
// Auto-normalize target: PACMAN_RADIUS * 2 = 0.5 (targetDiagonal ≈ 1.732)
// Each model's raw (pre-normalize) diagonal is noted for context.
//
// Config fields:
//   targetRadius     — Override auto-normalize target (null = use type default)
//   scaleMultiplier  — Applied AFTER auto-normalize; >1.0 = bigger, <1.0 = smaller
//   rotation         — { x, y, z } radians ADDED to base Y-up→Z-up (-π/2, 0, 0)
//   description      — Human-readable label
//
// Bounding box data (computed from GLTF accessor min/max — local mesh space):
//   diag = raw diagonal | size = w×d×h | asp = max/min aspect ratio
//   ⚠️ = off-center (mesh not centered at origin — may appear shifted in-game)
//
// Tuning notes:
//   • autoNormalizeScale() makes all models fill the same bounding-sphere diagonal
//   • scaleMultiplier is for SUBTLE adjustments (e.g. 0.85–1.15)
//   • Tall models (high Z range) become tall in world-Y after Y→Z rotation
//   • All models have Sketchfab root-matrix Y→Z rotation baked into node hierarchy

const PACMAN_MODEL_CONFIG = {
    classic: {
        description: 'Classic Sphere — built-in geometric, no model file',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    yellow: {
        // diag=4.734  size=2.00×2.00×3.80  asp=1.90  ⚠️ off-center
        description: 'Yellow Pac-Man — tall character, slightly off-center',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable 0.85–1.15 */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    robo: {
        // diag=4.437  size=2.56×2.56×2.56  asp=1.00  perfectly symmetrical
        description: 'Robot Pac-Man — mechanical-style, symmetrical',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    girl: {
        // diag=5.697  size=3.87×2.96×2.95  asp=1.31  ⚠️ off-center
        description: 'Girl Pac-Man — animated, slightly wide',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable 0.85–1.15 */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    pixel: {
        // diag≈3.35  size≈1.98×1.98×1.85  asp≈1.07  (skinned, complex hierarchy)
        description: 'Pixel Pac-Man — pixel-art style with armature',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    rockin: {
        // diag=0.624  size=0.43×0.24×0.38  asp=1.83  ⚠️ off-center  ⚠️ very small
        description: "Rock 'n Roll Pac-Man — small model, auto-scaled up ~2.8×",
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable 0.8–1.2 */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    pacManExtract: {
        // diag=247.22  size=75×152×180  asp=2.41  ⚠️ enormous (auto-scaled to ~0.007×)
        description: 'Pac-Man (Extract) — very large model, extreme auto-shrink',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable 0.5–2.0 */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    robotPac: {
        // diag=4.437  size=2.56×2.56×2.56  asp=1.00  perfectly symmetrical
        description: 'Robot Pac-Man v2 — symmetrical variant',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    // ── Ghost models usable as pac-man (cross-type) ──
    pinkyPac: {
        // diag=13.84  size=8.22×8.73×6.91  asp=1.26  ⚠️ off-center
        description: 'Pinky Pac-Man — pinky ghost as pac-man',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    inkyPac: {
        // diag=4.734  size=2.00×2.00×3.80  asp=1.90  ⚠️ off-center
        description: 'Inky Pac-Man — blue ghost as pac-man, tall character',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    bluePac: {
        // diag≈2.97  size≈1.62×1.61×1.90  asp≈1.18
        description: 'Blue Ghost Pac-Man — blue ghost character as pac-man',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    candyPac: {
        // diag=9.59  size=7.54×4.42×3.95  asp=1.91
        description: 'Candy Pac-Man — candy monster as pac-man, elongated',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    pinkyExtract: {
        // diag=13.84  size=8.22×8.73×6.91  asp=1.26  ⚠️ off-center
        description: 'Pinky Extract — pinky ghost as pac-man (copy)',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    }
};

// ─── Ghost Model Configurations ────────────────────────────────────────────
//
// Auto-normalize target: GHOST_RADIUS * 2 = 0.625 (targetDiagonal ≈ 2.165)
// Same tuning fields as pac-man configs above.
//
// Bounding box data: see pac-man config header for legend.

const GHOST_MODEL_CONFIG = {
    classic: {
        description: 'Classic Sphere — built-in geometric, no model file',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    inky: {
        // diag=4.734  size=2.00×2.00×3.80  asp=1.90  ⚠️ off-center
        description: 'Inky (Blue Ghost) — tall character with animated eyes',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable 0.85–1.15 */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    blueGhost: {
        // diag≈2.97  size≈1.62×1.61×1.90  asp≈1.18
        description: 'Blue Ghost Character — slightly tall, textures',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    pinky: {
        // diag=13.84  size=8.22×8.73×6.91  asp=1.26  ⚠️ off-center
        description: 'Pinky Ghost — large model, off-center',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    },
    candy: {
        // diag=9.59  size=7.54×4.42×3.95  asp=1.91
        description: 'Candy Monsters — elongated X, candy-colored',
        targetRadius: null,
        scaleMultiplier: 1.0,   /* @tweakable */
        rotation: { x: 0, y: 0, z: 0 }  /* @tweakable */
    }
};

// ─── Configuration Access ──────────────────────────────────────────────────

/**
 * Get the rendering configuration for a given model.
 * @param {string} type - 'pacman' or 'ghost'
 * @param {string} modelId - The model identifier
 * @returns {object} The model's configuration
 */
export function getModelConfig(type, modelId) {
    const configs = type === 'pacman' ? PACMAN_MODEL_CONFIG : GHOST_MODEL_CONFIG;
    // Fall back to default config if specific model not found
    return configs[modelId] || {
        description: `Auto-config for ${modelId}`,
        targetRadius: null,
        scaleMultiplier: 1.0,
        rotation: { x: 0, y: 0, z: 0 }
    };
}

/**
 * Get the full list of available model configs for a given type.
 * @param {string} type - 'pacman' or 'ghost'
 * @returns {object} Map of modelId → config
 */
export function getAllModelConfigs(type) {
    return type === 'pacman' ? PACMAN_MODEL_CONFIG : GHOST_MODEL_CONFIG;
}

// ─── Internal Helpers ──────────────────────────────────────────────────────

/**
 * Copy game entity properties from a placeholder to a loaded model (or wrapper).
 * Used by both cache-hit and cache-miss paths to avoid duplication.
 */
function _applyPacmanProperties(model, placeholder) {
    model.position.copy(placeholder.position);
    model.isPacman = true;
    model.isWrapper = true;
    model.atePellet = placeholder.atePellet;
    model.distanceMoved = placeholder.distanceMoved;
    model.direction = placeholder.direction.clone();
    model.isJumping = placeholder.isJumping;
    model.jumpStartTime = placeholder.jumpStartTime;
    model.jumpHeight = placeholder.jumpHeight;
    model.jumpDuration = placeholder.jumpDuration;
    model.jumpCooldown = placeholder.jumpCooldown;
    model.initialJumpRotation = placeholder.initialJumpRotation;
    model.isModel = true;
    // modelId is already set on userData by setupLoadedModel (via cache)
}

function _applyGhostProperties(model, placeholder, ghostId) {
    model.position.copy(placeholder.position);
    model._ghostId = ghostId;
    model.isGhost = true;
    model.isWrapper = true;
    model.isAfraid = placeholder.isAfraid;
    model.colorIndex = placeholder.colorIndex;
    model.direction = placeholder.direction.clone();
    model.isModel = true;
}

function _swapPlaceholder(scene, placeholder, model) {
    scene.remove(placeholder);
    scene.add(model);
}

// ─── Model Loading & Setup Pipeline ─────────────────────────────────────────

/**
 * Auto-normalize a loaded model's scale so it fits within a target bounding sphere.
 * Uses the diagonal method: model_diagonal → target_diagonal ratio.
 *
 * @param {THREE.Object3D} model - The loaded model's scene root
 * @param {number} targetRadius - Desired bounding sphere radius (e.g., PACMAN_RADIUS * 2)
 * @returns {number} The computed scale factor applied
 */
export function autoNormalizeScale(model, targetRadius) {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);

    const diagonal = Math.sqrt(
        size.x * size.x + size.y * size.y + size.z * size.z
    );

    if (diagonal > 0) {
        // targetDiagonal = side_length * sqrt(3), where side = targetRadius * 2
        const targetDiagonal = targetRadius * 2 * Math.sqrt(3);
        const scale = targetDiagonal / diagonal;
        model.scale.set(scale, scale, scale);
        return scale;
    }

    // Zero-size model (unlikely) — fall back to absolute scale
    const fallbackScale = targetRadius * 2;
    model.scale.set(fallbackScale, fallbackScale, fallbackScale);
    return fallbackScale;
}

/**
 * Apply orientation to a loaded model.
 * All Sketchfab/glTF models get the base Y-up→Z-up rotation,
 * plus any per-model rotation overrides.
 *
 * @param {THREE.Object3D} model - The loaded model's scene root
 * @param {string} modelId - The model identifier
 * @param {string} type - 'pacman' or 'ghost'
 */
export function applyOrientation(model, modelId, type) {
    const config = getModelConfig(type, modelId);

    // Base: rotate from Y-up (Sketchfab) to Z-up (game world)
    model.rotation.set(
        Y_UP_TO_Z_UP.x + (config.rotation.x || 0),
        Y_UP_TO_Z_UP.y + (config.rotation.y || 0),
        Y_UP_TO_Z_UP.z + (config.rotation.z || 0)
    );
}

/**
 * Complete setup of a loaded 3D model: normalize scale and apply orientation.
 * Returns the model with scale and rotation applied, ready for game use.
 *
 * @param {THREE.Object3D} model - The loaded model's scene root
 * @param {string} modelId - The model identifier
 * @param {string} type - 'pacman' or 'ghost'
 * @param {number} defaultTargetRadius - Fallback target radius if model config doesn't specify one
 * @returns {THREE.Object3D} The model (mutated in place)
 */
export function setupLoadedModel(model, modelId, type, defaultTargetRadius) {
    const config = getModelConfig(type, modelId);
    const targetRadius = config.targetRadius || defaultTargetRadius;

    // Step 1: Reset to neutral scale, then auto-normalize
    model.scale.set(1, 1, 1);
    const baseScale = autoNormalizeScale(model, targetRadius);

    // Step 2: Apply per-model scale multiplier
    if (config.scaleMultiplier !== 1.0) {
        model.scale.multiplyScalar(config.scaleMultiplier);
    }

    // Step 3: Apply orientation (Y-up→Z-up + per-model rotation)
    applyOrientation(model, modelId, type);

    // Step 4: Auto-center off-center models
    // Some models have mesh geometry offset from origin; wrapping them in a
    // centering group prevents wobble when the game rotates the entity.
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const size = new THREE.Vector3();
    box.getSize(size);
    const diagonal = Math.sqrt(
        size.x * size.x + size.y * size.y + size.z * size.z
    );
    const centerOffset = center.length();
    const needsCentering = diagonal > 0 && centerOffset > diagonal * 0.12;

    // Store original scale for potential runtime adjustments
    const scaleInfo = {
        originalScale: targetRadius * 2,
        baseScaleFactor: baseScale,
        modelId: modelId
    };

    if (needsCentering) {
        // Wrap model in a centering group so rotation happens around visual center
        const wrapper = new THREE.Group();
        wrapper.add(model);
        model.position.set(-center.x, -center.y, -center.z);

        // Copy metadata to wrapper (game code may reference it)
        wrapper.userData = Object.assign(wrapper.userData || {}, scaleInfo, {
            isCenteringWrapper: true,
            centerOffset: { x: center.x, y: center.y, z: center.z }
        });

        // Also store on inner model for introspection
        model.userData = Object.assign(model.userData || {}, scaleInfo);

        return wrapper;
    }

    // Model is already centered — no wrapper needed
    model.userData = Object.assign(model.userData || {}, scaleInfo);

    return model;
}

// ─── Placeholder Creation ──────────────────────────────────────────────────

/**
 * Create a placeholder sphere mesh shown while the GLTF model loads.
 *
 * @param {number} radius - Placeholder sphere radius
 * @param {string|number} color - Color (hex string or number)
 * @param {THREE.Vector3} position - World position
 * @param {number} opacity - Material opacity (0-1)
 * @returns {THREE.Mesh} The placeholder mesh
 */
export function createPlaceholder(radius, color, position, opacity) {
    const geometry = new THREE.SphereGeometry(radius, 8, 8);
    const material = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: opacity !== undefined ? opacity : 0.3
    });
    const placeholder = new THREE.Mesh(geometry, material);
    placeholder.position.copy(position);
    return placeholder;
}

// ─── Ghost Color Tinting ────────────────────────────────────────────────────

/**
 * Traverse a ghost model and store original material colors for fright mode toggling.
 * Called after the model is loaded and before it enters the scene.
 *
 * @param {THREE.Object3D} model - The loaded ghost model
 */
export function storeGhostMaterialColors(model) {
    model.traverse(function (child) {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                    mat.userData = mat.userData || {};
                    mat.userData.originalColor = mat.color ? mat.color.getHex() : null;
                });
            } else if (child.material.color) {
                child.material.userData = child.material.userData || {};
                child.material.userData.originalColor = child.material.color.getHex();
            }
        }
    });
}

// ─── Full Model Creation Pipelines ──────────────────────────────────────────

/**
 * Create a GLTF-based Pac-Man game model.
 * Creates a placeholder immediately, then loads and swaps in the GLTF model asynchronously.
 *
 * @param {THREE.Scene} scene - The game scene
 * @param {THREE.Vector3} position - Spawn position
 * @param {number} pacmanRadius - PACMAN_RADIUS for scaling
 * @param {string} modelId - The model identifier from asset preferences
 * @param {function(number):void} [onProgress] - Optional loading progress callback
 * @returns {{ placeholder: THREE.Mesh, promise: Promise<THREE.Object3D> }}
 */
export function createPacmanModel(scene, position, pacmanRadius, modelId, onProgress) {
    const modelDef = Assets.PACMAN_MODELS[modelId];
    const cacheKey = `pacman:${modelId}`;

    // Create placeholder
    const placeholder = createPlaceholder(pacmanRadius, 'yellow', position, 0.3);
    placeholder.isPacman = true;
    placeholder.isWrapper = true;
    placeholder.atePellet = false;
    placeholder.distanceMoved = 0;
    placeholder.direction = new THREE.Vector3(-1, 0, 0);
    placeholder.isModelLoading = true;
    placeholder.isJumping = false;
    placeholder.jumpStartTime = 0;
    placeholder.jumpHeight = 0;    // set by caller
    placeholder.jumpDuration = 0;   // set by caller
    placeholder.jumpCooldown = 0;
    placeholder.initialJumpRotation = 0;

    scene.add(placeholder);

    // ── Cache hit: deep-clone the cached scene, apply per-instance props ──
    const cached = _modelCache.get(cacheKey);
    if (cached) {
        const model = deepCloneScene(cached.scene);
        _applyPacmanProperties(model, placeholder);
        _swapPlaceholder(scene, placeholder, model);

        return { placeholder, promise: Promise.resolve(model) };
    }

    // ── Cache miss: load from network, cache, then apply per-instance props ──
    const loader = new GLTFLoader();

    const loadPromise = new Promise((resolve, reject) => {
        Assets.loadSketchfabModel(modelDef.path, loader, function (gltf) {
            // Clone before caching so the cached original stays pristine
            const rawScene = gltf.scene.clone(true);

            // Scale, orient, and center the cached copy
            // Returns a centering wrapper if model is off-center, otherwise the model itself
            const entity = setupLoadedModel(rawScene, modelId, 'pacman', pacmanRadius * 2);

            // Store in cache (after setup, before per-instance properties)
            _modelCache.set(cacheKey, { scene: entity, modelId, type: 'pacman' });

            // Deep-clone the entity (wrapper or model) for this instance
            const model = deepCloneScene(entity);
            _applyPacmanProperties(model, placeholder);
            _swapPlaceholder(scene, placeholder, model);

            resolve(model);
        }, onProgress, function (error) {
            console.warn('Failed to load pacman model "' + modelDef.path + '", using placeholder', error);
            // Revert placeholder to fully visible fallback
            placeholder.material.opacity = 1;
            placeholder.material.color.setHex(0xffff00);
            placeholder.isModelLoading = false;
            reject(error);
        });
    });

    return { placeholder, promise: loadPromise };
}

/**
 * Create a GLTF-based Ghost game model.
 * Creates a placeholder immediately, then loads and swaps in the GLTF model asynchronously.
 *
 * @param {THREE.Scene} scene - The game scene
 * @param {THREE.Vector3} position - Spawn position
 * @param {number} ghostRadius - GHOST_RADIUS for scaling
 * @param {string} modelId - The model identifier from asset preferences
 * @param {number} ghostId - Unique ghost ID
 * @param {string} ghostColor - Hex color for the placeholder
 * @param {number} colorIndex - Ghost color index
 * @param {function(number):void} [onProgress] - Optional loading progress callback
 * @returns {{ placeholder: THREE.Mesh, promise: Promise<THREE.Object3D> }}
 */
export function createGhostModel(scene, position, ghostRadius, modelId, ghostId, ghostColor, colorIndex, onProgress) {
    const modelDef = Assets.GHOST_MODELS[modelId];
    const cacheKey = `ghost:${modelId}`;

    // Create placeholder
    const placeholder = createPlaceholder(ghostRadius, ghostColor, position, 0.3);
    placeholder.isGhost = true;
    placeholder.isWrapper = true;
    placeholder.isAfraid = false;
    placeholder.colorIndex = colorIndex;
    placeholder.direction = new THREE.Vector3(-1, 0, 0);
    placeholder.isModelLoading = true;
    placeholder._ghostId = ghostId;

    scene.add(placeholder);

    // ── Cache hit: deep-clone the cached scene, apply per-instance props ──
    const cached = _modelCache.get(cacheKey);
    if (cached) {
        const model = deepCloneScene(cached.scene);
        _applyGhostProperties(model, placeholder, ghostId);
        // Materials are already independent thanks to deepCloneScene
        storeGhostMaterialColors(model);
        _swapPlaceholder(scene, placeholder, model);

        return { placeholder, promise: Promise.resolve(model) };
    }

    // ── Cache miss: load from network, cache, then apply per-instance props ──
    const loader = new GLTFLoader();

    const loadPromise = new Promise((resolve, reject) => {
        Assets.loadSketchfabModel(modelDef.path, loader, function (gltf) {
            // Clone before caching so the cached original stays pristine
            const rawScene = gltf.scene.clone(true);

            // Scale, orient, and center the cached copy
            const entity = setupLoadedModel(rawScene, modelId, 'ghost', ghostRadius * 2);

            // Store in cache (after setup, before per-instance properties)
            _modelCache.set(cacheKey, { scene: entity, modelId, type: 'ghost' });

            // Deep-clone the entity (wrapper or model) for this instance
            const model = deepCloneScene(entity);
            _applyGhostProperties(model, placeholder, ghostId);
            storeGhostMaterialColors(model);
            _swapPlaceholder(scene, placeholder, model);

            resolve(model);
        }, onProgress, function (error) {
            console.warn('Failed to load ghost model "' + modelDef.path + '", using placeholder', error);
            // Revert placeholder to fully visible
            placeholder.material.opacity = 0.9;
            placeholder.isModelLoading = false;
            reject(error);
        });
    });

    return { placeholder, promise: loadPromise };
}

// ─── Classic (Built-in) Models ──────────────────────────────────────────────

/**
 * Create the classic sphere-based Pac-Man (no GLTF model).
 * Used when modelId is 'classic' or as fallback.
 *
 * @param {THREE.Scene} scene - The game scene
 * @param {THREE.Vector3} position - Spawn position
 * @param {number} pacmanRadius - PACMAN_RADIUS
 * @param {Array<THREE.SphereGeometry>} geometries - Pre-built mouth animation geometries
 * @param {THREE.MeshPhongMaterial} material - Shared pacman material
 * @returns {THREE.Mesh} The classic pacman mesh
 */
export function createClassicPacman(scene, position, pacmanRadius, geometries, material) {
    const pacman = new THREE.Mesh(geometries[0], material);
    pacman.geometries = geometries;
    pacman.currentFrame = 0;
    pacman.isPacman = true;
    pacman.isWrapper = true;
    pacman.atePellet = false;
    pacman.distanceMoved = 0;
    pacman.position.copy(position);
    pacman.direction = new THREE.Vector3(-1, 0, 0);
    pacman.isJumping = false;
    pacman.jumpStartTime = 0;
    pacman.jumpHeight = 0;    // set by caller
    pacman.jumpDuration = 0;   // set by caller
    pacman.jumpCooldown = 0;
    pacman.initialJumpRotation = 0;

    scene.add(pacman);
    return pacman;
}

/**
 * Create the classic sphere-based Ghost (no GLTF model).
 * Used when modelId is 'classic' or as fallback.
 *
 * @param {THREE.Scene} scene - The game scene
 * @param {THREE.Vector3} position - Spawn position
 * @param {number} ghostRadius - GHOST_RADIUS
 * @param {string} ghostColor - Hex color string
 * @param {number} colorIndex - Ghost color index
 * @param {number} ghostId - Unique ghost ID
 * @returns {THREE.Mesh} The classic ghost mesh
 */
export function createClassicGhost(scene, position, ghostRadius, ghostColor, colorIndex, ghostId) {
    const geometry = new THREE.SphereGeometry(ghostRadius, 16, 16);
    const material = new THREE.MeshPhongMaterial({
        color: ghostColor,
        transparent: true,
        opacity: 0.9
    });
    const ghost = new THREE.Mesh(geometry, material);
    ghost.isGhost = true;
    ghost.isWrapper = true;
    ghost.isAfraid = false;
    ghost.colorIndex = colorIndex;
    ghost.position.copy(position);
    ghost.direction = new THREE.Vector3(-1, 0, 0);
    ghost._ghostId = ghostId;

    scene.add(ghost);
    return ghost;
}
