/**
 * ==========================================================================
 * 3D CHESS ODYSSEY - UTILITIES MODULE
 * ==========================================================================
 * Provides agnostic operational toolsets across the system architecture.
 */

window.ChessUtils = (function () {

    /**
     * Clamps a numeric value securely between a minimum and maximum boundary
     * @param {number} val - Input target value
     * @param {number} min - Lower cap bound ceiling
     * @param {number} max - Upper cap bound floor
     * @returns {number} The safely bound clamped result
     */
    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    /**
     * Performs a performance-safe deep object structure replication
     * Useful for parsing quick, unlinked snapshot matrices to the AI evaluator
     * @param {Object|Array} obj - The item structurally passed down for cloning
     * @returns {Object|Array} A mirrored standalone duplicate footprint instance
     */
    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;

        // Handle specific Array instances fast
        if (Array.isArray(obj)) {
            const arrClone = [];
            for (let i = 0; i < obj.length; i++) {
                arrClone[i] = deepClone(obj[i]);
            }
            return arrClone;
        }

        // Handle standard key-value configuration Objects
        const objClone = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                objClone[key] = deepClone(obj[key]);
            }
        }
        return objClone;
    }

    /**
     * Safely updates a string-mapped setting partition inside browser Storage
     * @param {string} key - Dedicated allocation key name
     * @param {any} value - Value configuration payload data
     */
    function saveToLocalStorage(key, value) {
        try {
            const serializedData = JSON.stringify(value);
            localStorage.setItem(key, serializedData);
        } catch (error) {
            console.warn(`Local Storage transaction write fault encountered on key [${key}]:`, error);
        }
    }

    /**
     * Reads and parses structural settings configurations from browser memory
     * @param {string} key - Dedicated allocation key name
     * @param {any} fallback - Default execution state if missing matching data
     * @returns {any} Stored payload execution variables or default data mappings
     */
    function loadFromLocalStorage(key, fallback) {
        try {
            const storedItem = localStorage.getItem(key);
            return storedItem !== null ? JSON.parse(storedItem) : fallback;
        } catch (error) {
            console.warn(`Local Storage transaction read fault encountered on key [${key}]. Reverting to fallback profile:`, error);
            return fallback;
        }
    }

    // Module Exports
    return {
        clamp: clamp,
        deepClone: deepClone,
        saveSettings: saveToLocalStorage,
        loadSettings: loadFromLocalStorage
    };
})();
