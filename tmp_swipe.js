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
