/**
 * ==========================================================================
 * 3D CHESS ODYSSEY - SOUND EFFECTS MODULE
 * ==========================================================================
 * Synthesizes real-time sound effects procedurally via the Web Audio API.
 * Bypasses external asset latency barriers for structural efficiency.
 */

window.SoundManager = (function () {
    let audioCtx = null;
    let masterGainNode = null;
    let isMuted = false;

    /**
     * Initializes the central Audio Engine context structures
     * @param {boolean} systemSoundEnabled - Primary state setup variable
     */
    function init(systemSoundEnabled) {
        isMuted = !systemSoundEnabled;
        
        // Setup listener hooks to unlock programmatic audio on first user touch (Browser Security compliance)
        const unlockAudio = () => {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                masterGainNode = audioCtx.createGain();
                masterGainNode.gain.setValueAtTime(isMuted ? 0 : 0.8, audioCtx.currentTime);
                masterGainNode.connect(audioCtx.destination);
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            // Strip clean once interactive authorization loop finishes
            document.removeEventListener('pointerdown', unlockAudio);
        };
        
        document.addEventListener('pointerdown', unlockAudio);
    }

    /**
     * Triggers procedural generation calculations mapping back to audio triggers
     * @param {string} type - 'move' | 'capture'
     */
    function play(type) {
        if (isMuted || !audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const time = audioCtx.currentTime;

        switch (type) {
            case 'move':
                // Synthesize a soft, organic wooden sliding/tapping texture
                executeProceduralTap(time, 240, 0.04, 0.08);
                break;
            case 'capture':
                // Synthesize a sharper, resonant collision knock impact
                executeProceduralTap(time, 180, 0.02, 0.22);
                executeProceduralTap(time + 0.02, 110, 0.01, 0.15); // Layered tail ring
                break;
        }
    }

    /**
     * Internal synthesis pipeline rendering sound waves dynamically
     */
    function executeProceduralTap(startTime, frequency, attack, release) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = 'triangle'; // Softer, wood-like timber harmonic footprint
        osc.frequency.setValueAtTime(frequency, startTime);
        // Subtle pitch drop over time to mimic physical acoustic energy absorption
        osc.frequency.exponentialRampToValueAtTime(frequency * 0.6, startTime + attack + release);

        // Envelope configurations
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(1, startTime + attack);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + attack + release);

        // Map components through routing architecture
        osc.connect(gainNode);
        gainNode.connect(masterGainNode);

        // Spin engine execution state parameters
        osc.start(startTime);
        osc.stop(startTime + attack + release);
    }

    /**
     * Toggles global master gain volumes instantly
     */
    function setMute(muteState) {
        isMuted = muteState;
        if (masterGainNode && audioCtx) {
            masterGainNode.gain.setValueAtTime(isMuted ? 0 : 0.8, audioCtx.currentTime);
        }
    }

    // Module Exports
    return {
        init: init,
        play: play,
        setMute: setMute
    };
})();
