/**
 * ==========================================================================
 * 3D CHESS ODYSSEY - CONTROLS MODULE
 * ==========================================================================
 * Manages user mouse interactions, piece selection via 3D Raycasting, 
 * tile highlighting, and camera view state adjustments.
 */

window.ControlsManager = (function () {
    let raycaster, mouse;
    let selectedPieceMesh = null;
    let highlightedSquares = [];

    // Visual configurations for tile states
    const HIGHLIGHT_COLORS = {
        selected: 0x22c55e, // Green
        validMove: 0x3b82f6 // Blue
    };

    /**
     * Initializes structural listeners on the 3D Canvas
     */
    function init(containerId) {
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        const container = document.getElementById(containerId);
        if (!container) return;

        // Mouse Down pointer event capture
        container.addEventListener('pointerdown', onPointerDown);

        // Map auxiliary HUD rotation controls buttons
        const btnRotate = document.getElementById('btn-rotate-camera');
        const btnReset = document.getElementById('btn-reset-camera');

        if (btnRotate) btnRotate.addEventListener('click', flipCameraPerspective);
        if (btnReset) btnReset.addEventListener('click', resetCameraPosition);
    }

    /**
     * Handles 3D world projection interactions on clicks
     */
    function onPointerDown(event) {
        // Only allow interactions if it's a human's turn
        if (!window.GameEngine.isGameActive()) return;
        if (window.GameEngine.getCurrentTurn() === 'black' && isAIMatch()) return;

        const camera = window.Board3D.getCamera();
        const scene = window.Board3D.getScene();
        const container = event.currentTarget;

        // Calculate normalized device coordinates (-1 to +1) for ray projection
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // Collate list of interactive objects (squares + pieces)
        const targets = [...window.Board3D.getSquares(), ...window.PiecesManager.getActivePieces()];
        const intersects = raycaster.intersectObjects(targets, true);

        if (intersects.length > 0) {
            // Traverse upward until encountering standard userData attachments
            let hitObject = intersects[0].object;
            while (hitObject.parent && !hitObject.userData.isSquare && !hitObject.userData.isPiece) {
                hitObject = hitObject.parent;
            }

            handleInteractionHit(hitObject.userData, hitObject);
        } else {
            clearSelection();
        }
    }

    /**
     * Orchestrates logical decision flows depending on what type of object was targeted
     */
    function handleInteractionHit(data, mesh) {
        const activeTurn = window.GameEngine.getCurrentTurn();

        // SCENARIO A: User clicked on a piece
        if (data.isPiece) {
            if (data.team === activeTurn) {
                // Select your own piece
                clearSelection();
                selectedPieceMesh = mesh;
                highlightSquareMesh(mesh.userData.row, mesh.userData.col, HIGHLIGHT_COLORS.selected);
                previewValidMoves(mesh.userData.row, mesh.userData.col);
            } else if (selectedPieceMesh) {
                // Opponent piece selected while possessing an active selection -> Attempt Capture
                attemptMoveExecution(selectedPieceMesh.userData.row, selectedPieceMesh.userData.col, data.row, data.col);
            }
        } 
        // SCENARIO B: User clicked on an empty square
        else if (data.isSquare && selectedPieceMesh) {
            attemptMoveExecution(selectedPieceMesh.userData.row, selectedPieceMesh.userData.col, data.row, data.col);
        }
    }

    /**
     * Dispatches validated vector trajectories over to the central GameEngine
     */
    function attemptMoveExecution(fR, fC, tR, tC) {
        const success = window.GameEngine.executeMove(fR, fC, tR, tC);
        clearSelection();
    }

    /**
     * Temporarily colors background mesh squares to indicate logical pathways
     */
    function highlightSquareMesh(row, col, hexColor) {
        const squares = window.Board3D.getSquares();
        const targetSquare = squares.find(s => s.userData.row === row && s.userData.col === col);
        
        if (targetSquare) {
            // Cache reference to original hex color definitions if missing
            if (!targetSquare.userData.originalColor) {
                targetSquare.userData.originalColor = targetSquare.material.color.getHex();
            }
            targetSquare.material.color.setHex(hexColor);
            highlightedSquares.push(targetSquare);
        }
    }

    /**
     * Queries valid movement locations and paints coordinates blue
     */
    function previewValidMoves(row, col) {
        const virtualBoard = window.GameEngine.getVirtualBoard();
        
        // Basic projection map showing reachable zones on the matrix
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                // For demonstration, highlight open spaces and enemy positions within standard limits
                if (r !== row || c !== col) {
                    const cell = virtualBoard[r][c];
                    if (!cell || cell.team !== virtualBoard[row][col].team) {
                        highlightSquareMesh(r, c, HIGHLIGHT_COLORS.validMove);
                    }
                }
            }
        }
    }

    /**
     * Reverts altered board square meshes back to original theme states
     */
    function clearSelection() {
        selectedPieceMesh = null;
        highlightedSquares.forEach(sq => {
            if (sq.userData.originalColor !== undefined) {
                sq.material.color.setHex(sq.userData.originalColor);
            }
        });
        highlightedSquares = [];
    }

    /**
     * Rotates camera system around board configurations smoothly
     */
    function flipCameraPerspective() {
        const camera = window.Board3D.getCamera();
        if (!camera) return;

        // Invert polar trajectory arrays 
        const targetX = -camera.position.x;
        const targetZ = -camera.position.z;

        if (window.AnimationEngine) {
            window.AnimationEngine.panCamera(camera, targetX, camera.position.y, targetZ);
        } else {
            camera.position.set(targetX, camera.position.y, targetZ);
        }
    }

    function resetCameraPosition() {
        const camera = window.Board3D.getCamera();
        if (camera) camera.position.set(0, 10, 8);
    }

    function isAIMatch() {
        // Internal evaluation to bypass selection while AI is active
        return document.getElementById('player2-card').innerHTML.includes('fa-robot');
    }

    // Module Exports
    return {
        init: init,
        clearSelection: clearSelection
    };
})();
                                 
