/**
 * Puter.js Integration Module
 * ----------------------------------------------------------
 * Provides cloud-powered features for the 3D Pac-Man game:
 *   - Cloud leaderboards (global high scores via puter.kv)
 *   - User authentication (puter.auth)
 *   - AI-powered ghost behavior (puter.ai)
 *
 * Usage:
 *   import * as PuterIntegration from './puter-integration.js';
 *
 * The module gracefully degrades if Puter.js is not loaded
 * (falls back to localStorage for scores, skips AI).
 *
 * Include Puter.js in HTML before this module:
 *   <script src="https://js.puter.com/v2/"></script>
 */

// ─── Constants ──────────────────────────────────────────────────────────────

const LEADERBOARD_KEY = 'pacman-3d-global-leaderboard';
const MAX_LEADERBOARD_ENTRIES = 50;
const AI_GHOST_CACHE_TTL = 5000; // 5 seconds — don't call AI too frequently

// ─── State ──────────────────────────────────────────────────────────────────

let _isAvailable = false;
let _currentUser = null; // { username, uuid, ... }
let _aiGhostCache = { strategy: null, timestamp: 0 };

// ─── Availability Check ─────────────────────────────────────────────────────

/**
 * Check if Puter.js is available (loaded via script tag).
 * @returns {boolean}
 */
export function isPuterAvailable() {
    _isAvailable = typeof window !== 'undefined' && typeof window.puter !== 'undefined';
    return _isAvailable;
}

// ─── Authentication ─────────────────────────────────────────────────────────

/**
 * Sign in the user via Puter auth. Must be called from a user gesture.
 * @returns {Promise<Object|null>} User object or null if unavailable/cancelled
 */
export async function signIn() {
    if (!isPuterAvailable()) return null;
    try {
        await window.puter.auth.signIn();
        _currentUser = await window.puter.auth.getUser();
        return _currentUser;
    } catch (e) {
        console.warn('Puter auth failed:', e);
        return null;
    }
}

/**
 * Get the current logged-in user (if any).
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUser() {
    if (!isPuterAvailable()) return null;
    if (_currentUser) return _currentUser;
    try {
        _currentUser = await window.puter.auth.getUser();
        return _currentUser;
    } catch (e) {
        return null;
    }
}

/**
 * Check if the user is currently signed in.
 * @returns {Promise<boolean>}
 */
export async function isSignedIn() {
    const user = await getCurrentUser();
    return user && user.username;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
    if (!isPuterAvailable()) return;
    try {
        if (window.puter.auth.signOut) {
            await window.puter.auth.signOut();
        }
        _currentUser = null;
    } catch (e) {
        console.warn('Puter signout failed:', e);
    }
}

// ─── Cloud Leaderboards ─────────────────────────────────────────────────────

/**
 * Fetch the global leaderboard from Puter KV store.
 * @returns {Promise<Array>} Array of { name, score, date } entries sorted by score desc
 */
export async function getGlobalLeaderboard() {
    if (!isPuterAvailable()) {
        return getLocalLeaderboard();
    }
    try {
        const data = await window.puter.kv.get(LEADERBOARD_KEY);
        if (data && Array.isArray(data)) {
            return data.sort((a, b) => b.score - a.score).slice(0, MAX_LEADERBOARD_ENTRIES);
        }
        return [];
    } catch (e) {
        console.warn('Failed to fetch global leaderboard:', e);
        return getLocalLeaderboard();
    }
}

/**
 * Submit a score to the global leaderboard.
 * Uses the logged-in user's name, or a provided fallback name.
 * @param {number} score - The score to submit
 * @param {string} fallbackName - Name to use if not signed in
 * @returns {Promise<boolean>} True if submitted successfully
 */
export async function submitScore(score, fallbackName) {
    const name = (_currentUser && _currentUser.username) || fallbackName || 'Anonymous';
    const entry = {
        name: name,
        score: score,
        date: new Date().toISOString()
    };

    if (!isPuterAvailable()) {
        // Fallback: save to localStorage
        return saveLocalLeaderboard(entry);
    }

    try {
        // Fetch existing leaderboard
        let leaderboard = await window.puter.kv.get(LEADERBOARD_KEY);
        if (!leaderboard || !Array.isArray(leaderboard)) leaderboard = [];

        // Add new entry
        leaderboard.push(entry);

        // Sort and trim
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);

        // Save back
        await window.puter.kv.set(LEADERBOARD_KEY, leaderboard);
        console.log('Score submitted to global leaderboard:', entry);
        return true;
    } catch (e) {
        console.warn('Failed to submit score to Puter:', e);
        return saveLocalLeaderboard(entry);
    }
}

/**
 * Check if a score would qualify for the global leaderboard.
 * @param {number} score
 * @returns {Promise<boolean>}
 */
export async function qualifiesForGlobalLeaderboard(score) {
    const leaderboard = await getGlobalLeaderboard();
    if (leaderboard.length < MAX_LEADERBOARD_ENTRIES) return true;
    const lowest = leaderboard[leaderboard.length - 1]?.score ?? 0;
    return score > lowest;
}

// ─── Local Storage Fallback ─────────────────────────────────────────────────

const LOCAL_LB_KEY = 'pacman-3d-leaderboard-fallback';

function getLocalLeaderboard() {
    try {
        const saved = localStorage.getItem(LOCAL_LB_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
}

function saveLocalLeaderboard(entry) {
    try {
        let lb = getLocalLeaderboard();
        lb.push(entry);
        lb.sort((a, b) => b.score - a.score);
        lb = lb.slice(0, MAX_LEADERBOARD_ENTRIES);
        localStorage.setItem(LOCAL_LB_KEY, JSON.stringify(lb));
        return true;
    } catch (e) {
        return false;
    }
}

// ─── AI Ghost Behavior ──────────────────────────────────────────────────────

/**
 * Request an AI-generated ghost strategy from Puter's AI API.
 * The strategy describes how ghosts should behave (chase, ambush, scatter, etc.)
 * based on the current game state.
 *
 * This is cached for AI_GHOST_CACHE_TTL ms to avoid excessive API calls.
 *
 * @param {Object} gameState - { pacmanPos, ghostPos, dotsRemaining, powerPelletActive, level }
 * @returns {Promise<Object|null>} Strategy object { mode, targetOffset, aggressionLevel } or null
 */
export async function getAIGhostStrategy(gameState) {
    if (!isPuterAvailable()) return null;

    // Check cache
    const now = Date.now();
    if (_aiGhostCache.strategy && (now - _aiGhostCache.timestamp) < AI_GHOST_CACHE_TTL) {
        return _aiGhostCache.strategy;
    }

    try {
        const prompt = buildGhostPrompt(gameState);
        const response = await window.puter.ai.chat(prompt, { model: 'gpt-4o-mini' });
        const strategy = parseStrategyResponse(response);

        // Cache it
        _aiGhostCache.strategy = strategy;
        _aiGhostCache.timestamp = now;

        return strategy;
    } catch (e) {
        console.warn('AI ghost strategy failed:', e);
        return null;
    }
}

/**
 * Build a concise prompt for the AI describing the current game state.
 */
function buildGhostPrompt(state) {
    return `You are the AI brain for ghosts in a 3D Pac-Man game.
Current game state:
- Pac-Man position: (${state.pacmanPos?.x || 0}, ${state.pacmanPos?.y || 0})
- Nearest ghost position: (${state.ghostPos?.x || 0}, ${state.ghostPos?.y || 0})
- Dots remaining: ${state.dotsRemaining || 0}
- Power pellet active: ${state.powerPelletActive || false}
- Level: ${state.level || 1}

Respond with ONLY a JSON object (no markdown, no explanation):
{"mode": "chase"|"ambush"|"scatter"|"patrol", "targetOffset": <-5 to 5 integer>, "aggressionLevel": <0.0 to 1.0>}
- mode: chase=direct pursuit, ambush=predict pacman's path, scatter=go to corners, patrol=random
- targetOffset: how far ahead of pacman to aim (0=direct, positive=ahead in movement direction)
- aggressionLevel: how aggressively to pursue (0=passive, 1=relentless)`;
}

/**
 * Parse the AI response into a strategy object.
 */
function parseStrategyResponse(response) {
    try {
        // Response might be a string or an object with .message.content
        let text = response;
        if (response && response.message && response.message.content) {
            text = response.message.content;
        }
        if (typeof text !== 'string') text = String(text);

        // Extract JSON from the response (handles markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate and clamp values
        const validModes = ['chase', 'ambush', 'scatter', 'patrol'];
        return {
            mode: validModes.includes(parsed.mode) ? parsed.mode : 'chase',
            targetOffset: Math.max(-5, Math.min(5, parseInt(parsed.targetOffset) || 0)),
            aggressionLevel: Math.max(0, Math.min(1, parseFloat(parsed.aggressionLevel) || 0.5))
        };
    } catch (e) {
        console.warn('Failed to parse AI strategy response:', e);
        return null;
    }
}

/**
 * Clear the AI ghost strategy cache (e.g., when a new level starts).
 */
export function clearAIGhostCache() {
    _aiGhostCache = { strategy: null, timestamp: 0 };
}

// ─── Multiplayer Room (Puter-based) ─────────────────────────────────────────

/**
 * Create or join a multiplayer room using Puter's KV store for room state.
 * This is a lightweight alternative to WebsimSocket for non-websim environments.
 *
 * @param {string} roomName - Room identifier
 * @param {string} playerName - Player display name
 * @returns {Promise<Object|null>} Room handle or null if unavailable
 */
export async function joinMultiplayerRoom(roomName, playerName) {
    if (!isPuterAvailable()) return null;
    try {
        const roomKey = `pacman-room-${roomName}`;
        let room = await window.puter.kv.get(roomKey);
        if (!room) {
            room = {
                name: roomName,
                players: [],
                createdAt: new Date().toISOString()
            };
        }
        // Add player
        room.players = room.players || [];
        room.players.push({
            name: playerName,
            joinedAt: new Date().toISOString(),
            score: 0
        });
        await window.puter.kv.set(roomKey, room);
        return {
            roomName,
            roomKey,
            players: room.players
        };
    } catch (e) {
        console.warn('Failed to join multiplayer room:', e);
        return null;
    }
}

/**
 * Update player state in a multiplayer room.
 * @param {string} roomKey - The room key from joinMultiplayerRoom
 * @param {string} playerName
 * @param {Object} state - { score, position, alive }
 */
export async function updatePlayerState(roomKey, playerName, state) {
    if (!isPuterAvailable()) return;
    try {
        let room = await window.puter.kv.get(roomKey);
        if (!room || !room.players) return;
        const player = room.players.find(p => p.name === playerName);
        if (player) {
            Object.assign(player, state);
            await window.puter.kv.set(roomKey, room);
        }
    } catch (e) {
        // Silently fail — multiplayer state updates are non-critical
    }
}

/**
 * Leave a multiplayer room.
 * @param {string} roomKey
 * @param {string} playerName
 */
export async function leaveMultiplayerRoom(roomKey, playerName) {
    if (!isPuterAvailable()) return;
    try {
        let room = await window.puter.kv.get(roomKey);
        if (!room || !room.players) return;
        room.players = room.players.filter(p => p.name !== playerName);
        if (room.players.length === 0) {
            // Room empty — clean up (kv.del may not exist in all versions, wrap in try/catch)
            try { await window.puter.kv.del(roomKey); } catch (e2) {}
        } else {
            await window.puter.kv.set(roomKey, room);
        }
    } catch (e) {
        // Non-critical
    }
}

// ─── Tournament System ──────────────────────────────────────────────────────

/**
 * Tournament bracket system using Puter KV for shared state.
 * Players can create/join tournaments and compete for the highest score.
 */

const TOURNAMENT_KEY = 'pacman-3d-tournaments';

/**
 * Create a new tournament.
 * @param {string} name - Tournament name
 * @param {number} maxPlayers - Maximum players (default 8)
 * @returns {Promise<string|null>} Tournament ID or null
 */
export async function createTournament(name, maxPlayers) {
    if (!isPuterAvailable()) return null;
    try {
        maxPlayers = maxPlayers || 8;
        const tournamentId = 't-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        let tournaments = await window.puter.kv.get(TOURNAMENT_KEY) || [];
        const tournament = {
            id: tournamentId,
            name: name,
            maxPlayers: maxPlayers,
            players: [],
            rounds: [],
            status: 'open', // open, in-progress, completed
            createdAt: new Date().toISOString()
        };
        tournaments.push(tournament);
        await window.puter.kv.set(TOURNAMENT_KEY, tournaments);
        return tournamentId;
    } catch (e) {
        console.warn('Failed to create tournament:', e);
        return null;
    }
}

/**
 * Join an existing tournament.
 * @param {string} tournamentId
 * @param {string} playerName
 * @returns {Promise<boolean>}
 */
export async function joinTournament(tournamentId, playerName) {
    if (!isPuterAvailable()) return false;
    try {
        let tournaments = await window.puter.kv.get(TOURNAMENT_KEY) || [];
        const t = tournaments.find(t => t.id === tournamentId);
        if (!t || t.status !== 'open') return false;
        if (t.players.length >= t.maxPlayers) return false;
        if (t.players.find(p => p.name === playerName)) return true; // Already joined
        t.players.push({ name: playerName, score: 0, wins: 0, losses: 0 });
        await window.puter.kv.set(TOURNAMENT_KEY, tournaments);
        return true;
    } catch (e) {
        console.warn('Failed to join tournament:', e);
        return false;
    }
}

/**
 * Get all active tournaments.
 * @returns {Promise<Array>}
 */
export async function getTournaments() {
    if (!isPuterAvailable()) return [];
    try {
        let tournaments = await window.puter.kv.get(TOURNAMENT_KEY) || [];
        // Filter out completed tournaments older than 24 hours
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        return tournaments.filter(t => t.status !== 'completed' || t.createdAt > cutoff);
    } catch (e) {
        return [];
    }
}

/**
 * Submit a tournament score for a player.
 * @param {string} tournamentId
 * @param {string} playerName
 * @param {number} score
 * @returns {Promise<boolean>}
 */
export async function submitTournamentScore(tournamentId, playerName, score) {
    if (!isPuterAvailable()) return false;
    try {
        let tournaments = await window.puter.kv.get(TOURNAMENT_KEY) || [];
        const t = tournaments.find(t => t.id === tournamentId);
        if (!t) return false;
        const player = t.players.find(p => p.name === playerName);
        if (!player) return false;
        if (score > player.score) player.score = score;
        await window.puter.kv.set(TOURNAMENT_KEY, tournaments);
        return true;
    } catch (e) {
        return false;
    }
}
