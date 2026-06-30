/**
 * thumb.js — Thumbnail Generation for 3D Models & All Asset Types
 * ============================================================================
 * Generates real rendered PNG thumbnails (dataURL) for GLTF 3D models,
 * images, fonts, and other asset types. Uses an offscreen Three.js WebGL
 * renderer with transparent background for 3D models.
 *
 * Import as: import * as Thumb from './thumb.js'
 *
 * Usage:
 *   // Render a single model thumbnail
 *   const dataURL = await Thumb.renderModelThumbnail('assets/models/pacman/yellow');
 *
 *   // Render all GLTF model thumbnails
 *   const results = await Thumb.renderAllModelThumbnails(onProgress);
 *
 *   // Generate thumbnail for any asset type
 *   const dataURL = await Thumb.generateAssetThumbnail('model', 'pacman', 'yellow');
 *
 *   // Cleanup when done
 *   Thumb.dispose();
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as Assets from './asset-manager.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Output thumbnail size in pixels (square) */
const THUMB_SIZE = 256;

/** Camera FOV for model thumbnails */
const THUMB_FOV = 40;

/** Camera distance from origin for model framing */
const THUMB_CAMERA_DISTANCE = 4;

// ─── Singleton Renderer State ───────────────────────────────────────────────

let _renderer = null;
let _scene = null;
let _camera = null;
let _loader = null;

// ─── Renderer Initialization ────────────────────────────────────────────────

/**
 * Initialize (or return existing) the singleton offscreen WebGL renderer,
 * scene, camera, and GLTF loader. All model thumbnails share this instance.
 * @returns {{ renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, loader: GLTFLoader }}
 */
export function getThumbRenderer() {
    if (_renderer) return { renderer: _renderer, scene: _scene, camera: _camera, loader: _loader };

    _renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    _renderer.setSize(THUMB_SIZE, THUMB_SIZE);
    _renderer.setClearColor(0x000000, 0);
    _renderer.setPixelRatio(1); // Keep at 1x for thumbnail performance

    _scene = new THREE.Scene();

    // Ambient light for base illumination
    _scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // Key light (front-right)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
    keyLight.position.set(2, 3, 4);
    _scene.add(keyLight);

    // Fill light (back-left)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-2, -1, -3);
    _scene.add(fillLight);

    // Rim light (top-down)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, 5, 1);
    _scene.add(rimLight);

    _camera = new THREE.PerspectiveCamera(THUMB_FOV, 1, 0.1, 100);
    _camera.position.set(0, 0, THUMB_CAMERA_DISTANCE);
    _camera.lookAt(0, 0, 0);

    _loader = new GLTFLoader();

    return { renderer: _renderer, scene: _scene, camera: _camera, loader: _loader };
}

// ─── Scene Cleanup ──────────────────────────────────────────────────────────

/**
 * Remove and dispose all meshes from the thumbnail scene, keeping lights intact.
 */
function disposeThumbScene() {
    if (!_scene) return;
    const toRemove = [];
    _scene.traverse(obj => {
        if (obj.isMesh) {
            toRemove.push(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                mats.forEach(m => {
                    if (m.map) m.map.dispose();
                    m.dispose();
                });
            }
        }
    });
    toRemove.forEach(obj => _scene.remove(obj));
}

// ─── Model Auto-Fit ─────────────────────────────────────────────────────────

/**
 * Auto-fit a loaded model into the thumbnail view by centering and scaling.
 * Mutates the model in place.
 * @param {THREE.Object3D} model - The loaded model's scene root
 */
function autoFitModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
        const scale = 2.0 / maxDim;
        model.scale.set(scale, scale, scale);
        model.position.set(
            -center.x * scale,
            -center.y * scale,
            -center.z * scale
        );
    }
}

// ─── GLTF Buffer URI Patching ───────────────────────────────────────────────

/**
 * Fetch a .gltf file, patch any buffer URIs that don't match the actual .bin
 * filename, and return the parsed JSON. Used for Sketchfab exports where the
 * gltf references "scene.bin" but the actual file has a different name.
 *
 * @param {string} modelPath - Path to the model without extension
 * @returns {Promise<{ gltfJson: object, binFilename: string, directory: string, fullPath: string }>}
 */
async function fetchAndPatchGltf(modelPath) {
    const fullPath = modelPath + '.gltf';
    const binPath = modelPath + '.bin';
    const binFilename = binPath.replace(/\\/g, '/').split('/').pop();

    const normalized = modelPath.replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    const directory = lastSlash >= 0 ? normalized.substring(0, lastSlash + 1) : '';

    const response = await fetch(fullPath);
    if (!response.ok) throw new Error(`HTTP ${response.status} loading ${fullPath}`);

    const gltfText = await response.text();
    const gltfJson = JSON.parse(gltfText);

    if (gltfJson.buffers) {
        for (const buf of gltfJson.buffers) {
            if (buf.uri && buf.uri !== binFilename && buf.uri.endsWith('.bin')) {
                console.log(`[thumb] Patching buffer URI from "${buf.uri}" to "${binFilename}"`);
                buf.uri = binFilename;
            }
        }
    }

    return { gltfJson, binFilename, directory, fullPath };
}

// ─── Model Thumbnail Rendering ──────────────────────────────────────────────

/**
 * Render a GLTF 3D model to a PNG dataURL thumbnail.
 * Handles buffer URI patching for Sketchfab exports.
 *
 * @param {string} modelPath - Path to the model file without extension (e.g. 'assets/models/pacman/yellow')
 * @returns {Promise<string>} PNG dataURL (e.g. 'data:image/png;base64,...')
 */
export async function renderModelThumbnail(modelPath) {
    const { renderer, scene, camera, loader } = getThumbRenderer();

    // Step 1: Fetch and patch the gltf
    let gltfJson, directory;
    try {
        const result = await fetchAndPatchGltf(modelPath);
        gltfJson = result.gltfJson;
        directory = result.directory;
    } catch (fetchErr) {
        // Try direct load as fallback
        console.warn(`[thumb] Fetch/patch failed for ${modelPath}, trying direct load:`, fetchErr);
        return await directLoadThumbnail(modelPath, renderer, scene, camera, loader);
    }

    // Step 2: Load the (potentially patched) gltf via GLTFLoader.parse()
    return new Promise((resolve, reject) => {
        if (directory) loader.setPath(directory);

        try {
            loader.parse(
                JSON.stringify(gltfJson),
                directory,
                function (gltf) {
                    try {
                        disposeThumbScene();
                        const model = gltf.scene;

                        // Apply explicit Y-up→Z-up orientation (for Sketchfab models)
                        model.rotation.set(-Math.PI / 2, 0, 0);

                        // Auto-fit in view
                        autoFitModel(model);

                        scene.add(model);
                        camera.position.set(0, 0, THUMB_CAMERA_DISTANCE);
                        camera.lookAt(0, 0, 0);
                        renderer.render(scene, camera);

                        const dataURL = renderer.domElement.toDataURL('image/png');
                        disposeThumbScene();
                        resolve(dataURL);
                    } catch (err) {
                        disposeThumbScene();
                        reject(err);
                    }
                },
                function (parseErr) {
                    console.warn(`[thumb] Parse failed for ${modelPath}, trying direct load:`, parseErr);
                    directLoadThumbnail(modelPath, renderer, scene, camera, loader)
                        .then(resolve)
                        .catch(reject);
                }
            );
        } catch (err) {
            directLoadThumbnail(modelPath, renderer, scene, camera, loader)
                .then(resolve)
                .catch(reject);
        }
    });
}

/**
 * Fallback: try loading the model directly by filename (no patching).
 */
function directLoadThumbnail(modelPath, renderer, scene, camera, loader) {
    return new Promise((resolve, reject) => {
        const normalized = modelPath.replace(/\\/g, '/');
        const lastSlash = normalized.lastIndexOf('/');
        const directory = lastSlash >= 0 ? normalized.substring(0, lastSlash + 1) : '';
        const filename = normalized.split('/').pop() + '.gltf';

        if (directory) loader.setPath(directory);

        loader.load(
            filename,
            function (gltf) {
                try {
                    disposeThumbScene();
                    const model = gltf.scene;

                    model.rotation.set(-Math.PI / 2, 0, 0);
                    autoFitModel(model);

                    scene.add(model);
                    camera.position.set(0, 0, THUMB_CAMERA_DISTANCE);
                    camera.lookAt(0, 0, 0);
                    renderer.render(scene, camera);

                    const dataURL = renderer.domElement.toDataURL('image/png');
                    disposeThumbScene();
                    resolve(dataURL);
                } catch (err) {
                    disposeThumbScene();
                    reject(err);
                }
            },
            undefined,
            function (err) {
                reject(err);
            }
        );
    });
}

// ─── Batch Rendering ────────────────────────────────────────────────────────

/**
 * Render thumbnails for all GLTF models (pacman + ghost) in batch.
 *
 * @param {function(number,number):void} [onProgress] - Callback(completed, total)
 * @returns {Promise<Object<string, string>>} Map of { "type-id": dataURL }
 */
export async function renderAllModelThumbnails(onProgress) {
    getThumbRenderer(); // Initialize

    const allModels = [
        ...Object.entries(Assets.PACMAN_MODELS).map(([id, m]) => ({ id, model: m, type: 'pacman' })),
        ...Object.entries(Assets.GHOST_MODELS).map(([id, m]) => ({ id, model: m, type: 'ghost' }))
    ];

    const gltfModels = allModels.filter(m => m.model.type === 'gltf' && m.model.path);
    const results = {};
    let completed = 0;
    let errors = 0;

    for (const { id, model, type } of gltfModels) {
        try {
            const dataURL = await renderModelThumbnail(model.path);
            results[`${type}-${id}`] = dataURL;
            completed++;
        } catch (err) {
            console.warn(`[thumb] Failed to render ${model.name}:`, err);
            errors++;
        }
        if (onProgress) onProgress(completed + errors, gltfModels.length);
    }

    return results;
}

// ─── Non-Model Asset Thumbnails ─────────────────────────────────────────────

/**
 * Generate a thumbnail for any asset type.
 *
 * @param {'model'|'image'|'font'|'audio'} assetType - Category of asset
 * @param {string} subType - Sub-type ('pacman', 'ghost', 'font', etc.)
 * @param {string} assetId - The specific asset identifier
 * @returns {Promise<string>} DataURL or fallback emoji placeholder
 */
export async function generateAssetThumbnail(assetType, subType, assetId) {
    switch (assetType) {
        case 'model': {
            // For built-in (classic sphere), return an emoji placeholder
            const models = subType === 'pacman' ? Assets.PACMAN_MODELS : Assets.GHOST_MODELS;
            const model = models[assetId];
            if (!model || model.type === 'builtin' || !model.path) {
                return generateEmojiPlaceholder(subType === 'pacman' ? '🟡' : '👻');
            }
            return await renderModelThumbnail(model.path);
        }

        case 'image': {
            // For images, return the image itself resized to thumbnail size
            const imageAsset = findImageAsset(assetId);
            if (imageAsset) return await renderImageThumbnail(imageAsset.path);
            return generateEmojiPlaceholder('🖼️');
        }

        case 'font': {
            const font = Assets.FONTS[assetId];
            if (font) return await renderFontThumbnail(font);
            return generateEmojiPlaceholder('🔤');
        }

        case 'audio': {
            return generateEmojiPlaceholder('🎵');
        }

        default:
            return generateEmojiPlaceholder('🎮');
    }
}

/**
 * Find an image asset by ID across all image collections.
 */
function findImageAsset(assetId) {
    const collections = [
        Assets.PACMAN_IMAGES,
        Assets.GHOST_IMAGES,
        Assets.INTRO_IMAGES,
        Assets.SPLASH_IMAGES,
        Assets.ICON_IMAGES,
        Assets.MISC_IMAGES
    ];
    for (const col of collections) {
        if (col && col[assetId]) return col[assetId];
    }
    return null;
}

/**
 * Generate a thumbnail-sized PNG from an image URL.
 * @param {string} imagePath - URL to the source image
 * @returns {Promise<string>} PNG dataURL at THUMB_SIZE×THUMB_SIZE
 */
export async function renderImageThumbnail(imagePath) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = THUMB_SIZE;
            canvas.height = THUMB_SIZE;
            const ctx = canvas.getContext('2d');

            // Fill transparent background with dark color for visibility
            ctx.fillStyle = '#0a0a2e';
            ctx.fillRect(0, 0, THUMB_SIZE, THUMB_SIZE);

            // Calculate fit (contain)
            const scale = Math.min(THUMB_SIZE / img.width, THUMB_SIZE / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (THUMB_SIZE - w) / 2;
            const y = (THUMB_SIZE - h) / 2;

            ctx.drawImage(img, x, y, w, h);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
        img.src = imagePath;
    });
}

/**
 * Generate a thumbnail showing a text sample rendered in a specific font.
 * @param {{ family: string, name: string }} fontDef - Font definition from Assets.FONTS
 * @returns {Promise<string>} PNG dataURL
 */
export async function renderFontThumbnail(fontDef) {
    const canvas = document.createElement('canvas');
    canvas.width = THUMB_SIZE;
    canvas.height = THUMB_SIZE;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0a0a2e';
    ctx.fillRect(0, 0, THUMB_SIZE, THUMB_SIZE);

    // Text sample
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.round(THUMB_SIZE / 5)}px '${fontDef.family}', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Aa Bb', THUMB_SIZE / 2, THUMB_SIZE / 2 - 20);
    ctx.font = `${Math.round(THUMB_SIZE / 8)}px '${fontDef.family}', monospace`;
    ctx.fillStyle = '#aaa';
    ctx.fillText('123', THUMB_SIZE / 2, THUMB_SIZE / 2 + 30);

    return canvas.toDataURL('image/png');
}

/**
 * Generate a simple emoji placeholder as a dataURL.
 * @param {string} emoji - The emoji character
 * @returns {string} PNG dataURL
 */
export function generateEmojiPlaceholder(emoji) {
    const canvas = document.createElement('canvas');
    canvas.width = THUMB_SIZE;
    canvas.height = THUMB_SIZE;
    const ctx = canvas.getContext('2d');

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, THUMB_SIZE, THUMB_SIZE);
    gradient.addColorStop(0, '#1a1a3e');
    gradient.addColorStop(1, '#0a0a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, THUMB_SIZE, THUMB_SIZE);

    // Draw emoji
    ctx.font = `${Math.round(THUMB_SIZE * 0.35)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji || '🎮', THUMB_SIZE / 2, THUMB_SIZE / 2);

    return canvas.toDataURL('image/png');
}

// ─── Batch Generation for All Asset Types ───────────────────────────────────

/**
 * Generate thumbnails for all asset types (models, images, fonts).
 * Returns a flat map of asset keys to dataURLs.
 *
 * @param {function(string,number,number):void} [onProgress] - Callback(type, done, total)
 * @returns {Promise<Object<string, string>>} Map of "category-id" → dataURL
 */
export async function renderAllAssetThumbnails(onProgress) {
    const results = {};
    let total = 0;
    let done = 0;

    // Count all generatable assets
    const tasks = [];

    // Models (GLTF only, skip built-in)
    for (const [id, model] of Object.entries(Assets.PACMAN_MODELS)) {
        if (model.type === 'gltf' && model.path) {
            tasks.push({ type: 'model', subType: 'pacman', id, path: model.path, key: `pacmanModel-${id}` });
        }
    }
    for (const [id, model] of Object.entries(Assets.GHOST_MODELS)) {
        if (model.type === 'gltf' && model.path) {
            tasks.push({ type: 'model', subType: 'ghost', id, path: model.path, key: `ghostModel-${id}` });
        }
    }

    // Images
    for (const [id, img] of Object.entries(Assets.PACMAN_IMAGES || {})) {
        tasks.push({ type: 'image', id, path: img.path, key: `image-${id}` });
    }
    for (const [id, img] of Object.entries(Assets.GHOST_IMAGES || {})) {
        tasks.push({ type: 'image', id, path: img.path, key: `image-${id}` });
    }

    // Fonts
    for (const [id, font] of Object.entries(Assets.FONTS)) {
        tasks.push({ type: 'font', id, font, key: `font-${id}` });
    }

    total = tasks.length;

    for (const task of tasks) {
        try {
            if (task.type === 'model') {
                results[task.key] = await renderModelThumbnail(task.path);
            } else if (task.type === 'image') {
                results[task.key] = await renderImageThumbnail(task.path);
            } else if (task.type === 'font') {
                results[task.key] = await renderFontThumbnail(task.font);
            }
        } catch (err) {
            console.warn(`[thumb] Failed: ${task.key}`, err);
            results[task.key] = generateEmojiPlaceholder('❓');
        }
        done++;
        if (onProgress) onProgress(task.type, done, total);
    }

    return results;
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

/**
 * Dispose the singleton renderer and release all GPU resources.
 * Call this when thumbnails are no longer needed.
 */
export function dispose() {
    disposeThumbScene();
    if (_renderer) {
        _renderer.dispose();
        _renderer = null;
    }
    if (_scene) {
        _scene = null;
    }
    _camera = null;
    if (_loader) {
        _loader = null;
    }
}

/**
 * Returns true if the thumbnail renderer is currently initialized.
 * @returns {boolean}
 */
export function isInitialized() {
    return _renderer !== null;
}

// ─── Exported Constants ─────────────────────────────────────────────────────

export { THUMB_SIZE as THUMBNAIL_SIZE };
