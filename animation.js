/**
 * ==========================================================================
 * 3D CHESS ODYSSEY - ANIMATION MODULE
 * ==========================================================================
 * Core linear interpolation (LERP) and transition framework for smooth piece 
 * movement animations and camera translations within the 3D space.
 */

window.AnimationEngine = (function () {
    // Structural queue containing operational transform updates running on ticker loops
    const activeAnimations = [];

    /**
     * Initializes the animation framework loop hooks
     */
    function init() {
        // Core rendering pulse hook loop
        executeTick();
    }

    /**
     * Interpolates a piece mesh smoothly from its current position to target board coordinates
     * @param {THREE.Group} pieceMesh - The 3D piece container mesh
     * @param {number} targetRow - Destination matrix row
     * @param {number} targetCol - Destination matrix column
     * @param {number} duration - Time duration of transition in milliseconds
     */
    function slidePiece(pieceMesh, targetRow, targetCol, duration = 400) {
        if (!pieceMesh) return;

        // Calculate destination absolute 3D coordinate vector
        const endPosition = window.Board3D.getSquareWorldPosition(targetRow, targetCol);
        const startPosition = pieceMesh.position.clone();
        
        const startTime = performance.now();

        const animationTrack = {
            type: 'piece_slide',
            mesh: pieceMesh,
            update: function (currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // --- Cosine Easing formulation for natural deceleration curves ---
                const easeProgress = 1 - Math.cos((progress * Math.PI) / 2);

                // Linear Interpolation vector assignment
                pieceMesh.position.lerpVectors(startPosition, endPosition, easeProgress);

                // Peak lift (arc height) calculation mid-flight to look like a physical hand lift
                const peakHeight = 0.6;
                pieceMesh.position.y = Math.sin(progress * Math.PI) * peakHeight;

                // Return boolean termination state flag
                if (progress >= 1) {
                    pieceMesh.position.copy(endPosition); // Hard snap alignment validation
                    return true; // Finished, remove from register pipeline
                }
                return false; 
            }
        };

        activeAnimations.push(animationTrack);
    }

    /**
     * Pans the camera smoothly to a target Vector orientation position
     */
    function panCamera(camera, targetX, targetY, targetZ, duration = 600) {
        if (!camera) return;

        const startPos = camera.position.clone();
        const endPos = new THREE.Vector3(targetX, targetY, targetZ);
        const startTime = performance.now();

        const animationTrack = {
            type: 'camera_pan',
            mesh: camera,
            update: function (currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Smooth Step evaluation parameter
                const smoothProgress = progress * progress * (3 - 2 * progress);

                camera.position.lerpVectors(startPos, endPos, smoothProgress);

                return progress >= 1;
            }
        };

        activeAnimations.push(animationTrack);
    }

    /**
     * Ticker loop parsing frame updates across array sets
     */
    function executeTick() {
        requestAnimationFrame(executeTick);
        
        if (activeAnimations.length === 0) return;

        const timestamp = performance.now();

        // Process loops backward to cleanly remove items mid-iteration
        for (let i = activeAnimations.length - 1; i >= 0; i--) {
            const complete = activeAnimations[i].update(timestamp);
            if (complete) {
                activeAnimations.splice(i, 1);
            }
        }
    }

    // Run engine tick loop immediately on parse initialization
    init();

    // Module Exports
    return {
        slidePiece: slidePiece,
        panCamera: panCamera,
        getActiveCount: () => activeAnimations.length
    };
})();
      
