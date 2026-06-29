/**
 * Pacman Multiplayer Addon for websim.ai
 * ----------------------------------------------------------
 * Import as:    import * as PacmanMP from './pacman-multiplayer.js'
 * 
 * Injects multiplayer UI and logic: open invites, join, overlays, live sync, PvP eating, basic chat, respawns, and game event overlays.
 * 
 * No logic hooks needed in main pacman.js -- use this file to handle multiplayer overlays, presence,
 * player state sync, PvP/power mode eating, respawn, and chat. 
 * 
 * Usage:
 *   import * as PacmanMP from './pacman-multiplayer.js'
 *   PacmanMP.startMultiplayer(room, username, avatarUrl)
 * 
 * ----------------------------------------------------------
 */

//////////////////////////////////////////////////////////////////
/// TWEAKABLE SETTINGS - customize these as needed!            ///
//////////////////////////////////////////////////////////////////

/* @tweakable Maximum number of human players in session */
export const MP_MAX_PLAYERS = 4;

/* @tweakable Open Invite button text when active */
export const MP_OPEN_INVITE_TEXT = "INVITE ACTIVE";

/* @tweakable Open Invite button text when inactive */
export const MP_INVITE_TEXT = "OPEN INVITE";

/* @tweakable Join button text */
export const MP_JOIN_TEXT = "JOIN";

/* @tweakable Voting overlay background opacity (0.0 - 1.0) */
export const MP_OVERLAY_OPACITY = 0.97;

/* @tweakable How long (seconds) before a dead player auto-perishes if not respawned */
export const MP_RESPAWN_VICTIM_SEC = 10;

/* @tweakable PvP eating: score multiplier for eating another player over a ghost */
export const MP_PVP_EAT_SCORE_MULT = 2;

/* @tweakable UI/cosmetic: multiplayer color and highlight */
export const MP_OVERLAY_COLOR = "#FF64E3";

/* @tweakable Avatar overlay icon size (pixels) */
export const MP_PLAYER_ICON_SIZE = 36;

/* @tweakable Font size for player overlays (px) */
export const MP_PLAYER_NAME_FONT_SIZE = 18;

/* @tweakable Radius for PvP collision to eat (units) */
export const MP_EAT_RADIUS = 0.35;

/* @tweakable How many times/second player state is synced */
export const MP_BROADCAST_HZ = 20;

/* @tweakable Delay (seconds) before an eaten player can respawn */
export const MP_RESPAWN_DELAY = 2.5;

/* @tweakable Enable/disable in-game chatbox */
export const MP_ENABLE_CHATBOX = true;

/* @tweakable Max chat message length (characters) */
export const MP_CHAT_MSG_MAXLEN = 72;

/* @tweakable Transparency (opacity) for invite player container (0=transparent, 1=opaque) */
export const MP_INVITE_OPACITY = 0.7;

/* @tweakable Transparency (opacity) for multiplayer chatbox (0=transparent, 1=opaque) */
export const MP_CHATBOX_OPACITY = 0.7;

/* @tweakable X offset in pixels between the chatbox and the HUD minimap (to avoid blocking HUD) */
export const MP_CHATBOX_FROM_HUD = 225;

/* @tweakable Y offset in pixels from the bottom for the chatbox */
export const MP_CHATBOX_BOTTOM = 40;

/* @tweakable Show live game points in the invite pane header (true = show, false = hide) */
export const MP_SHOW_POINTS_IN_INVITE = true;

//////////////////////////////////////////////////////////////////

// CSS for overlays, avatars, invite buttons
const MP_CSS = `
#mp-invite-pane {
    position: fixed; left: 22px; top: 54px; z-index: 8001;
    background: rgba(28,5,35,${MP_INVITE_OPACITY});
    color: ${MP_OVERLAY_COLOR};
    border-radius: 13px;
    padding: 15px 25px 17px 19px;
    min-width: 185px;
    box-shadow: 0 8px 30px #0007;
    font-size: 1.02em;
    font-family: sans-serif;
    font-weight: 600;
    user-select: none;
}
#mp-invite-btn, #mp-join-btn {
    margin: 0 7px 6px 0;
    border: none; border-radius: 7px;
    background: #1b0a2b;
    color: ${MP_OVERLAY_COLOR};
    font-weight: bold; font-size: 1em;
    padding: 8px 22px;
    cursor: pointer;
    transition: background .12s, box-shadow .15s;
}
#mp-invite-btn[active] { background: #E744FE; color: #fff; box-shadow: 0 3px 12px #FF86FF22;}
#mp-player-row {
    margin-top: 10px; margin-bottom: 3px; color: #ffd2fb; font-weight: 500;
}
.mp-player-bubble {
    display: flex; align-items: center; gap:7px;
    background: rgba(40,0,55,0.82);
    border-radius: 14px;
    padding: 5px 13px 5px 7px;
    margin: 2px 2px 2px 0;
    box-shadow: 0 2px 7px #0005;
    font-size: ${MP_PLAYER_NAME_FONT_SIZE}px;
    color: #FFD2FB;
    font-weight: 600;
    pointer-events: none;
    width: fit-content;
}
.mp-avatar {
    width: ${MP_PLAYER_ICON_SIZE}px; height: ${MP_PLAYER_ICON_SIZE}px;
    border-radius: 99px;
    margin-right: 8px;
    background: #19102c;
    border: 2px solid #E989FF63;
}
#mp-respawn-overlay {
    position: fixed; left: 50%; top: 44%;
    transform: translate(-50%, -50%);
    z-index: 8999;
    background: rgba(9,3,23,${MP_OVERLAY_OPACITY});
    color: ${MP_OVERLAY_COLOR};
    font-family: sans-serif;
    padding: 35px 100px 36px 100px;
    border-radius: 24px;
    box-shadow: 0 6px 40px #000a;
    font-size: 2.6em;
    font-weight: 700;
    text-align: center;
    user-select: none;
}
#mp-chatbox {
    position: fixed; left: ${MP_CHATBOX_FROM_HUD}px; bottom: ${MP_CHATBOX_BOTTOM}px;
    width: 330px; z-index: 8801;
    font-size: 1em;
    background: rgba(24,7,35,${MP_CHATBOX_OPACITY});
    color: #fff;
    border-radius: 11px 11px 14px 14px;
    box-shadow: 0 4px 29px #9601a255;
    overflow: hidden;
}
#mp-chat-messages {
    flex: 1 1 auto;
    min-height: 69px; max-height: 145px;
    overflow-y: auto;
    padding: 10px 13px 0 16px;
}
#mp-chatbox input {
    outline: none; border: none;
    background: #232032;
    color: #fff;
    width: 92%;
    font-size: 1em;
    padding: 8px 3px 7px 12px;
    margin: 0 0 7px 0;
    border-radius: 9px;
}
.mp-message{
    margin-bottom:3px;
    line-break:anywhere;
}
`;

// Core multiplayer state
let _room = null;
let _myUsername = "";
let _myAvatarUrl = "";
let _inMPGame = false;
let _joinedGameId = null;
let _respawnTimeoutId = null;

/**
 * Injects multiplayer CSS (once, idempotent)
 */
function _injectCSS() {
    if (!document.getElementById('mp-css-addon')) {
        const style = document.createElement('style');
        style.id = 'mp-css-addon';
        style.innerHTML = MP_CSS;
        document.head.appendChild(style);
    }
}

/**
 * Renders the invite/join open invite overlay.
 */
function _renderInvitePane(isOpen, peerList) {
    let pane = document.getElementById('mp-invite-pane');
    if (!pane) {
        pane = document.createElement('div');
        pane.id = 'mp-invite-pane';
        document.body.appendChild(pane);
    }
    pane.innerHTML = "";

    // Add points header (always on top if enabled)
    if (MP_SHOW_POINTS_IN_INVITE) {
        let pointsDiv = document.createElement('div');
        pointsDiv.style.fontWeight = 'bold';
        pointsDiv.style.fontSize = '1em';
        pointsDiv.style.letterSpacing = '1.5px';
        pointsDiv.style.marginBottom = '6px';
        pointsDiv.style.color = '#FFD700';
        // Find my score
        let score = 0;
        if (_room && _room.presence && _room.presence[_room.clientId]) {
            score = _room.presence[_room.clientId].score || 0;
        }
        pointsDiv.textContent = `POINTS: ${score}`;
        pointsDiv.id = "mp-live-points";
        pane.appendChild(pointsDiv);
    }

    // Open Invite or Join Button
    const inviteBtn = document.createElement('button');
    inviteBtn.id = "mp-invite-btn";
    inviteBtn.innerText = isOpen ? MP_OPEN_INVITE_TEXT : MP_INVITE_TEXT;
    if (isOpen) inviteBtn.setAttribute("active", "");
    inviteBtn.onclick = () => _room && _room.updatePresence({ openInvite: !isOpen });
    pane.appendChild(inviteBtn);

    // Join Button (if open invite present from anyone else)
    if (isOpen && !_inMPGame) {
        let joinBtn = document.createElement('button');
        joinBtn.id = "mp-join-btn";
        joinBtn.innerText = MP_JOIN_TEXT;
        joinBtn.onclick = () => joinOpenGame(_room.clientId);
        pane.appendChild(joinBtn);
    }

    // Online Player List
    if (peerList && peerList.length) {
        let row = document.createElement('div');
        row.id = "mp-player-row";
        row.textContent = "Players online:";
        pane.appendChild(row);
        for (let p of peerList) {
            let bb = document.createElement('div');
            bb.className = "mp-player-bubble";
            bb.innerHTML = `<img class="mp-avatar" src="https://images.websim.ai/avatar/${p.username}" />
                <span>${p.username}${p.clientId === _room.clientId ? " (YOU)" : ""}</span>`;
            pane.appendChild(bb);
        }
    }
    // Always update points (live) if enabled
    if (MP_SHOW_POINTS_IN_INVITE) {
        // Listen to presence updates to re-render points
        if (!_renderInvitePane._interval) {
            _renderInvitePane._interval = setInterval(() => {
                let pointsDiv = document.getElementById("mp-live-points");
                if (pointsDiv && _room && _room.presence && _room.presence[_room.clientId]) {
                    let score = _room.presence[_room.clientId].score || 0;
                    pointsDiv.textContent = `POINTS: ${score}`;
                }
            }, 333);
        }
    }
}

function _clearPlayerOverlays() {
    [...document.querySelectorAll('[id^="mp-overlay-"]')].forEach(n => n.remove());
}

/**
 * Shows floating overlays for each player (avatars+names on left, vertically stacked)
 */
function _showPlayerOverlay(clientId, username, avatarUrl, idx) {
    let id = `mp-overlay-${clientId}`;
    let o = document.getElementById(id);
    if (!o) {
        o = document.createElement('div');
        o.id = id;
        o.className = "mp-player-bubble";
        o.style.position = 'fixed';
        o.style.pointerEvents = 'none';
        o.style.zIndex = 935;
        o.innerHTML = `<img class="mp-avatar" src="https://images.websim.ai/avatar/${username}" />
                        <span>${username}</span>`;
        document.body.appendChild(o);
    }
    o.style.left = "22px";
    o.style.top = (120 + 36 * idx) + "px";
    o.style.opacity = 1;
}

/**
 * Join an open-invite game for given host clientId.
 */
function joinOpenGame(hostClientId) {
    if (!_room || !_myUsername) return;
    _room.updatePresence({ openInvite: false, joinedGame: hostClientId });
    _inMPGame = true;
    _joinedGameId = hostClientId;
}

/**
 * Returns open invites currently in room presence.
 */
function getOpenInvites() {
    if (!_room) return [];
    return Object.entries(_room.presence)
        .filter(([,p]) => p && p.openInvite)
        .map(([cid, p]) => ({ clientId: cid, username: p.username, avatarsrc: p.avatarUrl }));
}

/**
 * PvP eat: if a player in power mode collides with another, scores, respawn victim.
 */
function playerEatPlayer(eaterClientId, victimClientId) {
    if (!_room) return;
    if (eaterClientId === _room.clientId && victimClientId !== _room.clientId) {
        // Find victim, award points, trigger respawn event
        let victimPres = _room.presence[victimClientId] || {};
        let scored = (victimPres.score ? victimPres.score : 0) * MP_PVP_EAT_SCORE_MULT;
        _room.updatePresence({ scoreDelta: scored });
        _room.send({ type: "consume-player", victimId: victimClientId, consumerId: eaterClientId });
    }
}

function respawnPlayer(clientId) {
    if (_room)
        _room.send({ type: "respawn", victimId: clientId });
}

/** 
 * Broadcasts the player state to the room (presence update -- call from your update loop)
 */
function syncPlayerState(playerState) {
    if (_room)
        _room.updatePresence({ ...playerState, username: _myUsername, avatarUrl: _myAvatarUrl });
}

/**
 * Show deadly "RESPAWN?" overlay for MP_RESPAWN_VICTIM_SEC, then death if expired.
 */
function _startRespawnCountdown(clientId, onDone) {
    let secs = MP_RESPAWN_VICTIM_SEC;
    if (_respawnTimeoutId) clearTimeout(_respawnTimeoutId);
    let overlay = document.getElementById('mp-respawn-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = "mp-respawn-overlay";
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div style="font-size:1.6em; color:${MP_OVERLAY_COLOR}; font-weight:bold; padding-bottom:4px;">VICTIM?</div>
        <div style="font-size:2.4em; color:#FFD9FA; font-weight:900;">${secs}</div>
        <div style="font-size:.69em;opacity:0.7;padding-top:7px;">Respawn, or meet your DEATH!</div>`;

    function ticker() {
        secs--;
        if (secs > 0) {
            overlay.children[1].textContent = secs;
            _respawnTimeoutId = setTimeout(ticker, 1000);
        } else {
            overlay.remove();
            // Play death sound if asset is present
            let death = new Audio('assets/audio/sfx/pacman_death.wav');
            death.volume = 0.85; death.play();
            if (onDone) onDone(false);
        }
    }
    _respawnTimeoutId = setTimeout(ticker, 1000);
}
function _hideRespawnOverlay() {
    let o = document.getElementById('mp-respawn-overlay');
    if (o) o.remove();
    if (_respawnTimeoutId) clearTimeout(_respawnTimeoutId);
}

function _setupChatbox() {
    if (document.getElementById('mp-chatbox')) return;
    let box = document.createElement('div');
    box.id = "mp-chatbox";
    box.innerHTML = `
        <div id="mp-chat-messages"></div>
        <input id="mp-chat-input" type="text" maxlength="${MP_CHAT_MSG_MAXLEN}" placeholder="Press ENTER to chat..."/>
    `;
    document.body.appendChild(box);
    let input = box.querySelector('#mp-chat-input');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            let v = input.value.trim();
            if (v) {
                _room.send({ type: "chat-message", username: _myUsername, message: v });
                input.value = '';
            }
        }
    });
}
function _appendChatMessage(username, msg) {
    let chat = document.getElementById('mp-chat-messages');
    if (!chat) return;
    let el = document.createElement('div');
    el.className = "mp-message";
    el.innerHTML = `<b>${username}:</b> ${msg}`;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight + 33;
}

/**
 * Start the multiplayer system. Typically call at launch:
 * 
 *   PacmanMP.startMultiplayer(room, username, avatarUrl)
 * 
 * @param {*} room         - The WebsimSocket room object
 * @param {*} username     - Player username
 * @param {*} avatarUrl    - Player avatar url (https://images.websim.ai/avatar/${username})
 */
export function startMultiplayer(room, username, avatarUrl) {
    _injectCSS();
    _room = room;
    _myUsername = username;
    _myAvatarUrl = avatarUrl;
    _room.initialize().then(() => {
        // Set self in presence
        _room.updatePresence({ username, avatarUrl, openInvite: false, joinedGame: null, score: 0 });

        // Show invite overlay and player overlays for all peers
        _room.subscribePresence(() => {
            let openInvite = _room.presence[_room.clientId]?.openInvite;
            let peers = Object.entries(_room.peers)
                .map(([id, u]) => ({ ...u, clientId: id }));
            _renderInvitePane(openInvite, peers);
            // Avatars overlays (left side)
            _clearPlayerOverlays();
            Object.entries(_room.peers).forEach(([cid, u], i) => {
                if (u && u.username && cid !== _room.clientId) {
                    _showPlayerOverlay(cid, u.username, u.avatarUrl, i);
                }
            });
        });

        // Listen for room-wide events
        _room.onmessage = (ev) => {
            let data = ev.data;
            switch (data.type) {
                case "consume-player":
                    if (data.victimId === _room.clientId) {
                        _startRespawnCountdown(_room.clientId, (respawned) => {
                            if (!respawned) _room.updatePresence({ dead: true });
                        });
                    }
                    break;
                case "respawn":
                    if (data.victimId === _room.clientId) {
                        _hideRespawnOverlay();
                        _room.updatePresence({ dead: false });
                    }
                    break;
                case "chat-message":
                    if (MP_ENABLE_CHATBOX) _appendChatMessage(data.username, data.message);
                    break;
            }
        };
        // Show chat
        if (MP_ENABLE_CHATBOX) _setupChatbox();
    });
}

/* -------------------------------------------------------------------
   Expose API for integration (core multiplayer functions)
   ------------------------------------------------------------------- */
export {
    joinOpenGame,
    getOpenInvites,
    syncPlayerState,
    playerEatPlayer,
    respawnPlayer
};

/* -------------------------------------------------------------------
   Simple GO Game Engine (shared room state + turn handling)
   - Minimal, optimistic room-state-driven engine for a GO-like board
   - Use the exported functions to interact with the engine from UI
   ------------------------------------------------------------------- */

/* @tweakable Size of the Go board (N x N). Keep small for performance. */
export const GO_BOARD_SIZE = 9;

/* @tweakable How many seconds between engine auto-ticks (0 = disabled) */
export const GO_TICK_SECONDS = 0;

/* @tweakable Maximum number of concurrent games in room state (keeps state small) */
export const GO_MAX_GAMES = 2;

/**
 * Initialize the Go engine on a room. Safe to call multiple times.
 * This creates a default goGame object in room.roomState if missing.
 * @param {Room} room
 */
export function initGoEngine(room) {
    if (!room) return;
    // create default room state if missing
    const defaultGame = {
        boardSize: GO_BOARD_SIZE,
        board: {}, // keys "x_y": "black"|"white"
        currentTurnClientId: null,
        players: [], // list of clientIds participating (max 2)
        started: false,
        moveCount: 0,
        created_at: new Date().toISOString()
    };
    // Populate a single game slot if none exists
    const state = room.roomState || {};
    if (!state.goGames || Object.keys(state.goGames).length === 0) {
        const id = 'go-1';
        room.updateRoomState({
            goGames: {
                [id]: defaultGame
            }
        });
    }
    // Subscribe to room state for future updates (no-op callback here)
    if (!initGoEngine._subscribed && typeof room.subscribeRoomState === 'function') {
        initGoEngine._subscribed = room.subscribeRoomState(() => {});
    }
}

/**
 * Join a Go game slot in the room (simple 2-player join).
 * Returns the gameId joined or null on failure.
 */
export async function joinGoGame(room, gameId = 'go-1') {
    if (!room) return null;
    const games = room.roomState && room.roomState.goGames ? room.roomState.goGames : {};
    const g = games[gameId];
    if (!g) return null;
    const players = Array.isArray(g.players) ? g.players.slice() : [];
    if (players.indexOf(room.clientId) !== -1) return gameId; // already joined
    if (players.length >= 2) return null; // full
    players.push(room.clientId);
    // first joiner becomes black & current turn
    const updated = {
        ...g,
        players,
        started: players.length === 2,
        currentTurnClientId: players.length === 1 ? room.clientId : (g.currentTurnClientId || players[0])
    };
    await room.updateRoomState({
        goGames: {
            [gameId]: updated
        }
    });
    return gameId;
}

/**
 * Make a move on the Go board (x,y grid cells are 0..boardSize-1).
 * This function performs minimal validation and updates room state.
 * @param {Room} room
 * @param {string} gameId
 * @param {number} x
 * @param {number} y
 */
export async function makeGoMove(room, gameId = 'go-1', x, y) {
    if (!room || typeof x !== 'number' || typeof y !== 'number') return false;
    const games = room.roomState && room.roomState.goGames ? room.roomState.goGames : {};
    const g = games[gameId];
    if (!g || !g.started) return false;
    if (g.currentTurnClientId !== room.clientId) return false; // not your turn
    if (x < 0 || y < 0 || x >= (g.boardSize || GO_BOARD_SIZE) || y >= (g.boardSize || GO_BOARD_SIZE)) return false;
    const key = `${x}_${y}`;
    if (g.board && g.board[key]) return false; // occupied

    // Determine color for this player (first player = black, second = white)
    const pIndex = (g.players && g.players.indexOf(room.clientId)) || 0;
    const color = pIndex === 0 ? 'black' : 'white';

    const newBoard = { ...(g.board || {}) };
    newBoard[key] = color;

    const nextPlayer = g.players && g.players.length === 2 ? g.players[(pIndex + 1) % 2] : g.currentTurnClientId;

    const updated = {
        ...g,
        board: newBoard,
        currentTurnClientId: nextPlayer,
        moveCount: (g.moveCount || 0) + 1
    };

    await room.updateRoomState({
        goGames: {
            [gameId]: updated
        }
    });

    // Broadcast a room event so clients can play sounds / overlays
    room.send({
        type: 'go-move',
        gameId,
        x,
        y,
        color,
        player: room.clientId,
        echo: true
    });

    return true;
}

/**
 * Reset a Go game (clears board) - ownerless; anyone may request reset.
 */
export async function resetGoGame(room, gameId = 'go-1') {
    if (!room) return false;
    const games = room.roomState && room.roomState.goGames ? room.roomState.goGames : {};
    const g = games[gameId];
    if (!g) return false;
    const cleared = {
        ...g,
        board: {},
        moveCount: 0,
        started: Array.isArray(g.players) && g.players.length === 2,
        currentTurnClientId: Array.isArray(g.players) && g.players.length ? g.players[0] : null
    };
    await room.updateRoomState({
        goGames: {
            [gameId]: cleared
        }
    });
    room.send({ type: 'go-reset', gameId, echo: true });
    return true;
}

/**
 * Wire the Go engine into the multiplayer lifecycle: initialize and start listening to go events.
 * Call from your multiplayer bootstrap (we auto-call this in startMultiplayer).
 */
function _wireGoEngine(room) {
    if (!room) return;
    initGoEngine(room);

    // Listen for go-move and go-reset events to show overlays or play sounds
    const previousOnMessage = room.onmessage;
    room.onmessage = (ev) => {
        try {
            const data = ev.data;
            if (!data) return;
            switch (data.type) {
                case 'go-move':
                    // Minimal overlay: briefly show who played where
                    const el = document.createElement('div');
                    el.textContent = `${data.player} placed ${data.color} at ${data.x},${data.y}`;
                    el.style.position = 'fixed';
                    el.style.left = '50%';
                    el.style.top = '8%';
                    el.style.transform = 'translateX(-50%)';
                    el.style.background = 'rgba(0,0,0,0.6)';
                    el.style.color = '#FFD700';
                    el.style.padding = '6px 12px';
                    el.style.borderRadius = '8px';
                    el.style.zIndex = 9999;
                    document.body.appendChild(el);
                    setTimeout(() => el.remove(), 1400);
                    break;
                case 'go-reset':
                    // show reset notice
                    const r = document.createElement('div');
                    r.textContent = `Go board reset`;
                    r.style.position = 'fixed';
                    r.style.left = '50%';
                    r.style.top = '11%';
                    r.style.transform = 'translateX(-50%)';
                    r.style.background = 'rgba(0,0,0,0.6)';
                    r.style.color = '#FF7FA6';
                    r.style.padding = '6px 12px';
                    r.style.borderRadius = '8px';
                    r.style.zIndex = 9999;
                    document.body.appendChild(r);
                    setTimeout(() => r.remove(), 1200);
                    break;
            }
        } catch (e) { console.error(e); }
        if (typeof previousOnMessage === 'function') previousOnMessage(ev);
    };

    // Optional periodic tick (if enabled)
    if (GO_TICK_SECONDS > 0 && !_wireGoEngine._tickScheduled) {
        _wireGoEngine._tickScheduled = setInterval(() => {
            // noop for now — useful hook for future auto-scoring or pruning old games
            const state = room.roomState || {};
            const games = state.goGames || {};
            const keys = Object.keys(games);
            if (keys.length > GO_MAX_GAMES) {
                // prune oldest by created_at (best-effort)
                const sorted = keys.map(k => ({ k, t: games[k].created_at || '' })).sort((a,b) => a.t.localeCompare(b.t));
                const toRemove = sorted.slice(0, sorted.length - GO_MAX_GAMES).map(s => s.k);
                const patch = {};
                toRemove.forEach(k => patch[k] = null);
                room.updateRoomState({ goGames: patch });
            }
        }, GO_TICK_SECONDS * 1000);
    }
}

/* Auto-wire into multiplayer start */
(function __attachGoWireup() {
    // Patch startMultiplayer to call _wireGoEngine after initialize.
    const originalStart = startMultiplayer;
    startMultiplayer = function (room, username, avatarUrl) {
        originalStart(room, username, avatarUrl);
        try {
            _wireGoEngine(room);
        } catch (e) {
            console.warn('Failed to wire Go engine:', e);
        }
    };
})();